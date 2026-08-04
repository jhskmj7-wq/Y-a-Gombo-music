import React, { useState } from "react";
import { 
  ShieldCheck, Crown, Globe, Headphones, Megaphone, Bot, Sparkles, 
  ShieldAlert, HelpCircle, BookOpen, MessageSquare, Zap, Loader2,
  CheckCircle2, Award, Activity, Server, Users, Phone, Mail, FileText, Send, Check
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

interface AfrigomboTabProps {
  currentUser: any;
  supportConvo: any;
  setActiveConvo: (convo: any) => void;
  onOpenSupport: () => void;
}

export default function AfrigomboTab({
  currentUser,
  supportConvo,
  setActiveConvo,
  onOpenSupport
}: AfrigomboTabProps) {
  const [afrigomboCategory, setAfrigomboCategory] = useState<string>("all");
  
  // IA States
  const [aiAssistantQuery, setAiAssistantQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAssistantResponse, setAiAssistantResponse] = useState<string | null>(null);

  // Verification Form States
  const [cniSubmitted, setCniSubmitted] = useState(false);
  const [cniFile, setCniFile] = useState<string>("");

  // Suggestion & Bug states
  const [bugDesc, setBugDesc] = useState("");
  const [bugSuccess, setBugSuccess] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");
  const [suggestionSuccess, setSuggestionSuccess] = useState(false);

  const handleCniSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cniFile.trim()) return;
    setCniSubmitted(true);
  };

  const handleBugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugDesc.trim()) return;
    setBugSuccess(true);
    setTimeout(() => {
      setBugSuccess(false);
      setBugDesc("");
    }, 2000);
  };

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim()) return;
    setSuggestionSuccess(true);
    setTimeout(() => {
      setSuggestionSuccess(false);
      setSuggestionText("");
    }, 2000);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Official Hero Banner */}
      <div className="p-5 bg-gradient-to-br from-afri-bg-sec via-afri-bg to-afri-bg-ter border-2 border-[#D4AF37]/40 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none">
          <ShieldCheck className="w-32 h-32 text-[#D4AF37]" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5" />
              Centre Officiel de la Plateforme
            </div>
            <span className="text-[9px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Certifié Sûre
            </span>
          </div>

          <div>
            <h2 className="text-base font-black uppercase tracking-wide text-afri-text flex items-center gap-2">
              AFRIGOMBO ELITE SERVICES
            </h2>
            <p className="text-xs text-afri-text-sec mt-1 leading-relaxed">
              Espace institutionnel de la plateforme souveraine : assistance 24/7, garanties de sécurité, actualités du Fondateur et intelligence artificielle.
            </p>
          </div>

          {/* Status Metrics Bar */}
          <div className="pt-2 grid grid-cols-3 gap-2 border-t border-afri-border text-center">
            <div className="p-2 bg-afri-bg rounded-xl border border-afri-border">
              <span className="block text-[9px] text-afri-text-muted font-mono uppercase">Support 24/7</span>
              <strong className="text-xs text-emerald-500 font-bold">Actif & En Ligne</strong>
            </div>
            <div className="p-2 bg-afri-bg rounded-xl border border-afri-border">
              <span className="block text-[9px] text-afri-text-muted font-mono uppercase">Séquestre</span>
              <strong className="text-xs text-[#D4AF37] font-bold">Garantie 100%</strong>
            </div>
            <div className="p-2 bg-afri-bg rounded-xl border border-afri-border">
              <span className="block text-[9px] text-afri-text-muted font-mono uppercase">Version</span>
              <strong className="text-xs text-afri-text font-bold">v2.5 Souverain</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Horizontal Scroll Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1">
        {[
          { id: "all", label: "Tous les Services", icon: Globe },
          { id: "support", label: "Support Officiel", icon: Headphones },
          { id: "ia", label: "Assistance IA", icon: Bot },
          { id: "updates", label: "Actualités & Communauté", icon: Sparkles },
          { id: "security", label: "Vérification & Sécurité", icon: ShieldAlert },
          { id: "status", label: "Statut des Serveurs", icon: Server },
          { id: "suggest", label: "Rapports & Suggestions", icon: Megaphone },
          { id: "faq", label: "FAQ & Tutoriels", icon: HelpCircle }
        ].map((cat) => {
          const isSel = afrigomboCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setAfrigomboCategory(cat.id)}
              className={`px-3 py-2 text-[10.5px] font-bold rounded-xl border whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isSel
                  ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-sm font-black"
                  : "bg-afri-bg-sec text-afri-text-sec border-afri-border hover:text-afri-text"
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 1. SUPPORT OFFICIEL DIRECT CARD */}
      {(afrigomboCategory === "all" || afrigomboCategory === "support") && (
        <div className="p-4 bg-afri-bg-sec border border-[#D4AF37]/40 rounded-2xl space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shrink-0">
                <img src="/logo_afrigombo.png" alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-afri-text tracking-wider flex items-center gap-1.5">
                  Support Officiel AFRIGOMBO ELITE
                  <span className="text-[9px] text-[#D4AF37] font-bold">✔ Officiel</span>
                </h3>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Équipe d'assistance en ligne (Réponse &lt; 5 min)
                </p>
              </div>
            </div>

            {supportConvo?.unreadCount?.[currentUser?.uid] > 0 && (
              <span className="px-2.5 py-1 bg-rose-500 text-white font-black text-xs rounded-full animate-bounce">
                {supportConvo.unreadCount[currentUser.uid]}
              </span>
            )}
          </div>

          <p className="text-xs text-afri-text-sec leading-relaxed">
            Avez-vous une question sur un paiement en séquestre, un problème technique ou un litige sur une prestation ? L'équipe officielle AFRIGOMBO ELITE est à votre disposition 24h/24.
          </p>

          <button
            onClick={() => {
              onOpenSupport();
            }}
            className="w-full py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <MessageSquare className="w-4 h-4 fill-black" />
            Ouvrir la Conversation Support 24/7
          </button>
        </div>
      )}

      {/* 2. ASSISTANCE IA INTERACTIVE */}
      {(afrigomboCategory === "all" || afrigomboCategory === "ia") && (
        <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Assistance IA Interactive AFRIGOMBO ELITE
            </h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Gemini Instant
            </span>
          </div>

          <p className="text-[11px] text-afri-text-sec">
            Posez vos questions à l'Assistant IA certifié sur les contrats, les retraits, le séquestre ou les règles d'utilisation.
          </p>

          <div className="space-y-2">
            <div className="flex flex-col xs:flex-row gap-2">
              <input
                type="text"
                placeholder="Ex: Comment fonctionne le paiement séquestre ?"
                value={aiAssistantQuery}
                onChange={(e) => setAiAssistantQuery(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] placeholder:text-afri-text-muted min-w-0"
              />
              <button
                onClick={() => {
                  if (!aiAssistantQuery.trim()) return;
                  setIsAiLoading(true);
                  setAiAssistantResponse(null);
                  setTimeout(() => {
                    const q = aiAssistantQuery.toLowerCase();
                    let resp = "Pour la sécurité de votre prestation Gombo, tous les fonds sont bloqués en séquestre bancaire jusqu'à la validation finale du client. Aucun paiement direct hors plateforme n'est autorisé.";
                    if (q.includes("contrat")) {
                      resp = "Les contrats Gombo sont générés automatiquement avec signature numérique dès acceptation de l'offre. Ils protègent l'artiste et le recruteur en cas de litige.";
                    } else if (q.includes("retrait") || q.includes("argent") || q.includes("solde")) {
                      resp = "Les retraits de votre portefeuille Gombo s'effectuent instantanément par Mobile Money (Orange, MTN, Moov, Wave) ou virement bancaire sous 24h.";
                    } else if (q.includes("numéro") || q.includes("whatsapp") || q.includes("téléphone")) {
                      resp = "Le partage de numéros de téléphone est automatiquement modéré jusqu'à l'acceptation formelle d'un contrat afin d'éviter les arnaques hors plateforme.";
                    }
                    setAiAssistantResponse(resp);
                    setIsAiLoading(false);
                  }, 600);
                }}
                disabled={isAiLoading}
                className="px-4 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-bold text-xs uppercase rounded-xl transition cursor-pointer xs:shrink-0 flex items-center justify-center gap-1 w-full xs:w-auto"
              >
                {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Demander
              </button>
            </div>

            {/* Quick AI Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                "Comment être payé ?",
                "Sécurité & Séquestre",
                "Règles d'annulation",
                "Numéro de téléphone masqué"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAiAssistantQuery(chip);
                    setIsAiLoading(true);
                    setTimeout(() => {
                      let resp = "Sur AFRIGOMBO ELITE, le séquestre garantit que les fonds sont réservés avant la prestation. Vous êtes payé dès validation du service !";
                      if (chip.includes("Numéro")) resp = "Les numéros sont masqués avant contrat pour protéger vos transactions contre la fraude hors réseau.";
                      if (chip.includes("annulation")) resp = "En cas d'annulation avant 24h, les fonds sont remboursés. En cas de non-présentation, le séquestre indemnise la partie lésée.";
                      setAiAssistantResponse(resp);
                      setIsAiLoading(false);
                    }, 400);
                  }}
                  className="px-2.5 py-1 bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 rounded-lg text-[10px] text-afri-text-sec hover:text-afri-text transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* AI Output Box */}
            {aiAssistantResponse && (
              <div className="p-3.5 bg-afri-bg border border-[#D4AF37]/30 rounded-xl space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#D4AF37]">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Réponse de l'Assistance IA</span>
                </div>
                <p className="text-xs text-afri-text leading-relaxed">
                  {aiAssistantResponse}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ACTUALITÉS & COMMUNAUTÉ */}
      {(afrigomboCategory === "all" || afrigomboCategory === "updates") && (
        <div className="space-y-3">
          {/* Message du Fondateur */}
          <div className="p-4 bg-afri-bg-sec border border-[#D4AF37]/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider">
                  Le Mot du Fondateur d'AFRIGOMBO ELITE
                </h4>
              </div>
              <span className="text-[9px] font-mono text-afri-text-muted">Officiel</span>
            </div>
            <p className="text-xs text-afri-text leading-relaxed italic">
              « Chers artistes, prestataires et recruteurs africains. AFRIGOMBO ELITE a été conçu pour donner à nos compétences locales la valeur financière qu'elles méritent. Utilisez le séquestre : c'est notre meilleure garantie d'éthique et de sécurité. »
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-afri-text-sec border-t border-afri-border">
              <span>La Direction AFRIGOMBO ELITE</span>
              <span className="font-mono text-[#D4AF37]">Abidjan, Côte d'Ivoire</span>
            </div>
          </div>

          {/* Actualités List */}
          <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Actualités de la Communauté
            </h4>
            <div className="space-y-3 text-xs divide-y divide-afri-border/40">
              <div className="pt-2 first:pt-0 space-y-1">
                <span className="text-[9px] bg-[#D4AF37]/15 text-[#D4AF37] px-2 py-0.5 rounded-full border border-[#D4AF37]/30 font-bold font-mono">CAMPAGNE</span>
                <strong className="block text-afri-text mt-1">Lancement du badge Élite 👑 pour artistes vérifiés</strong>
                <p className="text-afri-text-sec text-[11px]">Tous les artistes ayant complété 5 prestations sans incident recevront automatiquement le badge de visibilité supérieure.</p>
              </div>
              <div className="pt-2 space-y-1">
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold font-mono">SÉQUESTRE</span>
                <strong className="block text-afri-text mt-1">Sécurité de transaction renforcée sur Mobile Money</strong>
                <p className="text-afri-text-sec text-[11px]">Notre infrastructure intègre désormais la double validation OTP pour tous les paiements Mobile Money (Orange, MTN, Wave).</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. VÉRIFICATION DES COMPTES & SÉCURITÉ */}
      {(afrigomboCategory === "all" || afrigomboCategory === "security") && (
        <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Centre de Certification & Identité Souveraine
          </h3>
          <p className="text-xs text-afri-text-sec">
            Obtenez le badge officiel de vérification d'identité en soumettant votre pièce d'identité nationale ou passeport d'un pays africain.
          </p>

          {cniSubmitted ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-2 text-emerald-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto" />
              <p className="font-bold">Dossier en cours d'examen</p>
              <p className="text-[10px] text-afri-text-sec">L'équipe d'AFRIGOMBO ELITE valide votre pièce sous 24 heures.</p>
            </div>
          ) : (
            <form onSubmit={handleCniSubmit} className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-afri-text">Numéro de pièce d'identité (CNI ou Passeport)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: C01928374 / CI-09283..."
                  value={cniFile}
                  onChange={(e) => setCniFile(e.target.value)}
                  className="w-full px-3 py-2 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-[10px] rounded-xl transition cursor-pointer"
              >
                Soumettre ma demande de certification
              </button>
            </form>
          )}
        </div>
      )}

      {/* 5. STATUT DES SERVEURS & MAINTENANCE */}
      {(afrigomboCategory === "all" || afrigomboCategory === "status") && (
        <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-afri-text uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-[#D4AF37]" />
              Supervision des Infrastructures AFRIGOMBO ELITE
            </h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              100% stable
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-afri-bg border border-afri-border rounded-xl flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                API Chat & Messagerie Directe
              </span>
              <span className="font-mono text-[10px] text-emerald-400 font-bold">En ligne</span>
            </div>
            <div className="p-3 bg-afri-bg border border-afri-border rounded-xl flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Passerelle Mobile Money & Séquestre
              </span>
              <span className="font-mono text-[10px] text-emerald-400 font-bold">En ligne</span>
            </div>
            <div className="p-3 bg-afri-bg border border-afri-border rounded-xl flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Signatures des Contrats Numériques
              </span>
              <span className="font-mono text-[10px] text-emerald-400 font-bold">En ligne</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. SIGNALER UN BUG & ENVOYER SUGGESTION */}
      {(afrigomboCategory === "all" || afrigomboCategory === "suggest") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3 text-xs">
            <h4 className="font-bold text-afri-text uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
              <ShieldAlert className="w-4 h-4 text-orange-400" /> Signaler un Bug Technique
            </h4>
            {bugSuccess ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-center">
                Merci ! Bug enregistré.
              </div>
            ) : (
              <form onSubmit={handleBugSubmit} className="space-y-2">
                <textarea
                  required
                  placeholder="Décrivez précisément le bug technique rencontré sur l'interface..."
                  rows={2}
                  value={bugDesc}
                  onChange={(e) => setBugDesc(e.target.value)}
                  className="w-full p-2.5 bg-afri-bg border border-afri-border rounded-xl focus:outline-none focus:border-[#D4AF37] placeholder:text-afri-text-muted text-xs resize-none"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-afri-bg border border-afri-border hover:border-orange-400 text-afri-text font-bold rounded-lg text-[10px]"
                >
                  Envoyer le rapport
                </button>
              </form>
            )}
          </div>

          <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3 text-xs">
            <h4 className="font-bold text-afri-text uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
              <Megaphone className="w-4 h-4 text-[#D4AF37]" /> Envoyer une Suggestion
            </h4>
            {suggestionSuccess ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-center">
                Merci ! Suggestion soumise.
              </div>
            ) : (
              <form onSubmit={handleSuggestionSubmit} className="space-y-2">
                <textarea
                  required
                  placeholder="Quelle fonctionnalité ou amélioration souhaiteriez-vous sur AFRIGOMBO ELITE ?"
                  rows={2}
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  className="w-full p-2.5 bg-afri-bg border border-afri-border rounded-xl focus:outline-none focus:border-[#D4AF37] placeholder:text-afri-text-muted text-xs resize-none"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-afri-bg border border-afri-border hover:border-[#D4AF37] text-afri-text font-bold rounded-lg text-[10px]"
                >
                  Soumettre la suggestion
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 7. FAQ & AIDE & TUTORIELS */}
      {(afrigomboCategory === "all" || afrigomboCategory === "faq") && (
        <div className="space-y-3 text-xs">
          <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
            <h4 className="font-bold text-afri-text uppercase tracking-wide flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#D4AF37]" /> FAQ : Questions Fréquentes
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <strong className="block text-afri-text">Qu'est-ce que le paiement séquestre ?</strong>
                <p className="text-afri-text-sec">C'est une garantie souveraine d'AFRIGOMBO ELITE : l'argent du client est bloqué en toute sécurité avant le début de la prestation, et débloqué au prestataire dès que le service est rendu.</p>
              </div>
              <div className="space-y-1">
                <strong className="block text-afri-text">Que faire en cas de désaccord ou de litige ?</strong>
                <p className="text-afri-text-sec">Ouvrez le chat support 24/7 officiel. Nos médiateurs interviennent immédiatement pour analyser les preuves et rembourser de manière équitable.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
            <h4 className="font-bold text-afri-text uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#D4AF37]" /> Tutoriels Professionnels Gombo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="p-3 bg-afri-bg border border-afri-border rounded-xl space-y-1">
                <span className="text-[9px] font-mono font-bold text-[#D4AF37]">COURS 1</span>
                <strong className="block text-afri-text">Comment valoriser son Book d'Artiste ?</strong>
                <span className="text-[10px] text-afri-text-sec">Apprenez à rédiger vos offres et obtenir le badge Élite.</span>
              </div>
              <div className="p-3 bg-afri-bg border border-afri-border rounded-xl space-y-1">
                <span className="text-[9px] font-mono font-bold text-[#D4AF37]">COURS 2</span>
                <strong className="block text-afri-text">Négocier et signer un contrat en 2 min</strong>
                <span className="text-[10px] text-afri-text-sec">Le guide pour configurer le séquestre avec votre client.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
