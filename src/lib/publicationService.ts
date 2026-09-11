import { db, auth } from "./firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  setDoc
} from "firebase/firestore";

export type PublicationStatus = "published" | "draft" | "hidden" | "archived" | "deleted";

export interface PublicationItem {
  id: string;
  userId: string;
  authorName?: string;
  authorArtisticName?: string;
  authorAvatar?: string;
  caption?: string;
  content?: string;
  mediaUrl?: string;
  videoUrl?: string;
  storagePath?: string;
  appliedFilter?: string;
  status: PublicationStatus;
  visible?: boolean;
  createdAt?: string;
  updatedAt?: string;
  likesCount?: number;
  commentsCount?: number;
  [key: string]: any;
}

export class PublicationService {
  /**
   * Helper to retrieve Firebase ID Token
   */
  private async getIdToken(): Promise<string | undefined> {
    const user = auth.currentUser;
    if (user) {
      try {
        return await user.getIdToken();
      } catch (_) {}
    }
    return undefined;
  }

  /**
   * Update the status of a publication (published, hidden, archived)
   */
  async updateStatus(
    postId: string,
    userId: string,
    newStatus: "published" | "hidden" | "archived"
  ): Promise<boolean> {
    if (!db || !postId || !userId) return false;

    const currentUid = auth.currentUser?.uid || userId;
    if (currentUid !== userId) {
      console.warn("[PublicationService] Avertissement permission : ID utilisateur incompatible");
    }

    const visible = newStatus === "published";
    const updatedAt = new Date().toISOString();

    let updated = false;

    // 1. Update in 'posts' collection
    try {
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        await updateDoc(postRef, {
          status: newStatus,
          visible,
          updatedAt,
        });
        updated = true;
      } else {
        // Query by id field
        const q = query(collection(db, "posts"), where("id", "==", postId));
        const snap = await getDocs(q);
        for (const dDoc of snap.docs) {
          await updateDoc(doc(db, "posts", dDoc.id), {
            status: newStatus,
            visible,
            updatedAt,
          });
          updated = true;
        }
      }
    } catch (err) {
      console.warn("[PublicationService] Erreur mise à jour 'posts' :", err);
    }

    // 2. Update in 'social_posts' collection
    try {
      const socialRef = doc(db, "social_posts", postId);
      const socialSnap = await getDoc(socialRef);
      if (socialSnap.exists()) {
        await updateDoc(socialRef, {
          status: newStatus,
          visible,
          updatedAt,
        });
        updated = true;
      } else {
        const q = query(collection(db, "social_posts"), where("id", "==", postId));
        const snap = await getDocs(q);
        for (const dDoc of snap.docs) {
          await updateDoc(doc(db, "social_posts", dDoc.id), {
            status: newStatus,
            visible,
            updatedAt,
          });
          updated = true;
        }
      }
    } catch (err) {
      console.warn("[PublicationService] Erreur mise à jour 'social_posts' :", err);
    }

    // 3. Update in user's mediaGallery array
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const gallery = Array.isArray(userData.mediaGallery) ? userData.mediaGallery : [];
        let modified = false;

        const newGallery = gallery.map((item: any) => {
          if (item.id === postId || item.url === postId || item.videoUrl === postId) {
            modified = true;
            return {
              ...item,
              status: newStatus,
              visible,
              updatedAt,
            };
          }
          return item;
        });

        if (modified) {
          await updateDoc(userRef, { mediaGallery: newGallery });
          updated = true;
        }
      }
    } catch (err) {
      console.warn("[PublicationService] Erreur mise à jour user mediaGallery :", err);
    }

    return updated;
  }

  /**
   * Permanently delete a publication and clean up dedicated R2 storage if requested
   */
  async deletePermanently(
    postId: string,
    userId: string,
    storagePath?: string
  ): Promise<boolean> {
    if (!db || !postId || !userId) return false;

    const idToken = await this.getIdToken();

    // 1. Delete from 'posts'
    try {
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        await deleteDoc(postRef);
      } else {
        const q = query(collection(db, "posts"), where("id", "==", postId));
        const snap = await getDocs(q);
        for (const dDoc of snap.docs) {
          await deleteDoc(doc(db, "posts", dDoc.id));
        }
      }
    } catch (err) {
      console.warn("[PublicationService] Suppression 'posts' échouée :", err);
    }

    // 2. Delete from 'social_posts'
    try {
      const socialRef = doc(db, "social_posts", postId);
      const socialSnap = await getDoc(socialRef);
      if (socialSnap.exists()) {
        await deleteDoc(socialRef);
      } else {
        const q = query(collection(db, "social_posts"), where("id", "==", postId));
        const snap = await getDocs(q);
        for (const dDoc of snap.docs) {
          await deleteDoc(doc(db, "social_posts", dDoc.id));
        }
      }
    } catch (err) {
      console.warn("[PublicationService] Suppression 'social_posts' échouée :", err);
    }

    // 3. Remove item from user's mediaGallery
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const gallery = Array.isArray(userData.mediaGallery) ? userData.mediaGallery : [];
        const filteredGallery = gallery.filter(
          (item: any) => item.id !== postId && item.url !== postId && item.videoUrl !== postId
        );
        if (filteredGallery.length !== gallery.length) {
          await updateDoc(userRef, { mediaGallery: filteredGallery });
        }
      }
    } catch (err) {
      console.warn("[PublicationService] Suppression user mediaGallery échouée :", err);
    }

    // 4. Delete R2 file ONLY if dedicated storagePath is provided and starts with 'reels/' or 'covers/'
    if (storagePath && (storagePath.startsWith("reels/") || storagePath.startsWith("covers/"))) {
      try {
        await fetch("/api/r2/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({
            key: storagePath,
            idToken,
          }),
        });
      } catch (r2Err) {
        console.warn("[PublicationService] Nettoyage R2 différé :", r2Err);
      }
    }

    return true;
  }
}

export const publicationService = new PublicationService();
