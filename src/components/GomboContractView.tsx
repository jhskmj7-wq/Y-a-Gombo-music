import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  FileText, ShieldCheck, CheckCircle2, XCircle, 
  Clock, MapPin, Calendar, CreditCard, 
  FileSignature, Lock, AlertTriangle, ArrowLeft,
  Stamp, Download, History, MessageSquare,
  BadgeCheck, Info, Loader2
} from "lucide-react";
import { gomboDB } from "../firebase";
import { GomboSafeContract, UserProfile } from "../types";
import { audioSynth } from "../lib/audio";

interface GomboContractViewProps {
  contractId: string;
  currentUser: UserProfile;
  onBack?: () => void;
  onUpdate?: () => void;
}

export default function GomboContractView({ contractId, currentUser, onBack, onUpdate }: GomboContractViewProps) {
  const [contract, setContract] = useState<GomboSafeContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    setLoading(true);
    const data = await gomboDB.getContract(contractId);
    setContract(data);
    setLoading(false);
  };

  const isClient = contract?.clientId === currentUser.uid;
  const isArtist = contract?.artistId === currentUser.uid;
  const isAdmin = currentUser.role === "admin" || currentUser.isAdmin;

  const handleSign = async () => {
    if (!contract || processing) return;
    setProcessing(true);
    try {
      const updates: any = {};
      const action = isClient ? "Signature Client" : "Signature Artiste";
      if (isClient) {
        updates.clientSignedAt = new Date().toISOString();
        if (contract.artistSignedAt) updates.status = "signed";
        else updates.status = "accepted_client";
      } else {
        updates.artistSignedAt = new Date().toISOString();
        if (contract.clientSignedAt) updates.status = "signed";
        else updates.status = "accepted_artist";
      }
      
      await gomboDB.updateContract(contract.id, updates, currentUser.uid!, action);
      try { audioSynth.playValidationSuccess(); } catch(_) {}
      await loadContract();
      if (onUpdate) onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleValidation = async (isValid: boolean) => {
    if (!contract || processing) return;
    setProcessing(true);
    try {
      const updates: any = {};
      const action = isValid ? "Validation de la mission" : "Refus de validation (Litige)";
      
      if (isClient) updates.clientValidation = isValid;
      else updates.artistValidation = isValid;

      if (!isValid) {
        setShowDisputeModal(true);
        setProcessing(false);
        return;
      }

      // If both validated, mission is completed and payment released
      if (isValid) {
        const otherValidated = isClient ? contract.artistValidation : contract.clientValidation;
        if (otherValidated) {
          updates.status = "completed";
          // Update Gombo status too
          await gomboDB.updateGomboStatus(contract.gomboId, "mission_terminee", { paymentStatus: "paid" });
        }
      }

      await gomboDB.updateContract(contract.id, updates, currentUser.uid!, action);
      try { audioSynth.playValidationSuccess(); } catch(_) {}
      await loadContract();
      if (onUpdate) onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const submitDispute = async () => {
    if (!contract || !disputeReason || processing) return;
    setProcessing(true);
    try {
      await gomboDB.openDispute(contract.id, disputeReason, currentUser.uid!, currentUser.artisticName || currentUser.name || "User");
      setShowDisputeModal(false);
      await loadContract();
      if (onUpdate) onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Chargement du contrat sécurisé...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-24 space-y-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
        <h3 className="text-white font-bold">Contrat introuvable</h3>
        <button onClick={onBack} className="text-[#D4AF37] text-sm underline">Retour</button>
      </div>
    );
  }

  const getStatusDisplay = () => {
    switch(contract.status) {
      case "generated": return { label: "En attente de signatures", color: "text-amber-500", bg: "bg-amber-500/10" };
      case "accepted_client": return { label: "Signé par le client", color: "text-blue-500", bg: "bg-blue-500/10" };
      case "accepted_artist": return { label: "Signé par l'artiste", color: "text-blue-500", bg: "bg-blue-500/10" };
      case "signed": return { label: "Signé & Scellé", color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" };
      case "payment_held": return { label: "Dépôt Sécurisé", color: "text-emerald-500", bg: "bg-emerald-500/10" };
      case "completed": return { label: "Mission Terminée", color: "text-zinc-400", bg: "bg-zinc-800" };
      case "disputed": return { label: "En Litige", color: "text-red-500", bg: "bg-red-500/10" };
      case "cancelled": return { label: "Annulé", color: "text-zinc-600", bg: "bg-zinc-900" };
      default: return { label: contract.status, color: "text-zinc-400", bg: "bg-zinc-800" };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Retour</span>
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-[#D4AF37] transition-colors"
            title="Historique des actions"
          >
            <History className="w-5 h-5" />
          </button>
          <button 
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-[#D4AF37] transition-colors"
            title="Télécharger PDF (Bientôt)"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contract Document */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[#080808] border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        {/* Document Header Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Stamp className="w-48 h-48 rotate-12" />
        </div>

        <div className="p-12 space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 border-b border-zinc-800 pb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#D4AF37]/10 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h1 className="text-2xl font-sans font-black text-white uppercase tracking-tighter">CONTRAT NUMÉRIQUE</h1>
                  <p className="text-[#D4AF37] text-xs font-mono font-bold tracking-widest uppercase">{contract.id}</p>
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color} text-[10px] font-black uppercase tracking-widest`}>
                <div className={`w-1.5 h-1.5 rounded-full bg-current animate-pulse`} />
                {statusInfo.label}
              </div>
            </div>
            
            <div className="text-right space-y-1">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Émis par</p>
              <p className="text-white text-lg font-black tracking-tighter">AFRIGOMBO ELITE</p>
              <p className="text-zinc-600 text-[9px] font-mono">{new Date(contract.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest border-l-2 border-[#D4AF37] pl-3">ORGANISATEUR (CLIENT)</h3>
              <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                <p className="text-white font-bold">{contract.clientName}</p>
                <p className="text-zinc-500 text-[10px] font-mono mt-1">ID: {contract.clientId.substring(0, 8)}...</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest border-l-2 border-[#D4AF37] pl-3">ARTISTE (PRESTATAIRE)</h3>
              <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                <p className="text-white font-bold">{contract.artistName}</p>
                <p className="text-zinc-500 text-[10px] font-mono mt-1">ID: {contract.artistId.substring(0, 8)}...</p>
              </div>
            </div>
          </div>

          {/* Mission Details */}
          <div className="space-y-6">
            <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest border-l-2 border-[#D4AF37] pl-3">DÉTAILS DE LA PRESTATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/30 space-y-1">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Lieu</span>
                </div>
                <p className="text-zinc-200 text-sm font-medium">{contract.commune}</p>
              </div>
              <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/30 space-y-1">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Date</span>
                </div>
                <p className="text-zinc-200 text-sm font-medium">{contract.date}</p>
              </div>
              <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/30 space-y-1">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Heure</span>
                </div>
                <p className="text-zinc-200 text-sm font-medium">{contract.time}</p>
              </div>
            </div>

            <div className="p-6 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl space-y-3">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">{contract.title}</h4>
              <p className="text-zinc-400 text-xs leading-relaxed italic">
                "{contract.description}"
              </p>
            </div>
          </div>

          {/* Financials */}
          <div className="space-y-6">
            <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest border-l-2 border-[#D4AF37] pl-3">MODALITÉS FINANCIÈRES</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Cachet Artiste</span>
                  <span className="text-white font-mono font-bold">{contract.amount.toLocaleString()} FCFA</span>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Commission {isClient ? "Client" : "Gombo"}</span>
                  <span className="text-zinc-400 font-mono text-xs">{isClient ? contract.commissionClient.toLocaleString() : contract.commissionArtist.toLocaleString()} FCFA</span>
                </div>
                <div className="flex items-center justify-between border-t border-[#D4AF37]/30 pt-4">
                  <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">{isClient ? "Total à Régler" : "Net à Recevoir"}</span>
                  <span className="text-[#D4AF37] text-xl font-sans font-black tracking-tighter">
                    {isClient ? contract.totalClientPaid.toLocaleString() : contract.totalArtistReceives.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-center space-y-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-zinc-200 text-xs font-bold">Paiement Sécurisé par AFRIGOMBO</p>
                    <p className="text-zinc-500 text-[10px] leading-relaxed">Les fonds sont bloqués dès le dépôt et ne sont libérés qu'après validation mutuelle de la prestation.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BadgeCheck className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-zinc-200 text-xs font-bold">Garantie de Prestation</p>
                    <p className="text-zinc-500 text-[10px] leading-relaxed">Le contrat fait foi en cas de litige. AFRIGOMBO intervient comme tiers de confiance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-zinc-800 pt-12">
            <div className="space-y-4 text-center">
              <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] mb-4">SIGNATURE CLIENT</p>
              {contract.clientSignedAt ? (
                <div className="space-y-2">
                  <div className="h-16 flex items-center justify-center italic font-serif text-[#D4AF37] text-xl opacity-80">
                    {contract.clientName}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-emerald-500 text-[9px] font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" /> Signé le {new Date(contract.clientSignedAt).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="h-16 border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center">
                  <span className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest">En attente de signature</span>
                </div>
              )}
            </div>
            <div className="space-y-4 text-center">
              <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] mb-4">SIGNATURE ARTISTE</p>
              {contract.artistSignedAt ? (
                <div className="space-y-2">
                  <div className="h-16 flex items-center justify-center italic font-serif text-[#D4AF37] text-xl opacity-80">
                    {contract.artistName}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-emerald-500 text-[9px] font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" /> Signé le {new Date(contract.artistSignedAt).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="h-16 border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center">
                  <span className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest">En attente de signature</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="border-t border-zinc-800 pt-12">
            {!contract.clientSignedAt && isClient || !contract.artistSignedAt && isArtist ? (
              <div className="space-y-6">
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-start gap-4">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    En cliquant sur "Signer numériquement", vous acceptez les termes du contrat et les conditions générales d'AFRIGOMBO ELITE. Cette action est irréversible et horodatée.
                  </p>
                </div>
                <button 
                  onClick={handleSign}
                  disabled={processing}
                  className="w-full py-5 bg-[#D4AF37] hover:bg-[#B8860B] text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-[#D4AF37]/10 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSignature className="w-5 h-5" />}
                  Signer numériquement
                </button>
              </div>
            ) : contract.status === "signed" && isClient ? (
              <div className="space-y-6">
                <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl flex items-start gap-4 text-center justify-center">
                  <div>
                    <CreditCard className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    <h4 className="text-white font-bold mb-1">Prêt pour le dépôt sécurisé</h4>
                    <p className="text-zinc-500 text-[11px]">Veuillez effectuer le dépôt pour activer la garantie AFRIGOMBO.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleValidation(true)}
                  disabled={processing}
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-600/10 active:scale-95 disabled:opacity-50"
                >
                  Effectuer le dépôt sécurisé
                </button>
              </div>
            ) : contract.status === "payment_held" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => handleValidation(true)}
                  disabled={processing || (isClient && contract.clientValidation) || (isArtist && contract.artistValidation)}
                  className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {(isClient && contract.clientValidation) || (isArtist && contract.artistValidation) ? "Déjà Validé" : "Valider la prestation"}
                </button>
                <button 
                  onClick={() => handleValidation(false)}
                  disabled={processing}
                  className="flex-1 py-5 bg-zinc-900 border border-red-500/30 text-red-500 font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3"
                >
                  <XCircle className="w-5 h-5" />
                  Signaler un litige
                </button>
              </div>
            ) : contract.status === "disputed" && isAdmin ? (
              <div className="space-y-6">
                <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl text-center">
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <h4 className="text-white font-bold mb-1">Arbitrage de Litige</h4>
                  <p className="text-zinc-500 text-[11px]">En tant qu'administrateur, vous pouvez trancher ce litige.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleValidation(true)}
                    disabled={processing}
                    className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all"
                  >
                    Valider (Libérer Fonds)
                  </button>
                  <button 
                    onClick={() => handleValidation(false)}
                    disabled={processing}
                    className="flex-1 py-5 bg-zinc-900 border border-red-500 text-red-500 font-black uppercase tracking-widest rounded-2xl transition-all"
                  >
                    Rembourser Client
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Official Seal Overlay */}
        <div className="absolute bottom-12 right-12 opacity-40 pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 bg-[#D4AF37] blur-2xl opacity-10 rounded-full" />
            <div className="w-24 h-24 border-4 border-[#D4AF37] rounded-full flex items-center justify-center flex-col p-2 text-center rotate-[-15deg]">
              <p className="text-[#D4AF37] text-[7px] font-black uppercase tracking-tighter mb-0.5 leading-[1]">AFRIGOMBO ELITE</p>
              <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />
              <p className="text-[#D4AF37] text-[6px] font-mono mt-0.5">SCELLÉ</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* History Side Panel (Overlay when open) */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            className="w-full max-w-md bg-[#050505] border-l border-zinc-800 h-full p-8 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[#D4AF37] font-black uppercase tracking-widest flex items-center gap-2">
                <History className="w-5 h-5" /> Historique Actions
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-zinc-500 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {contract.history?.map((entry, idx) => (
                <div key={idx} className="relative pl-6 border-l border-zinc-800 space-y-1">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700" />
                  <p className="text-zinc-200 text-xs font-bold">{entry.action}</p>
                  <p className="text-zinc-500 text-[10px] font-mono">
                    {new Date(entry.timestamp).toLocaleString()} • ID: {entry.userId.substring(0, 8)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#050505] border border-red-500/30 rounded-3xl p-8 space-y-6 shadow-2xl shadow-red-500/5"
          >
            <div className="text-center space-y-2">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">OUVERTURE DE LITIGE</h3>
              <p className="text-zinc-500 text-xs">Veuillez expliquer précisément la raison du litige. Le centre de commandement AFRIGOMBO analysera votre dossier.</p>
            </div>
            
            <textarea 
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Décrivez le problème rencontré (retard, prestation non conforme, etc.)..."
              className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-zinc-200 text-sm focus:outline-none focus:border-[#D4AF37]/50 resize-none"
            />

            <div className="flex gap-4">
              <button 
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 py-4 bg-zinc-900 text-zinc-400 font-bold uppercase tracking-widest rounded-2xl hover:bg-zinc-800 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={submitDispute}
                disabled={!disputeReason || processing}
                className="flex-1 py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-500 transition-all disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Ouvrir le litige"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
