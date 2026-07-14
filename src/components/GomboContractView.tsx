import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  FileText, ShieldCheck, CheckCircle2, XCircle, 
  Clock, MapPin, Calendar, CreditCard, 
  FileSignature, Lock, AlertTriangle, ArrowLeft,
  Download, History, MessageSquare,
  BadgeCheck, Info, Loader2, Camera, Compass, Plus
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
  if (!currentUser) return null;

  const [contract, setContract] = useState<GomboSafeContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Real-time listener for the individual contract
  useEffect(() => {
    setLoading(true);
    const unsubscribe = gomboDB.listenContract(contractId, (data) => {
      setContract(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [contractId]);

  const loadContract = async () => {
    // Kept for backward compatibility, real-time listener updates state
    const data = await gomboDB.getContract(contractId);
    if (data) setContract(data);
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
      if (onUpdate) onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeposit = async () => {
    if (!contract || processing) return;
    setProcessing(true);
    try {
      await gomboDB.depositToEscrow(
        contract.id,
        contract.amount || 0,
        currentUser.uid!,
        currentUser.displayName || currentUser.name || "Client"
      );
      try { audioSynth.playValidationSuccess(); } catch(_) {}
      if (onUpdate) onUpdate();
    } catch (e) {
      console.error("Error holding payment in contract", e);
    } finally {
      setProcessing(false);
    }
  };

  const handleArrival = async () => {
    if (!contract || processing) return;
    setProcessing(true);
    try {
      let gpsCoords = "Autorisation refusée";
      try {
        const position = await new Promise<any>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        gpsCoords = `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`;
      } catch (geoErr) {
        console.warn("Geolocation failed/refused", geoErr);
        gpsCoords = "Non partagée (refus ou indisponible)";
      }

      const now = new Date();
      const arrivalTime = now.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
      const arrivalTimestamp = now.toISOString();

      const updates = {
        arrivalTime,
        arrivalGPS: gpsCoords,
        arrivalTimestamp,
        status: "arrived" // Set status to arrived
      };

      await gomboDB.updateContract(
        contract.id,
        updates,
        currentUser.uid!,
        `📍 Artiste arrivé sur les lieux (GPS: ${gpsCoords})`
      );

      // Notify the client instantly
      await gomboDB.sendNotification({
        userId: contract.clientId,
        type: "contract",
        title: "Artiste arrivé sur les lieux 📍",
        message: `L'artiste ${contract.artistName} est arrivé sur le lieu de prestation (${contract.commune || "Lieu"}) à ${arrivalTime}.`,
        createdAt: new Date().toISOString()
      });

      try { audioSynth.playValidationSuccess(); } catch(_) {}
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Arrival recording failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleSpecificPhotoUpload = async (type: "presence" | "materiel" | "scene" | "finale", e: React.ChangeEvent<HTMLInputElement>) => {
    if (!contract || !e.target.files || processing) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const fieldName = type === "presence" ? "presencePhotos" :
                      type === "materiel" ? "materielPhotos" :
                      type === "scene" ? "scenePhotos" : "finalePhotos";

    const currentPhotos = contract[fieldName] || [];
    if (currentPhotos.length >= 3) {
      alert(`Maximum 3 photos de type [${type.toUpperCase()}] autorisées.`);
      return;
    }

    setProcessing(true);
    try {
      const uploadPromises = files.slice(0, 3 - currentPhotos.length).map(async (file, idx) => {
        const path = `contracts/${contract.id}/${type}_${Date.now()}_${idx}.jpg`;
        return await gomboDB.uploadFile(file, path);
      });

      const urls = await Promise.all(uploadPromises);
      const updatedPhotos = [...currentPhotos, ...urls];

      const updates: any = {};
      updates[fieldName] = updatedPhotos;

      await gomboDB.updateContract(
        contract.id,
        updates,
        currentUser.uid!,
        `📸 Preuve [${type.toUpperCase()}] ajoutée (${updatedPhotos.length}/3)`
      );

      try { audioSynth.playValidationSuccess(); } catch(_) {}
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Photo upload failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleSpecificPhotoUpload("presence", e);
  };

  const handleToggleProofRequest = async (proofType: string) => {
    if (!contract || processing) return;
    setProcessing(true);
    try {
      const currentRequests = contract.proofRequests || ["presence"];
      let updatedRequests = [];
      if (currentRequests.includes(proofType)) {
        if (proofType === "presence") {
          alert("La preuve de présence est obligatoire.");
          setProcessing(false);
          return;
        }
        updatedRequests = currentRequests.filter((r: string) => r !== proofType);
      } else {
        updatedRequests = [...currentRequests, proofType];
      }
      
      await gomboDB.updateContract(
        contract.id,
        { proofRequests: updatedRequests },
        currentUser.uid!,
        `⚙️ Exigence de preuve modifiée : [${proofType.toUpperCase()}]`
      );
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to toggle proof request:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleStartPrestation = async () => {
    if (!contract || processing) return;
    setProcessing(true);
    try {
      await gomboDB.updateContract(
        contract.id,
        { status: "in_progress" },
        currentUser.uid!,
        "🎬 Début officiel de la prestation"
      );

      // Notify client
      await gomboDB.sendNotification({
        userId: contract.clientId,
        type: "contract",
        title: "Prestation commencée 🎬",
        message: `L'artiste ${contract.artistName} a officiellement démarré la prestation !`,
        createdAt: new Date().toISOString()
      });

      try { audioSynth.playValidationSuccess(); } catch(_) {}
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Start prestation error:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleEndPrestation = async () => {
    if (!contract || processing) return;
    setProcessing(true);
    try {
      const now = new Date();
      const artistFinishedAt = now.toISOString();
      const departureTime = now.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

      await gomboDB.updateContract(
        contract.id,
        {
          status: "completed_artist",
          artistFinishedAt,
          departureTime,
          artistValidation: true
        },
        currentUser.uid!,
        "✨ Prestation déclarée terminée par l'artiste"
      );

      // Notify client
      await gomboDB.sendNotification({
        userId: contract.clientId,
        type: "contract",
        title: "Prestation terminée ✨",
        message: `L'artiste ${contract.artistName} a marqué la prestation comme terminée. Veuillez vérifier pour libérer le paiement.`,
        createdAt: new Date().toISOString()
      });

      try { audioSynth.playValidationSuccess(); } catch(_) {}
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("End prestation error:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleValidation = async (isValid: boolean) => {
    if (!contract || processing) return;
    setProcessing(true);
    try {
      const updates: any = {};
      
      if (!isValid) {
        setShowDisputeModal(true);
        setProcessing(false);
        return;
      }

      // True Double Validation: Both must confirm before release
      if (isValid) {
        if (isClient) {
          updates.clientValidation = true;
          updates.clientConformedAt = new Date().toISOString();
        } else {
          updates.artistValidation = true;
          updates.artistConformedAt = new Date().toISOString();
        }

        const isClientConformed = isClient ? true : !!contract.clientValidation;
        const isArtistConformed = isArtist ? true : !!contract.artistValidation;

        if (isClientConformed && isArtistConformed) {
          // Automatic funds release on double confirmation
          updates.status = "completed";
          await gomboDB.releaseEscrow(contract.id);
          await gomboDB.updateContract(contract.id, updates, currentUser.uid!, "Prestation validée par les deux parties. Fonds libérés automatiquement ! ✨");
          await gomboDB.updateGomboStatus(contract.gomboId, "mission_terminee", { paymentStatus: "paid" });
        } else {
          // Record single confirmation and wait
          const roleLabel = isClient ? "Le promoteur" : "L'artiste";
          await gomboDB.updateContract(contract.id, updates, currentUser.uid!, `✔️ ${roleLabel} a validé la prestation. En attente de la confirmation de l'autre partie. ⏳`);
        }
      }

      try { audioSynth.playValidationSuccess(); } catch(_) {}
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
      await gomboDB.openContractDispute(
        contract.id,
        disputeReason,
        currentUser.uid!,
        currentUser.artisticName || currentUser.displayName || currentUser.name || "User"
      );
      setShowDisputeModal(false);
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
      case "signed": return { label: "Signé & Scellé (Attente dépôt)", color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" };
      case "payment_held": return { label: "Dépôt Sécurisé (Mission active)", color: "text-emerald-500", bg: "bg-emerald-500/10" };
      case "arrived": return { label: "Artiste Arrivé 📍", color: "text-teal-400", bg: "bg-teal-500/10" };
      case "in_progress": return { label: "Prestation en Cours ⚡", color: "text-purple-400", bg: "bg-purple-500/10" };
      case "completed_artist": return { label: "Terminé par l'artiste (Attente validation)", color: "text-orange-400", bg: "bg-orange-500/10" };
      case "completed": return { label: "Mission Terminée & Validée ✨", color: "text-emerald-500", bg: "bg-emerald-500/10" };
      case "disputed": return { label: "En Litige Bloqué 🚨", color: "text-red-500", bg: "bg-red-500/10" };
      case "cancelled": return { label: "Annulé", color: "text-zinc-600", bg: "bg-zinc-900" };
      default: return { label: contract.status, color: "text-zinc-400", bg: "bg-zinc-800" };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 text-left">
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
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-[#D4AF37] transition-colors"
            title="Historique permanent"
          >
            <History className="w-5 h-5" />
          </button>
          <button 
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-[#D4AF37] transition-colors"
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

        <div className="p-8 md:p-12 space-y-12">
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
            
            <div className="text-left md:text-right space-y-1">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Émis par</p>
              <p className="text-white text-lg font-black tracking-tighter">AFRIGOMBO ELITE</p>
              <p className="text-[#D4AF37] text-[9px] font-mono">Tiers de Confiance Impérial</p>
              <p className="text-zinc-600 text-[9px] font-mono mt-1">{new Date(contract.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/30 space-y-1">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Lieu (Commune)</span>
                </div>
                <p className="text-zinc-200 text-sm font-medium">{contract.commune || "Non spécifié"}</p>
              </div>
              <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/30 space-y-1">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Date</span>
                </div>
                <p className="text-zinc-200 text-sm font-medium">{contract.date || "Non spécifiée"}</p>
              </div>
              <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/30 space-y-1">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Heure</span>
                </div>
                <p className="text-zinc-200 text-sm font-medium">{contract.time || "Non spécifiée"}</p>
              </div>
              <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/30 space-y-1">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <BadgeCheck className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Durée</span>
                </div>
                <p className="text-zinc-200 text-sm font-medium">{contract.duration || "3 heures"}</p>
              </div>
            </div>

            <div className="p-6 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl space-y-3">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">{contract.title}</h4>
              <p className="text-zinc-400 text-xs leading-relaxed italic">
                "{contract.description}"
              </p>
            </div>
          </div>

          {/* ACTIVE PROTOCOL PROGRESS TRACKER */}
          {["payment_held", "arrived", "in_progress", "completed_artist", "completed", "disputed"].includes(contract.status) && (
            <div className="space-y-6 border-t border-zinc-900 pt-8">
              <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest border-l-2 border-[#D4AF37] pl-3">
                PROTOCOLE DE SÉCURITÉ AFRIGOMBO (TIERS DE CONFIANCE)
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT SIDE: STEPS & STATUS TIMELINE */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Geolocation & Arrival */}
                  <div className={`p-5 rounded-2xl border ${contract.arrivalTime ? "border-emerald-500/20 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/20"} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">1. Arrivée de l'artiste</span>
                      {contract.arrivalTime ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-mono">ENREGISTRÉ</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded text-[9px] font-mono">ATTENTE</span>
                      )}
                    </div>
                    {contract.arrivalTime ? (
                      <div className="space-y-1.5 text-xs">
                        <p className="text-zinc-300 font-bold">📍 Arrivé à : <span className="text-emerald-400 font-mono font-black">{contract.arrivalTime}</span></p>
                        <p className="text-zinc-500 text-[10px] font-mono flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5 text-zinc-600" />
                          {contract.arrivalGPS || "GPS Non activé"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-zinc-500 text-[10px]">L'artiste doit certifier sa présence une fois arrivé sur le lieu du Gombo.</p>
                        {isArtist && (
                          <button 
                            onClick={handleArrival}
                            disabled={processing}
                            className="w-full py-2 bg-[#D4AF37] hover:bg-[#B8860B] text-black font-black uppercase text-[9px] tracking-wider rounded-xl transition-colors disabled:opacity-50"
                          >
                            📍 Je suis arrivé sur place
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Prestation Status Timeline */}
                  <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">2. Exécution & Statut</span>
                    <div className="space-y-2 text-xs">
                      {contract.status === "payment_held" && (
                        <div className="space-y-2">
                          <p className="text-zinc-500 text-[10px]">Prestation prête. Une fois l'artiste arrivé, la prestation peut débuter.</p>
                          {isArtist && contract.arrivalTime && (
                            <button
                              onClick={handleStartPrestation}
                              disabled={processing}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[9px] tracking-widest rounded-xl transition-all"
                            >
                              🎬 Commencer la prestation
                            </button>
                          )}
                        </div>
                      )}
                      {contract.status === "arrived" && (
                        <div className="space-y-2">
                          <p className="text-zinc-500 text-[10px]">Artiste arrivé sur les lieux. Cliquez pour démarrer la prestation.</p>
                          {isArtist && (
                            <button
                              onClick={handleStartPrestation}
                              disabled={processing}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[9px] tracking-widest rounded-xl transition-all animate-bounce"
                            >
                              🎬 Commencer la prestation
                            </button>
                          )}
                        </div>
                      )}
                      {contract.status === "in_progress" && (
                        <div className="space-y-2">
                          <p className="text-[#D4AF37] font-bold text-[10px] animate-pulse">⚡ PRESTATION EN COURS EN CE MOMENT</p>
                          {isArtist && (
                            <button
                              onClick={handleEndPrestation}
                              disabled={processing}
                              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-[9px] tracking-widest rounded-xl transition-all"
                            >
                              ✨ Marquer comme terminée
                            </button>
                          )}
                        </div>
                      )}
                      {["completed_artist", "completed", "disputed"].includes(contract.status) && (
                        <div className="space-y-1 font-mono text-[10px]">
                          {contract.artistFinishedAt && (
                            <p className="text-zinc-400">🏁 Fin prestation : {new Date(contract.artistFinishedAt).toLocaleTimeString()}</p>
                          )}
                          {contract.clientConformedAt && (
                            <p className="text-emerald-400">✅ Validation client : {new Date(contract.clientConformedAt).toLocaleTimeString()}</p>
                          )}
                          {contract.status === "completed" && <p className="text-emerald-500 font-bold uppercase">PAIEMENT LIBÉRÉ AVEC SUCCÈS</p>}
                          {contract.status === "disputed" && <p className="text-red-500 font-bold uppercase">LITIGE EN COURS - BLOCAGE</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE: SECURE PROOFS PROTOCOL */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/10 space-y-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white mb-1">
                        📸 PROTOCOLE DE PREUVES SÉCURISÉES (COFFRE-FORT)
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        Preuves visuelles d'exécution stockées sur Firebase Storage. Aucun lien externe ou téléphone.
                      </p>
                    </div>

                    {/* Promoter controls: demand custom proofs */}
                    {isClient && (
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3">
                        <span className="text-[10px] font-mono font-black text-[#D4AF37] uppercase tracking-wider">
                          🛠️ PREUVES EXIGÉES PAR LE PROMOTEUR
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: "presence", label: "📍 Présence locale", disabled: true },
                            { id: "materiel", label: "🎸 Matériel & Balance", disabled: false },
                            { id: "scene", label: "🎤 Show sur Scène", disabled: false },
                            { id: "finale", label: "🏁 Clôture / Photo Finale", disabled: false }
                          ].map(pt => {
                            const isRequested = (contract.proofRequests || ["presence"]).includes(pt.id);
                            return (
                              <button
                                key={pt.id}
                                disabled={pt.disabled || processing}
                                onClick={() => handleToggleProofRequest(pt.id)}
                                className={`py-2 px-3 rounded-xl border text-[10px] font-mono font-bold uppercase text-left transition-all flex items-center justify-between ${
                                  isRequested 
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                    : "bg-black border-zinc-900 text-zinc-500 hover:border-zinc-800"
                                } ${pt.disabled ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                <span>{pt.label}</span>
                                <span className="text-[8px] font-mono px-1.5 py-0.5 bg-black/40 rounded">
                                  {isRequested ? "REQUIS" : "FACULTATIF"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Proof boxes for all active requests */}
                    <div className="space-y-4">
                      {[
                        { id: "presence", label: "📍 Preuve de présence locale", field: "presencePhotos" },
                        { id: "materiel", label: "🎸 Preuve d'installation Matériel", field: "materielPhotos" },
                        { id: "scene", label: "🎤 Preuve du Show sur Scène", field: "scenePhotos" },
                        { id: "finale", label: "🏁 Preuve de Clôture / Finale", field: "finalePhotos" }
                      ].map(pt => {
                        const isRequested = (contract.proofRequests || ["presence"]).includes(pt.id);
                        if (!isRequested) return null;

                        const photosList = contract[pt.field] || [];

                        return (
                          <div 
                            key={pt.id} 
                            className={`p-4 rounded-xl border ${photosList.length > 0 ? "border-emerald-500/10 bg-emerald-500/5" : "border-zinc-900 bg-black/20"} space-y-3`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-black text-white uppercase tracking-wider">{pt.label}</span>
                              <span className="text-[8px] font-mono bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded-full font-bold">
                                {photosList.length}/3 MAX
                              </span>
                            </div>

                            {photosList.length > 0 ? (
                              <div className="grid grid-cols-4 gap-2">
                                {photosList.map((url: string, i: number) => (
                                  <button 
                                    key={i} 
                                    onClick={() => setLocalPreviewUrl(url)} 
                                    className="relative aspect-square rounded-lg overflow-hidden border border-zinc-800 block hover:border-[#D4AF37] transition-all"
                                  >
                                    <img referrerPolicy="no-referrer" src={url} alt={`Preuve ${i+1}`} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                                {isArtist && photosList.length < 3 && (
                                  <label className="aspect-square rounded-lg border-2 border-dashed border-zinc-800 hover:border-[#D4AF37]/50 flex items-center justify-center cursor-pointer transition-colors">
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSpecificPhotoUpload(pt.id as any, e)} disabled={processing} />
                                    <Plus className="w-4 h-4 text-zinc-600" />
                                  </label>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-zinc-500 text-[9px] font-mono">
                                  {isArtist ? "Vous devez uploader une photo pour attester de cette étape." : "En attente du dépôt de l'artiste..."}
                                </p>
                                {isArtist && (
                                  <label className="flex items-center justify-center gap-2 w-full py-2 bg-zinc-950 border border-zinc-900 hover:border-[#D4AF37]/35 text-zinc-300 font-bold uppercase text-[9px] tracking-wider rounded-xl cursor-pointer transition-all">
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSpecificPhotoUpload(pt.id as any, e)} disabled={processing} />
                                    <Camera className="w-3.5 h-3.5 text-[#D4AF37]" />
                                    Uploader la photo
                                  </label>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Financials / Transparence Économique */}
          <div className="space-y-6">
            <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest border-l-2 border-[#D4AF37] pl-3">
              TRANSPARENCE ÉCONOMIQUE & FINANCIÈRE
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Transparency Card */}
              <div className="lg:col-span-2 p-6 bg-zinc-950 border border-zinc-850 rounded-3xl space-y-5 shadow-inner">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Base de négociation</span>
                    <span className="text-zinc-200 font-bold text-xs">Cachet de Prestation</span>
                  </div>
                  <span className="text-white font-mono text-base font-extrabold">{contract.amount.toLocaleString()} FCFA</span>
                </div>

                {/* Promoter details */}
                <div className="flex items-center justify-between bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-900">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-300">Commission Promoteur (Client)</span>
                      {contract.isClientPremium ? (
                        <span className="bg-[#D4AF37]/10 text-[#D4AF37] px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-widest border border-[#D4AF37]/20">💎 Premium (4%)</span>
                      ) : (
                        <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-widest">Standard (6%)</span>
                      )}
                    </div>
                    <p className="text-[9px] text-zinc-500">Ajoutée au cachet de base</p>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-300 font-mono font-bold">+{contract.commissionClient.toLocaleString()} FCFA</span>
                    {contract.savingsClient > 0 && (
                      <p className="text-[8.5px] text-emerald-400 font-mono font-medium mt-0.5">Économie de {contract.savingsClient.toLocaleString()} FCFA incluse</p>
                    )}
                  </div>
                </div>

                {/* Musician details */}
                <div className="flex items-center justify-between bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-900">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-300">Commission Musicien (Artiste)</span>
                      {contract.isArtistPremium ? (
                        <span className="bg-[#D4AF37]/10 text-[#D4AF37] px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-widest border border-[#D4AF37]/20">💎 Premium (4%)</span>
                      ) : (
                        <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-widest">Standard (6%)</span>
                      )}
                    </div>
                    <p className="text-[9px] text-zinc-500">Déduite du cachet de base</p>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400 font-mono font-bold">-{contract.commissionArtist.toLocaleString()} FCFA</span>
                    {contract.savingsArtist > 0 && (
                      <p className="text-[8.5px] text-emerald-400 font-mono font-medium mt-0.5">Économie de {contract.savingsArtist.toLocaleString()} FCFA incluse</p>
                    )}
                  </div>
                </div>

                {/* Total AFRIGOMBO commission */}
                <div className="flex items-center justify-between border-t border-zinc-900 pt-4 px-1">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Service de confiance sécurisé</span>
                    <span className="text-zinc-400 text-xs">Commission totale AFRIGOMBO</span>
                  </div>
                  <span className="text-zinc-300 font-mono font-bold">
                    {(contract.commissionClient + contract.commissionArtist).toLocaleString()} FCFA 
                    <span className="text-[10px] text-zinc-500 ml-1.5 font-normal">
                      ({Math.round(((contract.commissionClientRate || 0.06) + (contract.commissionArtistRate || 0.06)) * 100)}%)
                    </span>
                  </span>
                </div>

                {/* Final amounts for each side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-zinc-900 pt-4">
                  <div className={`p-4 rounded-2xl border ${isClient ? 'bg-[#D4AF37]/5 border-[#D4AF37]/25' : 'bg-zinc-900/20 border-zinc-850'}`}>
                    <p className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1">Montant Net Promoteur (À Régler)</p>
                    <p className={`text-sm font-black font-sans tracking-tight ${isClient ? 'text-[#D4AF37]' : 'text-zinc-300'}`}>
                      {contract.totalClientPaid.toLocaleString()} FCFA
                    </p>
                    <p className="text-[7.5px] text-zinc-500 mt-1">Cachet ({contract.amount.toLocaleString()}) + Comm ({contract.commissionClient.toLocaleString()})</p>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isArtist ? 'bg-[#D4AF37]/5 border-[#D4AF37]/25' : 'bg-zinc-900/20 border-zinc-850'}`}>
                    <p className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1">Montant Net Musicien (Reçu)</p>
                    <p className={`text-sm font-black font-sans tracking-tight ${isArtist ? 'text-[#D4AF37]' : 'text-zinc-300'}`}>
                      {contract.totalArtistReceives.toLocaleString()} FCFA
                    </p>
                    <p className="text-[7.5px] text-zinc-500 mt-1">Cachet ({contract.amount.toLocaleString()}) - Comm ({contract.commissionArtist.toLocaleString()})</p>
                  </div>
                </div>
              </div>

              {/* Trust block */}
              <div className="p-6 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-3xl flex flex-col justify-between space-y-4 text-xs">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-zinc-200 font-bold">Paiement Sécurisé par AFRIGOMBO</p>
                      <p className="text-zinc-500 text-[10px] leading-relaxed">
                        Les fonds sont bloqués dès le dépôt et ne sont libérés qu'après validation mutuelle de la prestation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-zinc-200 font-bold">Garantie de Prestation</p>
                      <p className="text-zinc-500 text-[10px] leading-relaxed">
                        Le contrat fait foi en cas de litige. AFRIGOMBO intervient comme tiers de confiance souverain.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-850 text-[9.5px] text-zinc-400">
                  <p className="font-bold text-zinc-200 mb-1">💡 Avantage Économique Premium</p>
                  <p className="leading-normal">
                    Les membres Premium bénéficient d'un taux réduit à <span className="text-[#D4AF37] font-bold">4%</span> au lieu de 6%, économisant sur chaque gombo validé.
                  </p>
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
                <div className="h-16 border-2 border-dashed border-zinc-850 rounded-2xl flex items-center justify-center">
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
                <div className="h-16 border-2 border-dashed border-zinc-850 rounded-2xl flex items-center justify-center">
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
                    En cliquant sur "Signer numériquement", vous acceptez les termes du contrat et les conditions générales d'AFRIGOMBO ELITE. Cette action est irréversible, sécurisée et horodatée dans Firestore.
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
                    <CreditCard className="w-10 h-10 text-emerald-500 mx-auto mb-3 animate-pulse" />
                    <h4 className="text-white font-bold mb-1">Prêt pour le dépôt de garantie</h4>
                    <p className="text-zinc-500 text-[11px]">Le contrat est signé et scellé. Veuillez effectuer le dépôt sécurisé d'un montant total de <span className="text-white font-bold font-mono">{contract.totalClientPaid?.toLocaleString()} FCFA</span> pour engager la mission en toute sécurité.</p>
                  </div>
                </div>
                <button 
                  onClick={handleDeposit}
                  disabled={processing}
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-600/10 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Effectuer le dépôt sécurisé"}
                </button>
              </div>
            ) : contract.status === "signed" && isArtist ? (
              <div className="p-6 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-3xl text-center space-y-3">
                <Clock className="w-8 h-8 text-[#D4AF37] mx-auto animate-pulse" />
                <h4 className="text-white font-bold text-xs uppercase tracking-wider">En attente du Dépôt Sécurisé</h4>
                <p className="text-zinc-500 text-[11px] leading-relaxed max-w-md mx-auto">
                  Le contrat est signé et scellé par les deux parties. L'organisateur doit maintenant effectuer le dépôt de garantie de <span className="text-white font-bold font-mono">{contract.totalClientPaid?.toLocaleString()} FCFA</span>. Ne commencez pas la mission avant cette confirmation.
                </p>
              </div>
            ) : (contract.status === "completed_artist" || contract.status === "payment_held") && isClient ? (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-emerald-950/40 to-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-3xl text-center space-y-3 animate-fadeIn">
                  <ShieldCheck className="w-12 h-12 text-[#D4AF37] mx-auto animate-bounce" />
                  <h4 className="text-[#D4AF37] font-sans font-black uppercase tracking-widest text-sm">Validation de Prestation</h4>
                  <p className="text-zinc-400 text-[11px] leading-relaxed max-w-lg mx-auto">
                    La prestation a été marquée comme terminée par l'artiste. Veuillez certifier la conformité de la prestation d'artiste ou signaler un problème pour ouvrir un litige et bloquer le paiement.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleValidation(true)}
                    disabled={processing || contract.clientValidation}
                    className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {contract.clientValidation ? "Déjà Validé" : "Prestation conforme (Libérer)"}
                  </button>
                  <button 
                    onClick={() => handleValidation(false)}
                    disabled={processing}
                    className="flex-1 py-5 bg-zinc-900 border border-red-500/30 text-red-500 font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                    Signaler un problème / Litige
                  </button>
                </div>
              </div>
            ) : contract.status === "completed_artist" && isArtist ? (
              <div className="p-6 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-3xl text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#D4AF37] mx-auto animate-spin" />
                <h4 className="text-white font-bold text-xs uppercase tracking-wider">En attente de validation client</h4>
                <p className="text-zinc-500 text-[11px] leading-relaxed max-w-md mx-auto">
                  Vous avez marqué la prestation comme terminée. L'organisateur vérifie actuellement la conformité. Les fonds restent bloqués en séquestre jusqu'à sa confirmation.
                </p>
              </div>
            ) : contract.status === "disputed" && isAdmin ? (
              <div className="space-y-6">
                <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl text-center">
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <h4 className="text-white font-bold mb-1">Arbitrage Impérial du Litige</h4>
                  <p className="text-zinc-500 text-[11px] mb-3">En tant que Fondateur / Centre de Commandement, vous pouvez examiner les preuves de présence, les horaires, les photos de présence, et trancher souverainement ce litige.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleValidation(true)}
                    disabled={processing}
                    className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all"
                  >
                    Valider (Libérer Fonds à l'artiste)
                  </button>
                  <button 
                    onClick={() => handleValidation(false)}
                    disabled={processing}
                    className="flex-1 py-5 bg-zinc-900 border border-red-500 text-red-500 font-black uppercase tracking-widest rounded-2xl transition-all"
                  >
                    Rembourser l'organisateur
                  </button>
                </div>
              </div>
            ) : contract.status === "completed" ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-center space-y-3 animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-white font-bold text-xs uppercase tracking-wider">PRESTATION TERMINÉE ET VALIDÉE</h4>
                <p className="text-[#D4AF37] text-sm font-black uppercase tracking-widest">
                  {isClient ? "Fonds libérés à l'artiste." : "Fonds libérés sur votre compte."}
                </p>
                <p className="text-zinc-500 text-[11px] leading-relaxed max-w-md mx-auto">
                  Merci d'avoir fait confiance à AFRIGOMBO ELITE, votre tiers de confiance souverain pour des prestations artistiques sécurisées.
                </p>
              </div>
            ) : null}

            {/* Section Annulation de Contrat - Règles de Séquestre AFRIGOMBO */}
            {contract.status !== "completed" && contract.status !== "cancelled" && (
              <div className="mt-8 pt-6 border-t border-zinc-900/60 flex flex-col items-center gap-2">
                <button
                  onClick={async () => {
                    const confirmMsg = contract.clientSigned && contract.artistSigned
                      ? "Attention: Les deux parties ont signé ce contrat. Conformément aux règles d'annulation d'AFRIGOMBO, une pénalité de 10% du cachet sera retenue et reversée à l'artiste à titre de dédommagement si le séquestre a été déposé. Voulez-vous continuer ?"
                      : "Êtes-vous sûr de vouloir annuler ce contrat ? Comme les deux parties n'ont pas encore signé, le remboursement sera intégral.";
                    if (window.confirm(confirmMsg)) {
                      setProcessing(true);
                      try {
                        await gomboDB.cancelGomboContract(contract.id, currentUser.uid!);
                        alert("Le contrat a été annulé avec succès. Les soldes de votre Wallet ont été ajustés en conséquence.");
                        if (onUpdate) onUpdate();
                      } catch (err: any) {
                        alert(`Erreur d'annulation: ${err.message}`);
                      } finally {
                        setProcessing(false);
                      }
                    }
                  }}
                  disabled={processing}
                  className="px-6 py-3 bg-zinc-950 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 border border-zinc-900 hover:border-red-950/40 text-[9px] font-mono font-black uppercase tracking-widest rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  Annuler le contrat (Règles Séquestre)
                </button>
                <p className="text-[8px] font-mono text-zinc-600 max-w-xs text-center leading-relaxed">
                  Avant signature : 100% remboursé. Après signature : Pénalité de 10% reversée à l'artiste. Annulation artiste : 100% remboursé au promoteur.
                </p>
              </div>
            )}
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
            className="w-full max-w-md bg-[#050505] border-l border-zinc-800 h-full p-8 overflow-y-auto text-left"
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

      {/* Lightbox / Local Image Preview Overlay */}
      {localPreviewUrl && (
        <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-zinc-800">
            <img referrerPolicy="no-referrer" src={localPreviewUrl} alt="Visualisation Preuve" className="w-full h-auto max-h-[80vh] object-contain" />
          </div>
          <button 
            onClick={() => setLocalPreviewUrl(null)} 
            className="mt-6 px-6 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37] text-white font-black uppercase text-xs tracking-widest rounded-full transition-all"
          >
            Fermer l'aperçu
          </button>
        </div>
      )}
    </div>
  );
}

// Reuse the Stamp component from GomboContractsDashboard
function Stamp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" />
      <path d="M30 50L45 65L70 35" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <text x="50" y="85" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold" fontFamily="sans-serif">SCELLÉ</text>
    </svg>
  );
}
