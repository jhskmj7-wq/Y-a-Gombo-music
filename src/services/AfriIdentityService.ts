import { db } from "../firebase";
import { 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { UserProfile } from "../types";

export interface AfriIdentity {
  afriId: string;
  uid: string;
  email: string;
  telephone: string;
  displayName: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  subscription: {
    level: "FREE" | "PREMIUM" | "VIP";
  };
  applications: {
    afriGombo: boolean;
    afriTrust: boolean;
    afriWallet: boolean;
    afriMarket: boolean;
    afriAcademy: boolean;
    afriLivraison: boolean;
  };
  createdAt: any;
  updatedAt: any;
}

const COLLECTION_NAME = "afri_ids";

export class AfriIdentityService {
  /**
   * Generates a unique AFRI-XXXXXXX ID.
   */
  static generateAfriId(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomStr = "";
    for (let i = 0; i < 7; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `AFRI-${randomStr}`;
  }

  /**
   * getAfriId: Retrieves the Afri ID for a given uid, generating a secure permanent unique registration if not present.
   * Performs validation to avoid duplicates on UID, email or telephone.
   */
  static async getAfriId(uid: string, profile?: Partial<UserProfile> & { phone?: string; bio?: string }): Promise<string> {
    const emailStr = profile?.email || "";
    const phoneStr = profile?.phone || profile?.whatsapp || "";

    if (db) {
      try {
        // 1. Find if already registered under this uid
        const qUid = query(collection(db, COLLECTION_NAME), where("uid", "==", uid));
        const snapUid = await getDocs(qUid);
        if (!snapUid.empty) {
          const firstDoc = snapUid.docs[0].data() as AfriIdentity;
          return firstDoc.afriId;
        }

        // 2. Double check if email already exists
        if (emailStr) {
          const qEmail = query(collection(db, COLLECTION_NAME), where("email", "==", emailStr));
          const snapEmail = await getDocs(qEmail);
          if (!snapEmail.empty) {
            const matched = snapEmail.docs[0].data() as AfriIdentity;
            // Link existing Afri ID to this UID if not set
            if (!matched.uid) {
              await updateDoc(doc(db, COLLECTION_NAME, matched.afriId), { uid });
            }
            return matched.afriId;
          }
        }

        // 3. Double check if phone already exists
        if (phoneStr) {
          const qPhone = query(collection(db, COLLECTION_NAME), where("telephone", "==", phoneStr));
          const snapPhone = await getDocs(qPhone);
          if (!snapPhone.empty) {
            const matched = snapPhone.docs[0].data() as AfriIdentity;
            if (!matched.uid) {
              await updateDoc(doc(db, COLLECTION_NAME, matched.afriId), { uid });
            }
            return matched.afriId;
          }
        }

        // Create new identity document
        const newAfriId = this.generateAfriId();
        const identity: AfriIdentity = {
          afriId: newAfriId,
          uid,
          email: emailStr,
          telephone: phoneStr,
          displayName: profile?.artisticName || profile?.name || "Talent Souverain",
          avatar: profile?.avatarUrl || "",
          coverPhoto: "",
          bio: profile?.bio || "Artiste d'Abidjan",
          role: "USER",
          status: "ACTIVE",
          subscription: {
            level: "FREE"
          },
          applications: {
            afriGombo: true,
            afriTrust: false,
            afriWallet: false,
            afriMarket: false,
            afriAcademy: false,
            afriLivraison: false
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await setDoc(doc(db, COLLECTION_NAME, newAfriId), identity);
        await setDoc(doc(db, "users", uid), { afriId: newAfriId }, { merge: true });

        // Security Log
        await addDoc(collection(db, "security_logs"), {
          type: "CREATION_AFRIID",
          afriId: newAfriId,
          uid,
          details: `Création automatique de l'identité souveraine pour ${emailStr}`,
          timestamp: new Date().toISOString()
        });

        return newAfriId;
      } catch (e: any) {
        console.warn("⚠️ Firestore Afri ID generation error:", e.message);
        throw e;
      }
    }

    throw new Error("Base de données indisponible");
  }

  /**
   * getAfriUser: Retrieves the full universal Afri identity by id
   */
  static async getAfriUser(afriId: string): Promise<AfriIdentity | null> {
    if (!db) return null;

    try {
        const afriDoc = await getDoc(doc(db, COLLECTION_NAME, afriId));
        if (afriDoc.exists()) {
            return afriDoc.data() as AfriIdentity;
        }
    } catch (e) {
         console.warn("⚠️ getAfriUser failed", e);
    }
    return null;
  }

  /**
   * verifyAfriId: checks if an afriId exists and is active
   */
  static async verifyAfriId(afriId: string): Promise<boolean> {
    const user = await this.getAfriUser(afriId);
    return !!(user && user.status === "ACTIVE");
  }

  /**
   * loginWithAfriId: Checks Firestore, registers a session and security event log.
   */
  static async loginWithAfriId(afriId: string): Promise<AfriIdentity | null> {
    const identity = await this.getAfriUser(afriId);
    if (!identity || identity.status !== "ACTIVE") {
      return null;
    }

    // Capture safety log
    await this.createAfriSession(identity.uid, afriId, "Abidjan (Port de Confiance)");

    return identity;
  }

  /**
   * createAfriSession: Registers an active connection context in afri_sessions and security_logs
   */
  static async createAfriSession(uid: string, afriId: string, location?: string): Promise<string> {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionObj = {
      id: sessionId,
      uid,
      afriId,
      location: location || "Abidjan, CI",
      device: typeof navigator !== "undefined" ? navigator.userAgent : "Client Web",
      active: true,
      createdAt: new Date().toISOString()
    };

    if (db) {
      try {
        await setDoc(doc(db, "afri_sessions", sessionId), sessionObj);
        await addDoc(collection(db, "security_logs"), {
          type: "CONNEXION_SESSION",
          afriId,
          uid,
          details: `Connexion réussie sur AfriID ${afriId}`,
          timestamp: new Date().toISOString()
        });
        return sessionId;
      } catch (err) {
        console.warn("⚠️ createAfriSession failed", err);
      }
    }

    return sessionId;
  }

  /**
   * syncAfriProfile: Overwrites/merges the universal profile based on local changes
   */
  static async syncAfriProfile(afriId: string, profileData: Partial<AfriIdentity>): Promise<void> {
    try {
        const dataToSave = {
            ...profileData,
            updatedAt: serverTimestamp()
        };

        if (db) {
            await setDoc(doc(db, COLLECTION_NAME, afriId), dataToSave, { merge: true });
        }
    } catch (e) {
        console.warn("⚠️ syncAfriProfile failed", e);
    }
  }

  /**
   * linkApplication: Allows enabling access flag for a specific Afri ecosystem app
   */
  static async linkApplication(afriId: string, appName: keyof AfriIdentity["applications"]): Promise<void> {
       try {
          if (db) {
            await setDoc(doc(db, COLLECTION_NAME, afriId), {
                applications: {
                    [appName]: true
                },
                updatedAt: serverTimestamp()
            }, { merge: true });
          }
      } catch (e) {
          console.warn("⚠️ linkApplication failed", e);
      }
  }

  /**
   * updateAfriProfile: Helper for partial patch
   */
  static async updateAfriProfile(afriId: string, updates: Partial<AfriIdentity>): Promise<void> {
      await this.syncAfriProfile(afriId, updates);
  }
}

