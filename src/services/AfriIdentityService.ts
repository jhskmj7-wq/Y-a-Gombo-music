import { db, isFirebaseMock } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { UserProfile } from "../types";

export interface AfriIdentity {
  afriId: string;
  uid: string;
  trustId?: string; // or gomboId
  nom: string;
  email: string;
  telephone: string;
  avatar: string;
  couverture: string;
  role: string;
  applications: {
    afriTrust: boolean;
    afriLivraison: boolean;
    afriMarket: boolean;
    afriAcademy: boolean;
    afrigombo: boolean;
    afriWallet: boolean;
    [key: string]: boolean;
  };
  abonnement: {
    niveau: string;
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
   * getAfriId: Retrieves the Afri ID for a given uid, generating one if not present.
   */
  static async getAfriId(uid: string, profile?: Partial<UserProfile>): Promise<string> {
    if (isFirebaseMock || !db) {
       let afriIds = JSON.parse(localStorage.getItem("afri_ids_map") || "{}");
       if (afriIds[uid]) return afriIds[uid];
       const newId = this.generateAfriId();
       afriIds[uid] = newId;
       localStorage.setItem("afri_ids_map", JSON.stringify(afriIds));
       return newId;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        let afriId = "";
        
        if (userDoc.exists()) {
            afriId = userDoc.data().afriId;
        } else if (profile?.afriId) {
            afriId = profile.afriId;
        }

        if (!afriId) {
            afriId = this.generateAfriId();
            await setDoc(doc(db, "users", uid), { afriId }, { merge: true });
        }
        return afriId;
    } catch (e) {
        console.warn("⚠️ getAfriId failed", e);
        return this.generateAfriId();
    }
  }

  /**
   * getAfriUser: Retrieves the full universal Afri identity
   */
  static async getAfriUser(afriId: string): Promise<AfriIdentity | null> {
    if (isFirebaseMock || !db) {
        const localData = JSON.parse(localStorage.getItem(COLLECTION_NAME) || "{}");
        return localData[afriId] || null;
    }

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
   * syncAfriProfile: Creates or fully overwrites the universal profile based on local app changes
   */
  static async syncAfriProfile(afriId: string, profileData: Partial<AfriIdentity>): Promise<void> {
    try {
        const dataToSave = {
            ...profileData,
            updatedAt: !isFirebaseMock ? serverTimestamp() : new Date().toISOString()
        };

        if (isFirebaseMock || !db) {
            const localData = JSON.parse(localStorage.getItem(COLLECTION_NAME) || "{}");
            localData[afriId] = { ...(localData[afriId] || {}), ...dataToSave };
            localStorage.setItem(COLLECTION_NAME, JSON.stringify(localData));
            return;
        }

        await setDoc(doc(db, COLLECTION_NAME, afriId), dataToSave, { merge: true });
    } catch (e) {
        console.warn("⚠️ syncAfriProfile failed", e);
    }
  }

  /**
   * linkApplication: Allows enabling access/flag for a specific Afri ecosystem app
   */
  static async linkApplication(afriId: string, appName: string): Promise<void> {
      try {
          if (isFirebaseMock || !db) {
              const localData = JSON.parse(localStorage.getItem(COLLECTION_NAME) || "{}");
              if (localData[afriId]) {
                  localData[afriId].applications = {
                      ...localData[afriId].applications,
                      [appName]: true
                  };
                  localData[afriId].updatedAt = new Date().toISOString();
                  localStorage.setItem(COLLECTION_NAME, JSON.stringify(localData));
              }
              return;
          }

          await setDoc(doc(db, COLLECTION_NAME, afriId), {
              applications: {
                  [appName]: true
              },
              updatedAt: serverTimestamp()
          }, { merge: true });
      } catch (e) {
          console.warn("⚠️ linkApplication failed", e);
      }
  }

  /**
   * verifyAfriIdentity: Can be used to run security checks on the identity payload
   */
  static async verifyAfriIdentity(afriId: string, uid: string): Promise<boolean> {
     const identity = await this.getAfriUser(afriId);
     if (!identity) return false;
     return identity.uid === uid; // simple verification token logic placeholder
  }

  /**
   * updateAfriProfile: Helper for partial patch
   */
  static async updateAfriProfile(afriId: string, updates: Partial<AfriIdentity>): Promise<void> {
     await this.syncAfriProfile(afriId, updates);
  }
}
