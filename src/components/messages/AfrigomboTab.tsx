import React, { useState } from "react";
import { ShieldCheck, Crown, Globe, Headphones, Megaphone, Bot, Sparkles, ShieldAlert, HelpCircle, BookOpen, MessageSquare, Zap, Loader2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

interface AfrigomboTabProps {
  currentUser: any;
  supportConvo: any;
  setActiveConvo: (convo: any) => void;
}

export default function AfrigomboTab({
  currentUser,
  supportConvo,
  setActiveConvo
}: AfrigomboTabProps) {
  const [afrigomboCategory, setAfrigomboCategory] = useState<string>("all");
  const [aiAssistantQuery, setAiAssistantQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAssistantResponse, setAiAssistantResponse] = useState<string | null>(null);

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
            <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Certifié Sûre
            </span>
          </div>

          <div>
            <h2 className="text-base font-black uppercase tracking-wide text-afri-text flex items-center gap-2">
              AFRIGOMBO SERVICES
            </h2>
            <p className="text-xs text-afri-text-sec mt-1 leading-relaxed">
              Espace institutionnel de la plateforme souveraine : assistance 24/7, garanties de sécurité, actualités du Fondateur et intelligence artificielle.
            </p>
          </div>

          {/* Status Metrics Bar */}
          <div className="pt-2 grid grid-cols-3 gap-2 border-t border-afri-border text-center">
            <div className="p-2 bg-afri-bg rounded-xl border border-afri-border">
              <span className="block text-[9px] text-afri-text-muted font-mono uppercase">Support 24/7</span>
              <strong className="text-xs text-emerald-400 font-bold">Actif & En Ligne</strong>
            </div>
            <div className="p-2 bg-afri-bg rounded-xl border border-afri-border">
              <span className="block text-[9px] text-afri-text-muted font-mono uppercase">Séquestre</span>
              <strong className="text-xs text-[#D4AF37] font-bold">Guarantie 100%</strong>
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
          { id: "admin", label: "Administratif", icon: Megaphone },
          { id: "fondateur", label: "Le Fondateur", icon: Crown },
          { id: "ia", label: "Assistance IA", icon: Bot },
          { id: "updates", label: "Nouveautés & Log", icon: Sparkles },
          { id: "security", label: "Sécurité", icon: ShieldAlert },
          { id: "faq", label: "FAQ & Aide", icon: HelpCircle },
          { id: "tutorials", label: "Tutoriels", icon: BookOpen }
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
                <img src="/logo.png" alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-afri-text tracking-wider flex items-center gap-1.5">
                  Support Officiel AFRIGOMBO
                  <span className="text-[9px] text-[#D4AF37] font-bold">✔ Officiel</span>
                </h3>
                <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
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
            Avez-vous une question sur un paiement en séquestre, un problème technique ou un litige sur une prestation ? L'équipe officielle AFRIGOMBO est à votre disposition 24h/24.
          </p>

          <button
            onClick={() => {
              setActiveConvo({
                id: currentUser.uid,
                type: "support",
                participants: [currentUser.uid, "afrigombo_support"],
                userName: "Équipe AFRIGOMBO",
                userPhoto: "/logo.png",
                ...supportConvo
              });
              if (supportConvo?.unreadCount?.[currentUser?.uid] > 0) {
                try {
                  const convoRef = doc(db, "supportConversations", currentUser.uid);
                  updateDoc(convoRef, { [`unreadCount.${currentUser.uid}`]: 0 });
                } catch (err) {}
              }
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
              Assistance IA Interactive AFRIGOMBO
            </h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Gemini Instant
            </span>
          </div>

          <p className="text-[11px] text-afri-text-sec">
            Posez vos questions à l'Assistant IA certifié sur les contrats, les retraits, le séquestre ou les règles d'utilisation.
          </p>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Comment fonctionne le paiement séquestre ?"
                value={aiAssistantQuery}
                onChange={(e) => setAiAssistantQuery(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] placeholder:text-afri-text-muted"
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
                className="px-4 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-bold text-xs uppercase rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1"
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
                      let resp = "Sur AFRIGOMBO, le séquestre garantit que les fonds sont réservés avant la prestation. Vous êtes payé dès validation du service !";
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

      {/* 3. MESSAGES ADMINISTRATIFS ET FONDATEUR */}
      {(afrigomboCategory === "all" || afrigomboCategory === "admin" || afrigomboCategory === "fondateur") && (
        <div className="space-y-3">
          {/* Message du Fondateur */}
          <div className="p-4 bg-afri-bg-sec border border-[#D4AF37]/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider">
                  Message du Fondateur d'AFRIGOMBO
                </h4>
              </div>
              <span className="text-[9px] font-mono text-afri-text-muted">Officiel</span>
            </div>
            <p className="text-xs text-afri-text leading-relaxed italic">
              « Chers artistes, prestataires et partenaires africains. AFRIGOMBO a été conçu pour donner à notre culture et nos compétences la valeur et la protection financière qu'elles méritent. Utilisez la plateforme en toute confiance : chaque contrat signé ici est un pas vers l'autonomie et le respect du travail. »
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-afri-text-sec border-t border-afri-border">
              <span>La Direction & Fondation AFRIGOMBO</span>
              <span className="font-mono text-[#D4AF37]">Abidjan, Côte d'Ivoire</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
