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

/**
 * Normalise un chemin de stockage (Cloudflare R2 / Firebase Storage).
 */
export function normalizeStoragePath(path: any): string | null {
  if (typeof path !== "string") return null;
  const trimmed = path.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Normalise une URL média en retirant les paramètres de requête et fragments,
 * et en convertissant en minuscules pour comparaison stricte.
 */
export function normalizeMediaUrl(url: any): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const parsed = new URL(trimmed);
      return (parsed.origin + parsed.pathname).toLowerCase();
    }
  } catch (_) {}
  return trimmed.split("?")[0].split("#")[0].toLowerCase();
}

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
  featuredInPortfolio?: boolean;
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
   * Toggle the featuredInPortfolio state for a publication (PRO / ELITE feature)
   */
  async togglePortfolioFeatured(postId: string, featured: boolean): Promise<boolean> {
    if (!db || !postId) return false;
    const updatedAt = new Date().toISOString();
    try {
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        await updateDoc(postRef, {
          featuredInPortfolio: featured,
          updatedAt,
        });
        return true;
      } else {
        const q = query(collection(db, "posts"), where("id", "==", postId));
        const snap = await getDocs(q);
        for (const dDoc of snap.docs) {
          await updateDoc(doc(db, "posts", dDoc.id), {
            featuredInPortfolio: featured,
            updatedAt,
          });
        }
        return true;
      }
    } catch (err) {
      console.error("[PublicationService] Erreur togglePortfolioFeatured:", err);
      return false;
    }
  }

  /**
   * Permanently delete a publication with strict media-based twin deduplication and safe cleanup
   */
  async deletePermanently(
    postId: string,
    userId?: string,
    storagePath?: string,
    mediaUrl?: string,
    sourceCollection?: "posts" | "social_posts" | "gombos"
  ): Promise<boolean> {
    if (!db || !postId) return false;

    // Règle 9 : Ne PAS toucher aux Gombos (suppression uniquement du document gombos)
    if (sourceCollection === "gombos") {
      try {
        await deleteDoc(doc(db, "gombos", postId));
        return true;
      } catch (err) {
        console.warn("[PublicationService] Erreur suppression Gombo :", err);
        return false;
      }
    }

    const idToken = await this.getIdToken();

    // 1. Détection et extraction des métadonnées réelles du document ciblé
    let primaryCollection: "posts" | "social_posts" = sourceCollection === "social_posts" ? "social_posts" : "posts";
    let targetDocData: any = null;
    let targetDocRef = doc(db, primaryCollection, postId);
    let targetDocSnap = await getDoc(targetDocRef).catch(() => null);

    // Si non trouvé dans la collection demandée et que sourceCollection n'était pas explicite, vérifier l'autre collection
    if ((!targetDocSnap || !targetDocSnap.exists()) && !sourceCollection) {
      const altRef = doc(db, "social_posts", postId);
      const altSnap = await getDoc(altRef).catch(() => null);
      if (altSnap && altSnap.exists()) {
        primaryCollection = "social_posts";
        targetDocRef = altRef;
        targetDocSnap = altSnap;
      }
    }

    // Récupérer les données réelles du document
    if (targetDocSnap && targetDocSnap.exists()) {
      targetDocData = targetDocSnap.data();
    } else {
      // Recherche secondaire si l'identifiant est stocké dans le champ `id`
      const q = query(collection(db, primaryCollection), where("id", "==", postId));
      const qSnap = await getDocs(q).catch(() => null);
      if (qSnap && !qSnap.empty) {
        targetDocRef = doc(db, primaryCollection, qSnap.docs[0].id);
        targetDocData = qSnap.docs[0].data();
      }
    }

    // Détermination de la collection miroir où chercher un éventuel doublon
    const twinCollection: "posts" | "social_posts" = primaryCollection === "posts" ? "social_posts" : "posts";

    // Extraction et normalisation des identifiants médias du document ciblé
    const targetRawStoragePath = (targetDocData?.storagePath || storagePath || "").trim();
    const targetNormStoragePath = normalizeStoragePath(targetRawStoragePath);

    // Récolte exhaustive de toutes les formes réelles de champs médias
    const candidateRawUrls: string[] = [
      targetDocData?.videoUrl,
      targetDocData?.mediaUrl,
      targetDocData?.imageUrl,
      targetDocData?.photoUrl,
      targetDocData?.url,
      mediaUrl,
    ].filter((u): u is string => typeof u === "string" && u.trim().length > 0);

    const targetNormUrls: string[] = candidateRawUrls
      .map(normalizeMediaUrl)
      .filter((u): u is string => Boolean(u));

    const effectiveUserId = targetDocData?.userId || targetDocData?.authorId || userId || "";

    // 2. SUPPRESSION DU DOCUMENT CIBLÉ PRINCIPAL
    try {
      if (targetDocRef) {
        await deleteDoc(targetDocRef);
      }
    } catch (err) {
      console.warn(`[PublicationService] Erreur suppression doc ciblé (${primaryCollection}/${postId}):`, err);
    }

    // 3. RECHERCHE CIBLÉE ET DÉDUPLICATION DANS LA COLLECTION MIROIR
    // Règle d'or : suppression uniquement si le storagePath correspond, ou à défaut l'URL média normalisée.
    // NE JAMAIS supprimer sans preuve absolue de média identique.
    const deletedTwinIds = new Set<string>();
    const hasMediaProofCriteria = Boolean(targetNormStoragePath || targetNormUrls.length > 0);

    if (hasMediaProofCriteria) {
      const twinCandidates = new Map<string, any>();

      // Recherche ciblée 1 : par storagePath exact si disponible
      if (targetRawStoragePath) {
        try {
          const qSp = query(collection(db, twinCollection), where("storagePath", "==", targetRawStoragePath));
          const snapSp = await getDocs(qSp);
          snapSp.forEach((d) => twinCandidates.set(d.id, d.data()));
        } catch (_) {}
      }

      // Recherche ciblée 2 : par URLs exactes
      for (const rawUrl of candidateRawUrls) {
        if (!rawUrl || rawUrl.length < 10) continue;
        try {
          const qVid = query(collection(db, twinCollection), where("videoUrl", "==", rawUrl));
          const snapVid = await getDocs(qVid);
          snapVid.forEach((d) => twinCandidates.set(d.id, d.data()));
        } catch (_) {}

        try {
          const qMed = query(collection(db, twinCollection), where("mediaUrl", "==", rawUrl));
          const snapMed = await getDocs(qMed);
          snapMed.forEach((d) => twinCandidates.set(d.id, d.data()));
        } catch (_) {}

        try {
          const qImg = query(collection(db, twinCollection), where("imageUrl", "==", rawUrl));
          const snapImg = await getDocs(qImg);
          snapImg.forEach((d) => twinCandidates.set(d.id, d.data()));
        } catch (_) {}

        try {
          const qUrl = query(collection(db, twinCollection), where("url", "==", rawUrl));
          const snapUrl = await getDocs(qUrl);
          snapUrl.forEach((d) => twinCandidates.set(d.id, d.data()));
        } catch (_) {}
      }

      // Recherche ciblée 3 : par auteur pour restreindre le champ des candidats sans aucun scan global
      if (effectiveUserId) {
        try {
          const qAuth = query(collection(db, twinCollection), where("authorId", "==", effectiveUserId));
          const snapAuth = await getDocs(qAuth);
          snapAuth.forEach((d) => twinCandidates.set(d.id, d.data()));
        } catch (_) {}

        try {
          const qUser = query(collection(db, twinCollection), where("userId", "==", effectiveUserId));
          const snapUser = await getDocs(qUser);
          snapUser.forEach((d) => twinCandidates.set(d.id, d.data()));
        } catch (_) {}
      }

      // Recherche ciblée 4 : Même ID direct dans la collection miroir si présent
      try {
        const directTwinRef = doc(db, twinCollection, postId);
        const directTwinSnap = await getDoc(directTwinRef);
        if (directTwinSnap.exists()) {
          twinCandidates.set(directTwinSnap.id, directTwinSnap.data());
        }
      } catch (_) {}

      // ÉVALUATION STRICTE DES CANDIDATS :
      // Chaque candidat doit prouver qu'il s'agit du MÊME média via storagePath ou URL normalisée
      for (const [candidateId, candidateData] of twinCandidates.entries()) {
        if (!candidateData) continue;

        const candNormSp = normalizeStoragePath(candidateData.storagePath);
        const candNormUrls = [
          candidateData.videoUrl,
          candidateData.mediaUrl,
          candidateData.imageUrl,
          candidateData.photoUrl,
          candidateData.url,
        ]
          .map(normalizeMediaUrl)
          .filter((u): u is string => Boolean(u));

        let isProvenSameMedia = false;

        // Condition A : Correspondance certaine du storagePath (ex: reels/..._video.mp4)
        if (targetNormStoragePath && candNormSp && targetNormStoragePath === candNormSp) {
          isProvenSameMedia = true;
        }
        // Condition B : À défaut, correspondance d'au moins une URL média normalisée
        else if (targetNormUrls.length > 0 && candNormUrls.some((u) => targetNormUrls.includes(u))) {
          isProvenSameMedia = true;
        }

        // SUPPRESSION EXCLUSIVE DU DOUBLON PROUVÉ
        if (isProvenSameMedia) {
          try {
            await deleteDoc(doc(db, twinCollection, candidateId));
            deletedTwinIds.add(candidateId);
          } catch (delErr) {
            console.warn(`[PublicationService] Erreur suppression doublon ${twinCollection}/${candidateId}:`, delErr);
          }
        }
      }
    }

    // 4. NETTOYAGE SÉCURISÉ DE mediaGallery DANS LE PROFIL UTILISATEUR
    // Règle 5 : Ne supprimer une entrée que si son lien avec la publication supprimée est certain
    // Ne jamais effacer arbitrairement la galerie utilisateur
    if (effectiveUserId) {
      try {
        const userRef = doc(db, "users", effectiveUserId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const gallery = Array.isArray(userData.mediaGallery) ? userData.mediaGallery : [];

          const isCertainGalleryLink = (item: any): boolean => {
            if (!item) return false;
            // 1. Identifiant exact
            if (item.id && (item.id === postId || deletedTwinIds.has(item.id))) {
              return true;
            }
            // 2. StoragePath strictement identique
            const itemSp = normalizeStoragePath(item.storagePath);
            if (targetNormStoragePath && itemSp && itemSp === targetNormStoragePath) {
              return true;
            }
            // 3. URL média normalisée strictement identique
            const itemUrls = [item.url, item.videoUrl, item.mediaUrl]
              .map(normalizeMediaUrl)
              .filter((u): u is string => Boolean(u));
            if (targetNormUrls.length > 0 && itemUrls.some((u) => targetNormUrls.includes(u))) {
              return true;
            }
            return false;
          };

          const filteredGallery = gallery.filter((item: any) => !isCertainGalleryLink(item));
          if (filteredGallery.length !== gallery.length) {
            await updateDoc(userRef, { mediaGallery: filteredGallery });
          }
        }
      } catch (err) {
        console.warn("[PublicationService] Suppression user mediaGallery échouée :", err);
      }
    }

    // 5. Nettoyage R2 si storagePath dédié fourni et commençant par 'reels/' ou 'covers/'
    const finalR2Path = targetRawStoragePath || storagePath;
    if (finalR2Path && (finalR2Path.startsWith("reels/") || finalR2Path.startsWith("covers/"))) {
      try {
        await fetch("/api/r2/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({
            key: finalR2Path,
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
