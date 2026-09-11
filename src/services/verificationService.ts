import { doc, getDoc, getDocs, collection, query, where, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { formatGomboIdDisplay, getGomboIdStatusInfo } from "../lib/gomboIdHelper";

export interface PublicGomboVerification {
  exists: boolean;
  isValid: boolean;
  isRevoked?: boolean;
  gomboId: string;
  artistName: string;
  realName?: string;
  statusLabel: string;
  verificationLevel: string;
  trustScore: number;
  certifiedAt: string;
  commune: string;
  discipline: string;
  avatarUrl?: string;
  profileId?: string;
  verifiedBy?: string;
  revocationReason?: string;
}

/**
 * Searches and verifies a GOMBO ID across registered data without exposing private user data.
 * Accessible publicly without requiring authentication.
 */
export async function getPublicGomboVerification(rawGomboId: string): Promise<PublicGomboVerification> {
  const cleanId = (rawGomboId || "").trim();
  if (!cleanId) {
    return {
      exists: false,
      isValid: false,
      gomboId: "",
      artistName: "",
      statusLabel: "GOMBO ID NON VALIDE",
      verificationLevel: "",
      trustScore: 0,
      certifiedAt: "",
      commune: "",
      discipline: ""
    };
  }

  const formattedId = formatGomboIdDisplay(cleanId);

  try {
    // 1. Direct lookup in official public verifications collection
    try {
      const verifDocRef = doc(db, "gomboVerifications", formattedId);
      const verifSnap = await getDoc(verifDocRef);
      
      if (verifSnap.exists()) {
        const data = verifSnap.data();
        const isRevoked = data.isRevoked === true || data.status === "revoked" || data.status === "suspended";
        const isValid = data.isValid !== false && !isRevoked;
        
        return {
          exists: true,
          isValid,
          isRevoked,
          gomboId: data.gomboId || formattedId,
          artistName: data.artistName || "Artiste Certifié",
          realName: data.realName,
          statusLabel: isRevoked ? "CERTIFICATION RÉVOQUÉE" : (data.statusLabel || "ARTISTE CERTIFIÉ"),
          verificationLevel: data.verificationLevel || "Niveau 1 • Artiste Homologué",
          trustScore: Number(data.trustScore) || 98,
          certifiedAt: data.certifiedAt || data.issueDate || data.createdAt || "Homologation officielle",
          commune: data.commune || "Abidjan, Côte d'Ivoire",
          discipline: data.discipline || data.category || "Musique & Performance",
          avatarUrl: data.avatarUrl,
          profileId: data.profileId || data.userId,
          verifiedBy: data.verifiedBy || "AFRIGOMBO Commission d'Attribution",
          revocationReason: data.revocationReason
        };
      }
    } catch (verifErr) {
      console.warn("Direct gomboVerifications read fallback to users query:", verifErr);
    }

    // 2. Query in registered users
    const usersRef = collection(db, "users");
    
    // We check various fields where the gomboId or gomboIdNumber might be recorded
    const queries = [
      query(usersRef, where("gomboIdNumber", "==", formattedId)),
      query(usersRef, where("gomboIdNumber", "==", cleanId)),
      query(usersRef, where("gomboId", "==", formattedId)),
      query(usersRef, where("gomboId", "==", cleanId))
    ];

    let foundUserDoc: any = null;

    for (const q of queries) {
      try {
        const snap = await getDocs(q);
        if (!snap.empty) {
          foundUserDoc = snap.docs[0];
          break;
        }
      } catch (qErr) {
        // continue
      }
    }

    // If still not found, check if it's an existing registered user by document ID or legacy format
    if (!foundUserDoc) {
      try {
        const directUserSnap = await getDoc(doc(db, "users", cleanId));
        if (directUserSnap.exists()) {
          const uData = directUserSnap.data();
          const userGomboId = formatGomboIdDisplay(uData.gomboIdNumber || uData.gomboId?.id || uData.gomboId);
          if (userGomboId === formattedId) {
            foundUserDoc = directUserSnap;
          }
        }
      } catch (_) {}
    }

    if (!foundUserDoc || !foundUserDoc.exists()) {
      return {
        exists: false,
        isValid: false,
        gomboId: formattedId,
        artistName: "",
        statusLabel: "GOMBO ID INTROUVABLE",
        verificationLevel: "",
        trustScore: 0,
        certifiedAt: "",
        commune: "",
        discipline: ""
      };
    }

    const userData = foundUserDoc.data();
    const statusInfo = getGomboIdStatusInfo(userData);
    const isUserCertified = userData.isCertified === true || userData.kycStatus === "approved" || statusInfo.isKycApproved;
    const isSuspendedOrBlocked = userData.status === "suspended" || userData.status === "blocked" || userData.isRevoked === true;

    if (!isUserCertified) {
      return {
        exists: true,
        isValid: false,
        isRevoked: false,
        gomboId: formattedId,
        artistName: userData.artisticName || userData.name || "Artiste",
        statusLabel: "EN ATTENTE DE VÉRIFICATION",
        verificationLevel: statusInfo.verificationLevel || "Non homologué",
        trustScore: statusInfo.trustScore || 50,
        certifiedAt: "",
        commune: userData.commune || "Abidjan",
        discipline: userData.instrument || "Artiste Musical",
        avatarUrl: userData.avatarUrl,
        profileId: foundUserDoc.id
      };
    }

    if (isSuspendedOrBlocked) {
      return {
        exists: true,
        isValid: false,
        isRevoked: true,
        gomboId: formattedId,
        artistName: userData.artisticName || userData.name || "Artiste",
        statusLabel: "CERTIFICATION RÉVOQUÉE",
        verificationLevel: "Suspendu par l'administration",
        trustScore: 0,
        certifiedAt: userData.kycApprovedDate || "Archivé",
        commune: userData.commune || "Abidjan",
        discipline: userData.instrument || "Artiste Musical",
        avatarUrl: userData.avatarUrl,
        profileId: foundUserDoc.id,
        revocationReason: userData.suspensionReason || userData.blockedReason || "Non-respect de la charte de souveraineté artistique."
      };
    }

    const artistName = (userData.artisticName || userData.name || "Artiste Certifié").trim();
    const realName = userData.name && userData.name !== userData.artisticName ? userData.name : undefined;
    const certifiedAt = userData.kycApprovedDate || userData.kycSubmittedDate || "Validé";
    const discipline = userData.instrument || (Array.isArray(userData.instruments) ? userData.instruments.join(" • ") : "") || "Musique & Performance Artistique";
    const commune = userData.commune || "Abidjan, Côte d'Ivoire";
    const trustScore = userData.gomboId?.scoreConfiance ?? userData.trustScore ?? 98;

    return {
      exists: true,
      isValid: true,
      isRevoked: false,
      gomboId: formattedId,
      artistName,
      realName,
      statusLabel: "ARTISTE CERTIFIÉ",
      verificationLevel: statusInfo.verificationLevel || "Niveau 1 • Artiste Homologué",
      trustScore,
      certifiedAt,
      commune,
      discipline,
      avatarUrl: userData.avatarUrl,
      profileId: foundUserDoc.id,
      verifiedBy: "AFRIGOMBO Direction des Titres & Certifications"
    };

  } catch (error) {
    console.error("Error during public Gombo ID verification:", error);
    return {
      exists: false,
      isValid: false,
      gomboId: formattedId,
      artistName: "",
      statusLabel: "ERREUR DE VÉRIFICATION",
      verificationLevel: "",
      trustScore: 0,
      certifiedAt: "",
      commune: "",
      discipline: ""
    };
  }
}
