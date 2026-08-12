import { db } from "./firebase";
import { 
  doc, 
  collection, 
  onSnapshot, 
  runTransaction, 
  setDoc, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { GawaPack, GawaHistoryRecord } from "../types";
import { getCanonicalWalletBalance } from "./financial";

const GAWA_PACKS_COLLECTION = "gawaPacks";
const GAWA_HISTORY_COLLECTION = "gawaHistory";

export class GawaEngineService {
  /**
   * Subscribe to Gawa packs real-time updates
   */
  static subscribeGawaPacks(callback: (packs: GawaPack[]) => void): () => void {
    const colRef = collection(db, GAWA_PACKS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const packs: GawaPack[] = [];
        snapshot.forEach((docSnap) => {
          packs.push({ id: docSnap.id, ...docSnap.data() } as GawaPack);
        });
        // Sort active first, then price ascending
        packs.sort((a, b) => {
          if (a.enabled !== b.enabled) {
            return a.enabled ? -1 : 1;
          }
          return a.priceFCFA - b.priceFCFA;
        });
        callback(packs);
      },
      (err) => {
        console.error("Error subscribing to Gawa packs:", err);
        callback([]);
      }
    );
  }

  /**
   * Subscribe to user's Gawa balance
   */
  static subscribeUserGawaBalance(userId: string, callback: (balance: number) => void): () => void {
    const docRef = doc(db, "users", userId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const balance = typeof data?.gawaBalance === "number" 
            ? data.gawaBalance 
            : (typeof data?.wallet?.soldeGawa === "number" ? data.wallet.soldeGawa : 0);
          callback(balance);
        } else {
          callback(0);
        }
      },
      (err) => {
        console.error("Error subscribing to user Gawa balance:", err);
        callback(0);
      }
    );
  }

  /**
   * Subscribe to user's Gawa transaction history
   */
  static subscribeUserGawaHistory(userId: string, callback: (history: GawaHistoryRecord[]) => void): () => void {
    const colRef = collection(db, GAWA_HISTORY_COLLECTION);
    const q = query(colRef, where("userId", "==", userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const history: GawaHistoryRecord[] = [];
        snapshot.forEach((docSnap) => {
          history.push(docSnap.data() as GawaHistoryRecord);
        });
        // Sort descending by createdAt
        history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(history);
      },
      (err) => {
        console.error("Error subscribing to Gawa history:", err);
        callback([]);
      }
    );
  }

  /**
   * Create or update a Gawa pack in Firestore
   */
  static async createOrUpdateGawaPack(pack: GawaPack): Promise<void> {
    const docRef = doc(db, GAWA_PACKS_COLLECTION, pack.id);
    await setDoc(docRef, {
      ...pack,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  /**
   * Initialize default packs if none exist
   */
  static async initializeDefaultPacksIfNeeded(): Promise<void> {
    try {
      const colRef = collection(db, GAWA_PACKS_COLLECTION);
      const snap = await getDocs(colRef);
      if (snap.empty) {
        console.log("Initializing default Gawa packs in Firestore...");
        const defaults: GawaPack[] = [
          {
            id: "gawa_pack_1",
            name: "Pack Classique",
            priceFCFA: 200,
            gawaAmount: 20,
            enabled: true,
            createdAt: new Date().toISOString()
          },
          {
            id: "gawa_pack_2",
            name: "Pack Premium",
            priceFCFA: 500,
            gawaAmount: 55,
            enabled: true,
            createdAt: new Date().toISOString()
          },
          {
            id: "gawa_pack_3",
            name: "Pack Élite",
            priceFCFA: 1000,
            gawaAmount: 120,
            enabled: true,
            createdAt: new Date().toISOString()
          }
        ];
        for (const pack of defaults) {
          await this.createOrUpdateGawaPack(pack);
        }
      }
    } catch (err) {
      console.error("Failed to initialize default Gawa packs:", err);
    }
  }

  /**
   * ATOMIC TRANSACTION: Purchase a Gawa pack using existing FCFA Wallet balance
   */
  static async purchaseGawaPack(
    userId: string, 
    packId: string
  ): Promise<{ success: boolean; error?: string; txId?: string; balanceAfterFCFA?: number; balanceAfterGawa?: number }> {
    if (!userId) return { success: false, error: "ID utilisateur manquant." };
    if (!packId) return { success: false, error: "ID de pack manquant." };

    try {
      const result = await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userId);
        const packRef = doc(db, GAWA_PACKS_COLLECTION, packId);

        const userSnap = await transaction.get(userRef);
        const packSnap = await transaction.get(packRef);

        if (!userSnap.exists()) {
          throw new Error("Compte utilisateur introuvable.");
        }
        if (!packSnap.exists()) {
          throw new Error("Pack Gawa introuvable.");
        }

        const userData = userSnap.data();
        const packData = packSnap.data() as GawaPack;

        if (!packData.enabled) {
          throw new Error("Ce pack Gawa est actuellement inactif.");
        }

        const priceFCFA = packData.priceFCFA;
        const gawaAmount = packData.gawaAmount;

        if (priceFCFA <= 0 || gawaAmount <= 0) {
          throw new Error("Configuration du pack invalide (prix ou quantité incorrects).");
        }

        // Get canonical wallet balance
        const currentBalanceFCFA = getCanonicalWalletBalance(userData);

        if (currentBalanceFCFA < priceFCFA) {
          throw new Error(`Solde FCFA insuffisant. Il vous manque ${priceFCFA - currentBalanceFCFA} FCFA pour acheter ce pack.`);
        }

        const newBalanceFCFA = currentBalanceFCFA - priceFCFA;
        const currentGawa = typeof userData.gawaBalance === "number" 
          ? userData.gawaBalance 
          : (typeof userData.wallet?.soldeGawa === "number" ? userData.wallet.soldeGawa : 0);
        
        const newBalanceGawa = currentGawa + gawaAmount;

        const txId = `tx_gawa_purchase_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        
        // 1. Debit FCFA and Credit Gawa atomically on the User document
        transaction.update(userRef, {
          walletBalance: newBalanceFCFA,
          balance: newBalanceFCFA,
          "wallet.soldeDisponible": newBalanceFCFA,
          gawaBalance: newBalanceGawa,
          "wallet.soldeGawa": newBalanceGawa,
          updatedAt: new Date().toISOString()
        });

        // 2. Add financial transaction to walletTransactions
        const txFCFARef = doc(db, "walletTransactions", txId);
        const txRecord = {
          id: txId,
          reference: txId,
          userId,
          uid: userId,
          userName: userData?.name || userData?.firstName || "Membre Gombo",
          amount: priceFCFA,
          type: "purchase",
          module: "gawa",
          reason: `Achat de Gawa : ${packData.name} (+${gawaAmount} Gawa)`,
          description: `Achat de Gawa : ${packData.name} (+${gawaAmount} Gawa)`,
          balanceBefore: currentBalanceFCFA,
          balanceAfter: newBalanceFCFA,
          status: "success",
          createdAt: new Date().toISOString(),
          date: new Date().toLocaleDateString("fr-FR"),
          heure: new Date().toLocaleTimeString("fr-FR"),
          timestamp: Date.now()
        };
        transaction.set(txFCFARef, txRecord);

        // Mirror in transactions collection
        const txMirrorRef = doc(db, "transactions", txId);
        transaction.set(txMirrorRef, txRecord);

        // 3. Add Gawa transaction to gawaHistory
        const txGawaRef = doc(db, GAWA_HISTORY_COLLECTION, txId);
        const gawaRecord: GawaHistoryRecord = {
          id: txId,
          userId,
          amount: gawaAmount,
          type: "PURCHASE",
          description: `Achat du pack "${packData.name}" (+${gawaAmount} Gawa)`,
          createdAt: new Date().toISOString(),
          source: "AFRIGOMBO_WALLET",
          transactionId: txId
        };
        transaction.set(txGawaRef, gawaRecord);

        return {
          success: true,
          txId,
          balanceAfterFCFA: newBalanceFCFA,
          balanceAfterGawa: newBalanceGawa
        };
      });

      return result;
    } catch (err: any) {
      console.error("GawaEngineService.purchaseGawaPack error:", err);
      return { success: false, error: err.message || "Erreur de transaction lors de l'achat." };
    }
  }

  /**
   * ATOMIC TRANSACTION: Exceptionally grant or adjust user Gawa balance (Founder exclusive)
   */
  static async grantGawaException(
    userId: string,
    amount: number,
    type: "BONUS" | "MISSION" | "ADMIN_GRANT" | "ADMIN_ADJUSTMENT" | string,
    description: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string; txId?: string; balanceAfterGawa?: number }> {
    if (!userId) return { success: false, error: "ID utilisateur manquant." };
    if (amount === 0) return { success: false, error: "Le montant ne peut pas être nul." };

    try {
      const result = await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userId);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
          throw new Error("Compte utilisateur introuvable.");
        }

        const userData = userSnap.data();
        const currentGawa = typeof userData.gawaBalance === "number" 
          ? userData.gawaBalance 
          : (typeof userData.wallet?.soldeGawa === "number" ? userData.wallet.soldeGawa : 0);
        
        const newBalanceGawa = Math.max(0, currentGawa + amount);

        const txId = `tx_gawa_grant_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        // 1. Update Gawa balance atomically
        transaction.update(userRef, {
          gawaBalance: newBalanceGawa,
          "wallet.soldeGawa": newBalanceGawa,
          updatedAt: new Date().toISOString()
        });

        // 2. Add record in Gawa history
        const txGawaRef = doc(db, GAWA_HISTORY_COLLECTION, txId);
        const gawaRecord: GawaHistoryRecord = {
          id: txId,
          userId,
          amount: Math.abs(amount), // store positive amount
          type,
          description: `${description} (Ajusté par ${adminId})`,
          createdAt: new Date().toISOString(),
          source: `ADMIN_GRANT_${adminId}`,
          transactionId: txId
        };
        transaction.set(txGawaRef, gawaRecord);

        return {
          success: true,
          txId,
          balanceAfterGawa: newBalanceGawa
        };
      });

      return result;
    } catch (err: any) {
      console.error("GawaEngineService.grantGawaException error:", err);
      return { success: false, error: err.message || "Erreur lors de l'attribution des Gawa." };
    }
  }
}
