import { VideoEditorState, INITIAL_EDITOR_STATE } from "../components/reels/editorState";
import { db, auth } from "./firebase";
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where } from "firebase/firestore";

export interface ReelDraft {
  id: string;
  userId: string;
  title?: string;
  caption?: string;
  hashtags?: string[];
  appliedFilter?: string;
  videoSourceUrl?: string; // Blob URL, object URL, or R2 storage URL
  videoStoragePath?: string;
  editorState: VideoEditorState;
  videoBlob?: Blob; // Raw file/blob for local IndexedDB persistence
  createdAt: string;
  updatedAt: string;
  status: "draft";
}

const DB_NAME = "afrigombo_reels_drafts_db";
const STORE_NAME = "reels_drafts";
const DB_VERSION = 1;

function openDraftsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB non disponible dans ce navigateur."));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
  });
}

export class ReelsDraftsService {
  /**
   * Save or update a draft locally in IndexedDB and sync metadata to Firestore
   */
  async saveDraft(
    draftInput: {
      id?: string;
      userId: string;
      title?: string;
      caption?: string;
      hashtags?: string[];
      appliedFilter?: string;
      videoSourceUrl?: string;
      videoStoragePath?: string;
      editorState: VideoEditorState;
      videoBlob?: Blob | File;
    }
  ): Promise<ReelDraft> {
    const now = new Date().toISOString();
    const draftId = draftInput.id || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const fullDraft: ReelDraft = {
      id: draftId,
      userId: draftInput.userId,
      title: draftInput.title || draftInput.caption?.substring(0, 30) || "Brouillon Réel",
      caption: draftInput.caption || "",
      hashtags: draftInput.hashtags || [],
      appliedFilter: draftInput.appliedFilter || draftInput.editorState?.filterId || "naturel",
      videoSourceUrl: draftInput.videoSourceUrl || "",
      videoStoragePath: draftInput.videoStoragePath || "",
      editorState: draftInput.editorState || INITIAL_EDITOR_STATE,
      videoBlob: draftInput.videoBlob,
      createdAt: now,
      updatedAt: now,
      status: "draft",
    };

    // 1. Store in IndexedDB
    try {
      const idb = await openDraftsDB();
      await new Promise<void>((resolve, reject) => {
        const tx = idb.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(fullDraft);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn("[ReelsDraftsService] Erreur IndexedDB lors de la sauvegarde :", err);
    }

    // 2. Sync lightweight metadata to Firestore if online
    if (db && draftInput.userId) {
      try {
        const draftRef = doc(db, "user_drafts", draftId);
        const firestorePayload = {
          id: draftId,
          userId: draftInput.userId,
          title: fullDraft.title,
          caption: fullDraft.caption,
          hashtags: fullDraft.hashtags,
          appliedFilter: fullDraft.appliedFilter,
          videoSourceUrl: fullDraft.videoSourceUrl,
          videoStoragePath: fullDraft.videoStoragePath,
          editorState: JSON.parse(JSON.stringify(fullDraft.editorState)),
          status: "draft",
          createdAt: fullDraft.createdAt,
          updatedAt: fullDraft.updatedAt,
        };
        await setDoc(draftRef, firestorePayload, { merge: true });
      } catch (fsErr) {
        console.warn("[ReelsDraftsService] Sync Firestore brouillon différé :", fsErr);
      }
    }

    return fullDraft;
  }

  /**
   * Get all drafts for a user from IndexedDB and merge with Firestore metadata
   */
  async getUserDrafts(userId: string): Promise<ReelDraft[]> {
    const draftsMap = new Map<string, ReelDraft>();

    // 1. Fetch from IndexedDB
    try {
      const idb = await openDraftsDB();
      const localDrafts = await new Promise<ReelDraft[]>((resolve, reject) => {
        const tx = idb.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const index = store.index("userId");
        const req = index.getAll(userId);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      localDrafts.forEach((d) => draftsMap.set(d.id, d));
    } catch (err) {
      console.warn("[ReelsDraftsService] Récupération IndexedDB échouée :", err);
    }

    // 2. Fetch from Firestore if db is available
    if (db && userId) {
      try {
        const q = query(collection(db, "user_drafts"), where("userId", "==", userId));
        const snap = await getDocs(q);
        snap.forEach((dDoc) => {
          const data = dDoc.data() as any;
          if (data && data.id) {
            const existing = draftsMap.get(data.id);
            draftsMap.set(data.id, {
              ...data,
              videoBlob: existing?.videoBlob || undefined,
            });
          }
        });
      } catch (fsErr) {
        console.warn("[ReelsDraftsService] Récupération Firestore brouillons échouée :", fsErr);
      }
    }

    const list = Array.from(draftsMap.values());
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }

  /**
   * Get a single draft by ID
   */
  async getDraftById(draftId: string): Promise<ReelDraft | null> {
    // 1. Try IndexedDB first (contains raw video blob)
    try {
      const idb = await openDraftsDB();
      const localDraft = await new Promise<ReelDraft | null>((resolve, reject) => {
        const tx = idb.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(draftId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
      if (localDraft) return localDraft;
    } catch (_) {}

    // 2. Fallback to Firestore
    if (db && draftId) {
      try {
        const ref = doc(db, "user_drafts", draftId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          return snap.data() as ReelDraft;
        }
      } catch (_) {}
    }

    return null;
  }

  /**
   * Delete a draft with permission validation
   */
  async deleteDraft(draftId: string, userId: string): Promise<boolean> {
    let deleted = false;

    // 1. Remove from IndexedDB
    try {
      const idb = await openDraftsDB();
      await new Promise<void>((resolve, reject) => {
        const tx = idb.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(draftId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      deleted = true;
    } catch (err) {
      console.warn("[ReelsDraftsService] Suppression IndexedDB échouée :", err);
    }

    // 2. Remove from Firestore
    if (db && draftId) {
      try {
        const ref = doc(db, "user_drafts", draftId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.userId === userId || auth.currentUser?.uid === userId) {
            await deleteDoc(ref);
            deleted = true;
          }
        }
      } catch (fsErr) {
        console.warn("[ReelsDraftsService] Suppression Firestore brouillon échouée :", fsErr);
      }
    }

    return deleted;
  }
}

export const reelsDraftsService = new ReelsDraftsService();
