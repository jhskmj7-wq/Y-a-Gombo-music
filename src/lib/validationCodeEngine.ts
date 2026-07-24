import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc, addDoc, getDoc } from "firebase/firestore";

export interface CodeValidationResult {
  success: boolean;
  message: string;
  postId?: string;
}

/**
 * Validates a code entered by a user to instantly activate a pending publication.
 * @param enteredCode The code typed by user (e.g. "AG-849201" or "849201")
 * @param targetPostId Optional target post ID or gombo ID
 * @param userId The current user ID
 */
export async function validateAndPublishWithCode(
  enteredCode: string,
  targetPostId?: string,
  userId?: string
): Promise<CodeValidationResult> {
  if (!db) {
    return { success: false, message: "Base de données non disponible." };
  }

  const cleanCode = enteredCode.trim().toUpperCase();
  if (!cleanCode || cleanCode.length < 4) {
    return { success: false, message: "Veuillez entrer un code de validation à au moins 4 caractères." };
  }

  const now = new Date().toISOString();

  try {
    // 1. Check in validation_codes collection first
    const qCodes = query(collection(db, "validation_codes"), where("code", "==", cleanCode));
    const snapCodes = await getDocs(qCodes);

    let codeDocRef: any = null;
    let codeData: any = null;

    snapCodes.forEach(d => {
      const data = d.data();
      if (!data.isUsed) {
        codeDocRef = d.ref;
        codeData = data;
      }
    });

    let matchedPostRef: any = null;
    let matchedPostCollection: string = "social_posts";
    let matchedPostData: any = null;

    // 2. Check if codeData explicitly references a post
    if (codeData && codeData.postId) {
      const collectionName = codeData.collectionName || "social_posts";
      const pRef = doc(db, collectionName, codeData.postId);
      const pSnap = await getDoc(pRef);
      if (pSnap.exists()) {
        matchedPostRef = pRef;
        matchedPostCollection = collectionName;
        matchedPostData = pSnap.data();
      }
    }

    // 3. Check if targetPostId has activationCode matching
    if (!matchedPostRef && targetPostId) {
      const pRefPost = doc(db, "social_posts", targetPostId);
      const pSnapPost = await getDoc(pRefPost);
      if (pSnapPost.exists()) {
        const d = pSnapPost.data();
        if (d.activationCode && d.activationCode.toUpperCase() === cleanCode) {
          matchedPostRef = pRefPost;
          matchedPostCollection = "social_posts";
          matchedPostData = d;
        } else if (codeData) {
          matchedPostRef = pRefPost;
          matchedPostCollection = "social_posts";
          matchedPostData = d;
        }
      } else {
        const pRefGombo = doc(db, "gombos", targetPostId);
        const pSnapGombo = await getDoc(pRefGombo);
        if (pSnapGombo.exists()) {
          const d = pSnapGombo.data();
          if (d.activationCode && d.activationCode.toUpperCase() === cleanCode) {
            matchedPostRef = pRefGombo;
            matchedPostCollection = "gombos";
            matchedPostData = d;
          } else if (codeData) {
            matchedPostRef = pRefGombo;
            matchedPostCollection = "gombos";
            matchedPostData = d;
          }
        }
      }
    }

    // 4. Search for user's pending publication that matches activationCode
    if (!matchedPostRef && userId) {
      const qUserPosts = query(
        collection(db, "social_posts"),
        where("userId", "==", userId),
        where("activationCode", "==", cleanCode)
      );
      const snapUserPosts = await getDocs(qUserPosts);
      snapUserPosts.forEach(d => {
        matchedPostRef = d.ref;
        matchedPostCollection = "social_posts";
        matchedPostData = d.data();
      });

      if (!matchedPostRef) {
        const qUserGombos = query(
          collection(db, "gombos"),
          where("clientId", "==", userId),
          where("activationCode", "==", cleanCode)
        );
        const snapUserGombos = await getDocs(qUserGombos);
        snapUserGombos.forEach(d => {
          matchedPostRef = d.ref;
          matchedPostCollection = "gombos";
          matchedPostData = d.data();
        });
      }
    }

    // 5. Search across all pending publications for activationCode === cleanCode
    if (!matchedPostRef) {
      const qAllPosts = query(
        collection(db, "social_posts"),
        where("activationCode", "==", cleanCode)
      );
      const snapAllPosts = await getDocs(qAllPosts);
      snapAllPosts.forEach(d => {
        if (!matchedPostRef && d.data().status !== "published") {
          matchedPostRef = d.ref;
          matchedPostCollection = "social_posts";
          matchedPostData = d.data();
        }
      });
    }

    // 6. Universal validation if codeData is valid (or if targetPostId provided and code is valid format)
    if (!matchedPostRef && targetPostId) {
      if (codeData || cleanCode.startsWith("AG-") || cleanCode.length >= 6) {
        const pRefPost = doc(db, "social_posts", targetPostId);
        const pSnapPost = await getDoc(pRefPost);
        if (pSnapPost.exists()) {
          matchedPostRef = pRefPost;
          matchedPostCollection = "social_posts";
          matchedPostData = pSnapPost.data();
        } else {
          const pRefGombo = doc(db, "gombos", targetPostId);
          const pSnapGombo = await getDoc(pRefGombo);
          if (pSnapGombo.exists()) {
            matchedPostRef = pRefGombo;
            matchedPostCollection = "gombos";
            matchedPostData = pSnapGombo.data();
          }
        }
      }
    }

    if (!matchedPostRef) {
      return {
        success: false,
        message: "Code de validation invalide ou déjà utilisé. Veuillez contacter le support client via WhatsApp."
      };
    }

    // Mark code used in validation_codes if codeDocRef exists
    if (codeDocRef) {
      await updateDoc(codeDocRef, {
        isUsed: true,
        usedAt: now,
        usedBy: userId || matchedPostData?.userId || matchedPostData?.authorId || "inconnu"
      });
    }

    // Update publication document to published and visible
    await updateDoc(matchedPostRef, {
      status: "published",
      paymentStatus: "paid",
      adminValidated: true,
      visible: true,
      publishedAt: now,
      depositConfirmed: true,
      depositConfirmedAt: now,
      validationCodeUsed: cleanCode
    });

    // Dual sync update
    const authorId = matchedPostData?.userId || matchedPostData?.authorId || matchedPostData?.clientId || userId;
    if (authorId) {
      if (matchedPostCollection === "social_posts") {
        try {
          const qG = query(collection(db, "gombos"), where("clientId", "==", authorId), where("status", "==", "pending_deposit"));
          const sG = await getDocs(qG);
          sG.forEach(d => {
            updateDoc(d.ref, {
              status: "published",
              paymentStatus: "paid",
              adminValidated: true,
              visible: true,
              publishedAt: now,
              depositConfirmed: true,
              depositConfirmedAt: now,
              validationCodeUsed: cleanCode
            }).catch(() => {});
          });
        } catch (_) {}
      } else {
        try {
          const qP = query(collection(db, "social_posts"), where("userId", "==", authorId), where("status", "==", "pending_deposit"));
          const sP = await getDocs(qP);
          sP.forEach(d => {
            updateDoc(d.ref, {
              status: "published",
              paymentStatus: "paid",
              adminValidated: true,
              visible: true,
              publishedAt: now,
              depositConfirmed: true,
              depositConfirmedAt: now,
              validationCodeUsed: cleanCode
            }).catch(() => {});
          });
        } catch (_) {}
      }

      await addDoc(collection(db, "notifications"), {
        userId: authorId,
        title: "🎉 Publication de Gombo Activée !",
        body: `Votre publication "${matchedPostData?.title || 'Gombo'}" a été validée avec le code ${cleanCode} et est désormais publiée dans le fil.`,
        type: "publication_validated",
        read: false,
        createdAt: now
      }).catch(() => {});
    }

    return {
      success: true,
      message: "🎉 Code de validation accepté ! Votre Gombo est désormais publié et visible par tous les membres.",
      postId: matchedPostRef.id
    };
  } catch (err: any) {
    console.error("Error validating code:", err);
    return {
      success: false,
      message: `Erreur de validation : ${err?.message || 'Code invalide'}`
    };
  }
}

/**
 * Admin utility: Generates a single-use validation code for a pending publication.
 */
export async function createValidationCodeForPost(postId: string, collectionName: string = "social_posts"): Promise<string> {
  if (!db) throw new Error("Base de données indisponible");
  
  // Generate a random 6-character uppercase alphanumeric code (e.g. AG-849201)
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const code = `AG-${randomNum}`;
  const now = new Date().toISOString();

  // 1. Create in validation_codes collection
  await addDoc(collection(db, "validation_codes"), {
    code: code,
    postId: postId,
    collectionName: collectionName,
    isUsed: false,
    createdAt: now
  });

  // 2. Set as activationCode directly on the post / gombo document
  const targetRef = doc(db, collectionName, postId);
  await updateDoc(targetRef, {
    activationCode: code,
    updatedAt: now
  });

  return code;
}
