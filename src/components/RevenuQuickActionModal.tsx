import React, { useState } from "react";
import { User, Transaction } from "../types";
import { audioSynth } from "../lib/audio";

interface RevenuQuickActionModalProps {
  activeArtistId: string;
  users: User[];
  saveToFirestore: (collectionName: string, docId: string, data: any) => Promise<void>;
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  setActiveQuickActionModal: (val: string | null) => void;
  addToTerminal: (msg: string) => void;
}

export function RevenuQuickActionModal({
  activeArtistId,
  users,
  saveToFirestore,
  transactions,
  setTransactions,
  setActiveQuickActionModal,
  addToTerminal
}: RevenuQuickActionModalProps) {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawCarrier, setWithdrawCarrier] = useState("Orange Money");
  const [withdrawNumber, setWithdrawNumber] = useState("");

  const currentUserData = users.find(u => u.id === activeArtistId) || users[0];
  const balanceValue = currentUserData ? (currentUserData.balance || currentUserData.revenue || (currentUserData as any).revenues || 125000) : 125000;

  return (
    <div className="space-y-4 text-left">
      <div className="space-y-1">
        <h3 className="text-sm font-display font-black text-afri-text uppercase tracking-widest flex items-center gap-2">
          <span>💰</span> RETRAITS & REVENUS SÉCURISÉS
        </h3>
        <p className="text-[11px] text-afri-text-sec">Suivi comptable en temps réel lié à l'Académie Afrigombo.</p>
      </div>

      <div className="p-4 bg-gradient-to-r from-afri-bg-action to-afri-bg border border-afri-gold/35 rounded-2xl select-none flex justify-between items-center text-left">
        <div>
          <span className="text-[8px] font-mono text-afri-gold block uppercase font-black">SOLDE DISPONIBLE</span>
          <strong className="text-xl font-display font-black text-afri-text block mt-1">{balanceValue.toLocaleString("fr-FR")} FCFA</strong>
        </div>
        <div className="text-[8.5px] font-mono py-1 px-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
          GARANTI COCOT ⚖
        </div>
      </div>

      {/* MOBILE MONEY WITHDRAW FORMS */}
      <div className="p-3.5 bg-afri-bg border border-afri-border rounded-2xl space-y-2.5">
        <span className="text-[9.5px] font-mono text-afri-gold uppercase block font-bold leading-none">DEMANDE DE RETRAIT INSTANTANÉ</span>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            {["Orange Money", "MTN MoMo", "Wave"].map(op => (
              <button
                key={op}
                type="button"
                onClick={() => setWithdrawCarrier(op)}
                className={`py-1 rounded text-[8px] font-mono font-bold uppercase border transition ${withdrawCarrier === op ? "bg-afri-gold text-black border-afri-gold" : "bg-afri-bg border-afri-border text-afri-text-sec hover:text-afri-text"}`}
              >
                {op}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Ex: 10000 (FCFA)"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="w-full bg-afri-bg border border-afri-border text-xs text-afri-text p-2 rounded-lg font-mono focus:outline-none"
          />
          <input
            type="tel"
            placeholder="N° de téléphone du destinataire..."
            value={withdrawNumber}
            onChange={(e) => setWithdrawNumber(e.target.value)}
            className="w-full bg-afri-bg border border-afri-border text-xs text-afri-text p-2 rounded-lg font-mono focus:outline-none"
          />
          <button
            onClick={async () => {
              const cash = parseFloat(withdrawAmount);
              if (isNaN(cash) || cash <= 0 || !withdrawNumber) return;
              if (cash > balanceValue) {
                alert("❌ Solde insuffisant pour ce montant de retrait.");
                return;
              }
              try {
                // Update user balance via Firestore sync
                const newBal = balanceValue - cash;
                const updatedUser = { 
                  ...currentUserData, 
                  balance: newBal, 
                  walletBalance: newBal,
                  wallet: {
                    ...(currentUserData.wallet || {}),
                    soldeDisponible: newBal
                  },
                  revenue: newBal, 
                  revenues: newBal 
                };
                await saveToFirestore("users", currentUserData.id, updatedUser);
                
                // Log transaction
                const txId = "tx_" + Date.now();
                const tx: Transaction = {
                  id: txId,
                  amount: cash,
                  type: "payout",
                  description: `Retrait Mobile Money (${withdrawCarrier}) vers le numéro ${withdrawNumber}`,
                  userId: currentUserData.id,
                  userArtisticName: currentUserData.artisticName,
                  timestamp: new Date().toISOString()
                };
                await saveToFirestore("transactions", txId, tx);

                // Post local list updates
                setTransactions([tx, ...transactions]);
                
                setWithdrawAmount("");
                setWithdrawNumber("");
                setActiveQuickActionModal(null);
                addToTerminal(`[PAYOUT] Retrait de ${cash} FCFA demandé via ${withdrawCarrier} vers ${withdrawNumber}.`);
                try { audioSynth.playKoraSuccess(); } catch(_) {}
                alert(`💸 Retrait réussi de ${cash.toLocaleString("fr-FR")} FCFA vers votre compte ${withdrawCarrier} !`);
              } catch (_) {}
            }}
            className="w-full py-2 bg-afri-gold hover:bg-afri-bg-sec text-black font-mono font-black text-[10.5px] uppercase rounded-lg transition"
          >
            ORDONNER LE TRANSFERT ⚡
          </button>
        </div>
      </div>
    </div>
  );
}
