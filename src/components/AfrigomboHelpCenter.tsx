import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, MessageSquare, AlertTriangle, FileText, Star, Lightbulb, ArrowRight, MessageCircle, X, CheckCircle, ChevronDown, ChevronUp, ChevronRight, ShieldAlert, BookOpen } from "lucide-react";
import { supportConfig } from "../supportConfig";
import { gomboDB } from "../firebase";

interface HelpCenterProps {
  onClose: () => void;
  currentUser?: any;
  profile?: any;
  audioSynth?: any;
}

export default function AfrigomboHelpCenter({ onClose, currentUser, profile, audioSynth }: HelpCenterProps) {
  const [activeModal, setActiveModal] = useState<"none" | "faq" | "guides" | "bug" | "suggestion" | "dispute" | "review">("none");
  
  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Form states
  const [bugType, setBugType] = useState("Affichage");
  const [bugDesc, setBugDesc] = useState("");
  const [suggestionText, setSuggestionText] = useState("");
  
  // Dispute state
  const [disputeGomboId, setDisputeGomboId] = useState("");
  const [disputeReason, setDisputeReason] = useState("Non-prestation ou désaccord");
  const [disputeDesc, setDisputeDesc] = useState("");

  // Review state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const faqs = [
    {
      q: "Comment publier un gombo (projet artistique ou événement) ?",
      a: "Rendez-vous dans la section 'Publications' ou cliquez sur 'Publier un Gombo'. Remplissez les informations requises (titre, description, budget, commune, type) et soumettez votre annonce. Elle sera validée et sécurisée par notre système d'Escrow."
    },
    {
      q: "Comment fonctionne l'Escrow sécurisé et la validation des contrats ?",
      a: "Les fonds sont bloqués de manière sécurisée lors de l'acceptation d'un contrat. Une fois la prestation ou l'événement réalisé, les deux parties valident la mission, ce qui déclenche la libération automatique des fonds vers l'artiste ou l'organisateur."
    },
    {
      q: "Qu'est-ce que le badge Bâtisseur et comment l'obtenir ?",
      a: "Le badge Bâtisseur est attribué aux membres d'élite qui soutiennent activement la communauté AFRIGOMBO ELITE et participent à la gouvernance et au financement des projets majeurs de la plateforme."
    },
    {
      q: "Comment contacter le Support Officiel en cas de besoin urgent ?",
      a: "Utilisez le bouton principal 'Contacter le Support AFRIGOMBO ELITE' ci-dessous pour joindre directement notre équipe opérationnelle 24h/7 via WhatsApp officiel ou chat sécurisé."
    },
    {
      q: "Que faire en cas de litige sur un contrat ou un paiement ?",
      a: "Vous pouvez ouvrir un litige officiel via l'option 'Ouvrir un litige' dans ce centre d'aide. Le Superfondateur et l'équipe d'arbitrage analyseront la preuve et bloqueront les fonds en attendant une résolution équitable."
    }
  ];

  const guides = [
    {
      title: "Guide Créateur & Artiste",
      cat: "Visibilité & Contrats",
      desc: "Apprenez à optimiser votre profil, à présenter vos gombos artistiques et à maximiser vos chances d'être sélectionné par des organisateurs d'élite."
    },
    {
      title: "Guide Organisateur & Promoter",
      cat: "Dépôts & Sécurité Escrow",
      desc: "Découvrez les bonnes pratiques pour rédiger un contrat de gombo clair, alimenter l'escrow sécurisé et valider les prestations sans friction."
    },
    {
      title: "Guide Bâtisseur & Superfondateur",
      cat: "Gouvernance",
      desc: "Comprenez le fonctionnement de la trésorerie communautaire, les votes d'investissement et le suivi des contributions en temps réel."
    }
  ];

  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugDesc.trim()) return;
    setLoading(true);
    try {
      await gomboDB.submitBugReport({
        title: `Bug: ${bugType || 'Dysfonctionnement'}`,
        subject: bugType || "Dysfonctionnement",
        message: bugDesc,
        details: bugDesc,
        userId: profile?.uid || currentUser?.uid || "anonyme",
        userName: profile?.nomArtistique || profile?.name || profile?.displayName || currentUser?.displayName || "Anonyme",
        userEmail: profile?.email || currentUser?.email || "",
        status: "PENDING",
        createdAt: new Date().toISOString()
      });
      try { audioSynth?.playValidationSuccess?.(); } catch(e){}
      setSuccessMsg("Rapport de bug transmis avec succès au Trône du Fondateur !");
      setTimeout(() => {
        setSuccessMsg("");
        setActiveModal("none");
        setBugDesc("");
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim()) return;
    setLoading(true);
    try {
      await gomboDB.submitBugReport({
        title: "Suggestion Bêta / Amélioration",
        subject: "Suggestion",
        message: suggestionText,
        details: suggestionText,
        userId: profile?.uid || currentUser?.uid || "anonyme",
        userName: profile?.nomArtistique || profile?.name || profile?.displayName || currentUser?.displayName || "Anonyme",
        userEmail: profile?.email || currentUser?.email || "",
        status: "PENDING",
        createdAt: new Date().toISOString()
      });
      try { audioSynth?.playValidationSuccess?.(); } catch(e){}
      setSuccessMsg("Suggestion enregistrée avec succès dans le Trône du Fondateur !");
      setTimeout(() => {
        setSuccessMsg("");
        setActiveModal("none");
        setSuggestionText("");
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeDesc.trim()) return;
    setLoading(true);
    try {
      await gomboDB.submitDispute({
        title: `Litige Gombo: ${disputeGomboId || 'Prestation'}`,
        gomboId: disputeGomboId || "GOMBO-GENERAL",
        reason: disputeReason || "Litige Prestation",
        message: disputeDesc,
        details: disputeDesc,
        userId: profile?.uid || currentUser?.uid || "anonyme",
        userName: profile?.nomArtistique || profile?.name || profile?.displayName || currentUser?.displayName || "Anonyme",
        userEmail: profile?.email || currentUser?.email || "",
        status: "PENDING",
        createdAt: new Date().toISOString()
      });
      try { audioSynth?.playValidationSuccess?.(); } catch(e){}
      setSuccessMsg("Litige transmis au Tableau de Bord du Fondateur. Traitement prioritaire en cours.");
      setTimeout(() => {
        setSuccessMsg("");
        setActiveModal("none");
        setDisputeDesc("");
        setDisputeGomboId("");
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await gomboDB.submitBetaFeedback({
        type: 'user_review',
        rating,
        comment: reviewComment,
        userId: profile?.uid || currentUser?.uid || "anonymous",
        userName: profile?.nomArtistique || profile?.displayName || "Anonyme",
        createdAt: new Date().toISOString()
      });
      try { audioSynth?.playValidationSuccess?.(); } catch(e){}
      setSuccessMsg("Merci pour votre avis précieux ! L'équipe apprécie.");
      setTimeout(() => {
        setSuccessMsg("");
        setActiveModal("none");
        setReviewComment("");
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col text-left animate-fadeIn w-full">
      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col space-y-6 pt-4">
        <div className="flex justify-between items-center border-b border-afri-border pb-4">
          <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-3">
            <span className="text-[#D4AF37]">🛟</span>
            Centre d'Aide AFRIGOMBO ELITE
          </h2>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-afri-bg border border-afri-border hover:border-[#D4AF37] rounded-xl text-xs font-bold text-afri-text-sec hover:text-afri-text cursor-pointer transition-all"
          >
            Fermer ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 pb-20">
          <div className="p-5 rounded-2xl bg-afri-bg border border-afri-border text-afri-text-sec text-xs leading-relaxed space-y-3">
            <p>
              <strong className="text-afri-text">Le Support Officiel AFRIGOMBO ELITE</strong> est le seul canal autorisé pour obtenir une assistance technique, signaler un problème ou poser une question.
            </p>
            <p>
              Les échanges directs de coordonnées entre utilisateurs restent interdits afin de protéger les artistes, les organisateurs et les paiements sécurisés.
            </p>
          </div>

          <button 
            onClick={() => supportConfig.openSupport("Assistance Générale")}
            className="w-full flex items-center justify-between p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/50 hover:border-emerald-500/50 transition-all group text-left cursor-pointer shadow-lg shadow-emerald-950/20"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-afri-text uppercase text-sm">Contacter le Support AFRIGOMBO ELITE</h3>
                <p className="text-[10px] text-emerald-300">Support direct WhatsApp 24h/7</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => setActiveModal("faq")}
              className="flex items-center gap-4 p-4 rounded-xl bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 transition-all text-left cursor-pointer group"
            >
              <div className="p-2 bg-afri-bg-sec rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-afri-text uppercase block">Questions fréquentes (FAQ)</span>
                <span className="text-[10px] text-afri-text-sec">Consulter les réponses</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveModal("guides")}
              className="flex items-center gap-4 p-4 rounded-xl bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 transition-all text-left cursor-pointer group"
            >
              <div className="p-2 bg-afri-bg-sec rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-afri-text uppercase block">Guides d'utilisation</span>
                <span className="text-[10px] text-afri-text-sec">Tutoriels et manuels</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveModal("bug")}
              className="flex items-center gap-4 p-4 rounded-xl bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 transition-all text-left cursor-pointer group"
            >
              <div className="p-2 bg-afri-bg-sec rounded-lg text-red-400 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-afri-text uppercase block">Signaler un problème</span>
                <span className="text-[10px] text-afri-text-sec">Rapport direct Admin</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveModal("dispute")}
              className="flex items-center gap-4 p-4 rounded-xl bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 transition-all text-left cursor-pointer group"
            >
              <div className="p-2 bg-afri-bg-sec rounded-lg text-orange-400 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-afri-text uppercase block">Ouvrir un litige</span>
                <span className="text-[10px] text-afri-text-sec">Médiation Superfondateur</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveModal("review")}
              className="flex items-center gap-4 p-4 rounded-xl bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 transition-all text-left cursor-pointer group"
            >
              <div className="p-2 bg-afri-bg-sec rounded-lg text-[#D4AF37] group-hover:scale-110 transition-transform">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-afri-text uppercase block">Donner un avis</span>
                <span className="text-[10px] text-afri-text-sec">Notez votre expérience</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveModal("suggestion")}
              className="flex items-center gap-4 p-4 rounded-xl bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 transition-all text-left cursor-pointer group"
            >
              <div className="p-2 bg-afri-bg-sec rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-afri-text uppercase block">Faire une suggestion</span>
                <span className="text-[10px] text-afri-text-sec">Proposez des idées</span>
              </div>
            </button>

            <button 
              onClick={() => setActiveModal("support_contribution" as any)}
              className="col-span-1 sm:col-span-2 flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-afri-gold/25 to-amber-500/15 border border-afri-gold/60 hover:border-afri-gold transition-all text-left cursor-pointer group shadow-lg"
            >
              <div className="p-2.5 bg-afri-gold/20 rounded-xl text-afri-gold group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-black text-afri-gold uppercase block tracking-wider">❤️ Soutenir AFRIGOMBO ELITE</span>
                <span className="text-[10px] text-afri-text-sec">Contribuer à l'autonomie et l'expansion du showbiz africain</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* 1. FAQ MODAL */}
      {activeModal === "faq" && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-afri-bg border border-afri-gold/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => setActiveModal("none")}
              className="absolute top-4 right-4 p-2 text-afri-text-sec hover:text-afri-text rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <HelpCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-widest text-afri-gold uppercase">Questions Fréquentes (FAQ)</h3>
                <p className="text-[10px] text-afri-text-sec font-mono">Tout savoir sur l'écosystème AFRIGOMBO ELITE</p>
              </div>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="border border-afri-border rounded-xl bg-afri-bg overflow-hidden">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-afri-text hover:text-afri-gold transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-afri-gold" /> : <ChevronDown className="w-4 h-4 text-afri-text-sec" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-afri-text-sec border-t border-gray-900 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. GUIDES MODAL */}
      {activeModal === "guides" && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-afri-bg border border-afri-gold/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => setActiveModal("none")}
              className="absolute top-4 right-4 p-2 text-afri-text-sec hover:text-afri-text rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-widest text-afri-gold uppercase">Guides d'Utilisation</h3>
                <p className="text-[10px] text-afri-text-sec font-mono">Tutoriels et bonnes pratiques</p>
              </div>
            </div>

            <div className="space-y-4">
              {guides.map((g, i) => (
                <div key={i} className="p-4 rounded-xl bg-afri-bg border border-afri-border space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-afri-text uppercase">{g.title}</h4>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">{g.cat}</span>
                  </div>
                  <p className="text-xs text-afri-text-sec leading-relaxed">{g.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. BUG REPORT MODAL */}
      {activeModal === "bug" && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-afri-bg border border-afri-gold/20 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setActiveModal("none")}
              className="absolute top-4 right-4 p-2 text-afri-text-sec hover:text-afri-text rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-widest text-afri-gold uppercase">Signaler un Problème</h3>
                <p className="text-[10px] text-afri-text-sec font-mono">Rapport transmis au Superfondateur</p>
              </div>
            </div>

            {successMsg ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> {successMsg}
              </div>
            ) : (
              <form onSubmit={handleBugSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-afri-text-sec uppercase mb-2">Type de Problème</label>
                  <select 
                    value={bugType} 
                    onChange={(e) => setBugType(e.target.value)}
                    className="w-full bg-afri-bg border border-afri-border rounded-lg p-3 text-xs text-afri-text focus:border-afri-gold/50 focus:outline-none"
                  >
                    <option value="Affichage">📱 Affichage & Interface</option>
                    <option value="Validation">⚖️ Validation & Paiement</option>
                    <option value="Audio">🎵 Audio & Musique</option>
                    <option value="Autre">⚙️ Autre dysfonctionnement</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-afri-text-sec uppercase mb-2">Description du bug</label>
                  <textarea 
                    rows={4} 
                    required
                    value={bugDesc}
                    onChange={(e) => setBugDesc(e.target.value)}
                    placeholder="Décrivez précisément le problème rencontré..."
                    className="w-full bg-afri-bg border border-afri-border rounded-lg p-3 text-xs text-afri-text focus:border-afri-gold/50 focus:outline-none placeholder-gray-600 resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal("none")}
                    className="flex-1 py-3 border border-afri-border hover:bg-afri-bg-ter rounded-xl text-xs font-bold text-afri-text-sec transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-afri-gold hover:bg-amber-400 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Envoi..." : "Envoyer le rapport"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 4. DISPUTE MODAL */}
      {activeModal === "dispute" && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-afri-bg border border-afri-gold/20 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setActiveModal("none")}
              className="absolute top-4 right-4 p-2 text-afri-text-sec hover:text-afri-text rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-widest text-afri-gold uppercase">Ouvrir un Litige</h3>
                <p className="text-[10px] text-afri-text-sec font-mono">Transmission directe au Tableau de Bord Superfondateur</p>
              </div>
            </div>

            {successMsg ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> {successMsg}
              </div>
            ) : (
              <form onSubmit={handleDisputeSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-afri-text-sec uppercase mb-2">Réf Gombo / N° de Référence</label>
                  <input 
                    type="text"
                    required
                    value={disputeGomboId}
                    onChange={(e) => setDisputeGomboId(e.target.value)}
                    placeholder="Entrez la Réf Gombo concernée (ex: #GMB-881)"
                    className="w-full bg-afri-bg border border-afri-border rounded-lg p-3 text-xs text-afri-text focus:border-afri-gold/50 focus:outline-none placeholder-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-afri-text-sec uppercase mb-2">Motif du litige</label>
                  <select 
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full bg-afri-bg border border-afri-border rounded-lg p-3 text-xs text-afri-text focus:border-afri-gold/50 focus:outline-none"
                  >
                    <option value="Non-prestation">❌ Non-prestation ou absence</option>
                    <option value="Retard de paiement">⏳ Retard ou blocage de paiement</option>
                    <option value="Désaccord artistique">🎨 Désaccord sur la qualité artistique</option>
                    <option value="Autre litige">⚠️ Autre litige contractuel</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-afri-text-sec uppercase mb-2">Description / Preuve justificative</label>
                  <textarea 
                    rows={3} 
                    required
                    value={disputeDesc}
                    onChange={(e) => setDisputeDesc(e.target.value)}
                    placeholder="Expliquez en détail les faits et fournissez les éléments..."
                    className="w-full bg-afri-bg border border-afri-border rounded-lg p-3 text-xs text-afri-text focus:border-afri-gold/50 focus:outline-none placeholder-gray-600 resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal("none")}
                    className="flex-1 py-3 border border-afri-border hover:bg-afri-bg-ter rounded-xl text-xs font-bold text-afri-text-sec transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Transmission..." : "Soumettre le litige"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. REVIEW MODAL */}
      {activeModal === "review" && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-afri-bg border border-afri-gold/20 rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-center">
            <button 
              onClick={() => setActiveModal("none")}
              className="absolute top-4 right-4 p-2 text-afri-text-sec hover:text-afri-text rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Star className="w-5 h-5 text-afri-gold" />
              </div>
            </div>
            <h3 className="text-sm font-black tracking-widest text-afri-gold uppercase mb-1">Donner un Avis</h3>
            <p className="text-[10px] text-afri-text-sec font-mono mb-6">Évaluez votre expérience sur AFRIGOMBO ELITE</p>

            {successMsg ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> {successMsg}
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-left">
                <div className="flex justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`p-2 rounded-lg transition-transform hover:scale-125 cursor-pointer ${s <= rating ? "text-afri-gold" : "text-afri-text-sec"}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-afri-text-sec uppercase mb-2">Votre palabre</label>
                  <textarea 
                    rows={3} 
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Qu'avez-vous pensé de l'application ?"
                    className="w-full bg-afri-bg border border-afri-border rounded-lg p-3 text-xs text-afri-text focus:border-afri-gold/50 focus:outline-none placeholder-gray-600 resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal("none")}
                    className="flex-1 py-3 border border-afri-border hover:bg-afri-bg-ter rounded-xl text-xs font-bold text-afri-text-sec transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-afri-gold hover:bg-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Envoi..." : "Envoyer l'avis"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. SUGGESTION MODAL */}
      {activeModal === "suggestion" && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-afri-bg border border-afri-gold/20 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setActiveModal("none")}
              className="absolute top-4 right-4 p-2 text-afri-text-sec hover:text-afri-text rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Lightbulb className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-widest text-afri-gold uppercase">Faire une Suggestion</h3>
                <p className="text-[10px] text-afri-text-sec font-mono">Partagez vos idées d'amélioration</p>
              </div>
            </div>

            {successMsg ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> {successMsg}
              </div>
            ) : (
              <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-afri-text-sec uppercase mb-2">Quelle fonctionnalité ou amélioration aimeriez-vous voir dans l'application ?</label>
                  <textarea 
                    rows={4} 
                    required
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    placeholder="Ex: J'aimerais voir un classement par commune..."
                    className="w-full bg-afri-bg border border-afri-border rounded-lg p-3 text-xs text-afri-text focus:border-afri-gold/50 focus:outline-none placeholder-gray-600 resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal("none")}
                    className="flex-1 py-3 border border-afri-border hover:bg-afri-bg-ter rounded-xl text-xs font-bold text-afri-text-sec transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-afri-gold hover:bg-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Envoi..." : "Envoyer la suggestion"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 7. SUPPORT & CONTRIBUTION MODAL */}
      {(activeModal as string) === "support_contribution" && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-afri-bg border border-afri-gold/40 rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-left space-y-5">
            <button 
              onClick={() => setActiveModal("none")}
              className="absolute top-4 right-4 p-2 text-afri-text-sec hover:text-afri-text rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-afri-gold/20 flex items-center justify-center border border-afri-gold/40 text-afri-gold">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-widest text-afri-gold uppercase">❤️ Soutenir AFRIGOMBO ELITE</h3>
                <p className="text-[10px] text-afri-text-sec font-mono">Développement & Souveraineté Culturelle</p>
              </div>
            </div>

            <p className="text-xs text-afri-text-sec leading-relaxed">
              AFRIGOMBO ELITE est conçu pour propulser les artistes, instrumentistes et organisateurs d'Afrique. Votre soutien permet de financer les infrastructures serveurs, la protection des contrats et le développement d'outils d'élite.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  supportConfig.openSupport("Contribution Bâtisseur");
                  setActiveModal("none");
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-afri-gold/30 to-amber-500/20 border border-afri-gold text-afri-gold font-black uppercase text-xs hover:bg-afri-gold/30 transition-all flex items-center justify-between"
              >
                <span>Faire une contribution Mobile Money</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  supportConfig.openSupport("Obtenir Badge Bâtisseur");
                  setActiveModal("none");
                }}
                className="w-full py-3 px-4 rounded-xl bg-afri-bg-sec border border-afri-border hover:border-afri-gold/40 text-afri-text font-bold text-xs transition-all flex items-center justify-between"
              >
                <span>Obtenir le Badge Bâtisseur du Showbiz 👑</span>
                <ChevronRight className="w-4 h-4 text-afri-gold" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
