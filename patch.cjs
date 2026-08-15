const fs = require('fs');
let code = fs.readFileSync('src/lib/WalletSecurityService.ts', 'utf8');

const newMethod = `
  /**
   * Verify PIN inside a Firestore Transaction to guarantee atomic security.
   */
  static async verifyPinTransaction(transaction: any, uid: string, enteredPin?: string): Promise<void> {
    const userRef = doc(db, "users", uid);
    const snap = await transaction.get(userRef);
    if (!snap.exists()) throw new Error("Utilisateur introuvable");
    
    const data = snap.data();
    const sec = data.walletSecurity || data.paymentSettings || {};
    
    const pinConfigured = !!(sec.pinHash || sec.pinConfigured);
    const lockedUntil = sec.lockedUntil || null;
    
    if (lockedUntil && new Date(lockedUntil).getTime() > Date.now()) {
      throw new Error("Wallet temporairement verrouillé suite à de multiples échecs.");
    }
    
    if (sec.pinResetRequested) {
      throw new Error("Une réinitialisation du PIN est en attente. Opération bloquée.");
    }

    if (!pinConfigured) {
      return; // No PIN configured, allowed to proceed.
    }

    if (!enteredPin) {
      throw new Error("Authentification Wallet (PIN) requise pour cette opération.");
    }

    const hashedInput = await this.hashPin(enteredPin, sec.pinSalt, uid);
    if (hashedInput !== sec.pinHash) {
      throw new Error("Code PIN Wallet incorrect.");
    }
  }
`;

code = code.replace("static async verifyPin(", newMethod + "\n  static async verifyPin(");
fs.writeFileSync('src/lib/WalletSecurityService.ts', code);
