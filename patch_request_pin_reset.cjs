const fs = require('fs');
let code = fs.readFileSync('src/lib/WalletSecurityService.ts', 'utf8');

const newMethod = `
  /**
   * Request a PIN reset manually (contacts SAO)
   */
  static async requestPinReset(uid: string): Promise<void> {
    await updateDoc(doc(db, "users", uid), {
      "walletSecurity.pinResetRequested": true,
      "walletSecurity.saoAssistancePending": true,
      "walletSecurity.pinStatus": "RESET_PENDING"
    });
    
    // Create an assistance ticket
    await addDoc(collection(db, "support_tickets"), {
      userId: uid,
      subject: "Demande de réinitialisation de PIN Wallet",
      status: "open",
      createdAt: new Date().toISOString(),
      type: "SECURITY_ASSISTANCE"
    });
  }
`;

code = code.replace("static async getWalletSecurityStatus", newMethod + "\n  static async getWalletSecurityStatus");
fs.writeFileSync('src/lib/WalletSecurityService.ts', code);
