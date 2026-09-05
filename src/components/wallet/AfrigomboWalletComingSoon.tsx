import React, { useState } from "react";
import { 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  QrCode, 
  History, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Layers, 
  Coins, 
  Zap, 
  ChevronRight,
  Info,
  Smartphone,
  CreditCard,
  UserCheck,
  Building2,
  Eye
} from "lucide-react";
import { AndroidBottomSheet } from "../common/AfriModal";

interface AfrigomboWalletComingSoonProps {
  onBack?: () => void;
  isSuperFounderUser?: boolean;
  onPreviewActiveWallet?: () => void;
}

export default function AfrigomboWalletComingSoon({
  onBack,
  isSuperFounderUser = false,
  onPreviewActiveWallet
}: AfrigomboWalletComingSoonProps) {
  const [selectedActionInfo, setSelectedActionInfo] = useState<{
    title: string;
    shortDesc: string;
    details: string[];
    icon: any;
    badge: string;
  } | null>(null);

  const actionPreviews = [
    {
      id: "deposit",
      title: "Recharger (Dépôt)",
      shortDesc: "Wave, Orange, MTN, Moov, Cartes Visa & Mastercard",
      badge: "Bientôt disponible",
      icon: ArrowUpRight,
      color: "emerald",
      details: [
        "Recharge instantanée de votre solde en monnaie locale (FCFA / XOF / XAF).",
        "Passerelles partenaires Mobile Money régulées avec vérification instantanée.",
        "Paiement par cartes bancaires internationales et régionales avec 3D Secure.",
        "Fonds cantonnés et protégés sur des comptes séquestres certifiés."
      ]
    },
    {
      id: "withdraw",
      title: "Retirer des Fonds",
      shortDesc: "Virement direct vers Mobile Money & comptes bancaires",
      badge: "Bientôt disponible",
      icon: ArrowDownLeft,
      color: "amber",
      details: [
        "Retraits ultra-rapides vers votre numéro de Mobile Money vérifié.",
        "Transfert vers comptes bancaires locaux avec confirmation automatisée.",
        "Validation de retrait sécurisée par code PIN chiffré à 4 chiffres ou biométrie.",
        "Plafonds modulables selon le statut de votre Gombo ID et profil vérifié."
      ]
    },
    {
      id: "transfer",
      title: "Scanner & Transfert P2P",
      shortDesc: "Paiements directs par QR code ou pseudo membre",
      badge: "Bientôt disponible",
      icon: QrCode,
      color: "purple",
      details: [
        "Règlement instantané entre membres AFRIGOMBO sans frais de transfert internes.",
        "Génération de QR codes dynamiques pour prestations et commerces locaux.",
        "Confirmation réciproque avec reçu numérique cryptographique horodaté.",
        "Idéal pour régler une prestation locale ou un pourboire sans friction."
      ]
    },
    {
      id: "history",
      title: "Historique & Reçus",
      shortDesc: "Journal des transactions certifié et immuable",
      badge: "Bientôt disponible",
      icon: History,
      color: "sky",
      details: [
        "Registre exhaustif de toutes vos opérations : dépôts, gains, libérations de séquestre.",
        "Téléchargement de reçus officiels avec numéro de référence unique.",
        "Filtrage par type de flux (Contrats, Commissions, Dépôts, Retraits).",
        "Transparence totale sur les commissions de plateforme appliquées."
      ]
    }
  ];

  const escrowSteps = [
    {
      step: "01",
      title: "Publication & Engagement",
      description: "Le promoteur valide le budget du Gombo ou contrat. Le montant convenu est consigné sans intermédiaire bancaire lourd.",
      icon: FileText
    },
    {
      step: "02",
      title: "Mise en Séquestre Sécurisé",
      description: "Les fonds sont cantonnés sur un compte de séquestre inviolable. Le promoteur sait que le budget est réservé, et le talent sait que l'argent est garanti.",
      icon: ShieldCheck
    },
    {
      step: "03",
      title: "Règles d'Annulation Pré-Sélection",
      description: "Tant qu'aucun talent n'a été engagé contractuellement, le promoteur peut annuler selon les règles du système et récupérer 100% de son budget.",
      icon: Clock
    },
    {
      step: "04",
      title: "Sélection & Verrouillage Contractuel",
      description: "Une fois le talent sélectionné et son accord formalisé, le contrat devient actif. Les clauses de résiliation strictes protègent les deux parties.",
      icon: UserCheck
    },
    {
      step: "05",
      title: "Réalisation de la Prestation",
      description: "Le talent accomplit sa mission ou délivre ses livrables avec la certitude que la rémunération est déjà sécurisée en séquestre.",
      icon: Zap
    },
    {
      step: "06",
      title: "Double Validation Mutuelle",
      description: "Le talent notifie l'achèvement et le promoteur vérifie la conformité de la prestation conformément au cahier des charges.",
      icon: CheckCircle2
    },
    {
      step: "07",
      title: "Libération Immédiate des Fonds",
      description: "Après validation mutuelle, les fonds sont instantanément libérés et crédités sur le solde disponible du talent, prêts pour un retrait immédiat.",
      icon: ArrowUpRight
    },
    {
      step: "08",
      title: "Commissions & Frais Transparents",
      description: "Les frais d'infrastructure et commissions de plateforme sont calculés et affichés avec une clarté totale avant chaque validation. Zéro frais masqué.",
      icon: Coins
    }
  ];

  return (
    <div className="w-full min-h-full bg-afri-bg text-afri-text pb-20 font-sans selection:bg-[#D4AF37]/30">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HEADER DE NAVIGATION & CONTRÔLE ADMIN
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="sticky top-0 z-30 bg-afri-bg/95 backdrop-blur-md border-b border-afri-border px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                id="btn-back-wallet-coming-soon"
                onClick={onBack}
                className="w-9 h-9 rounded-xl bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] flex items-center justify-center text-afri-text hover:text-[#D4AF37] transition cursor-pointer"
                title="Retour"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-afri-text flex items-center gap-2">
                  <span>Porte-Monnaie Souverain</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Bientôt disponible
                </span>
              </div>
              <p className="text-[11px] text-afri-text-muted font-mono">
                Source de Vérité : Centre de Déploiement Administrateur
              </p>
            </div>
          </div>

          {/* Bouton aperçu pour Fondateur / Admin */}
          {isSuperFounderUser && onPreviewActiveWallet && (
            <button
              type="button"
              id="btn-admin-preview-wallet"
              onClick={onPreviewActiveWallet}
              className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-[#D4AF37]/25 transition cursor-pointer"
              title="Aperçu Fondateur du Tableau Opérationnel"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Aperçu Dashboard Actif</span>
              <span className="sm:hidden">Aperçu</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-8">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            1. BANNIÈRE PRINCIPALE : STATUT DU DÉPLOIEMENT
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400/90 block">
                  Statut du Module Financier
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Le Wallet AFRIGOMBO se prépare
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
              Le Wallet est le futur coffre-fort financier souverain d'AFRIGOMBO, conçu pour sécuriser 
              l'intégralité des transactions et des contrats entre promoteurs et talents africains.
            </p>

            {/* Pourquoi indisponible ? */}
            <div className="rounded-2xl bg-black/60 border border-zinc-800 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold font-mono uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Pourquoi ce module est-il actuellement inactif ?</span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-relaxed font-sans">
                Conformément au contrôle du tableau de bord administrateur, ce module est maintenu en mode 
                <strong className="text-white font-semibold"> « Bientôt disponible »</strong> durant la phase 
                d'audit de sécurité bancaire, d'étanchéité des transactions et d'alignement avec les 
                passerelles partenaires (Mobile Money & Cartes). 
                <strong className="text-amber-400 font-medium"> Aucune opération financière réelle n'est encore autorisée</strong> afin de protéger rigoureusement vos fonds.
              </p>
            </div>

            {/* Indicateurs clés */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase block">Opérations Réelles</span>
                <span className="text-xs font-black text-rose-400 font-mono block">Inactives 🔒</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase block">Séquestre</span>
                <span className="text-xs font-black text-amber-400 font-mono block">Préparation 🛡️</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase block">Mobile Money</span>
                <span className="text-xs font-black text-sky-400 font-mono block">Wave • OM • MTN</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase block">Pilotage</span>
                <span className="text-xs font-black text-[#D4AF37] font-mono block">Admin Toggle ⚙️</span>
              </div>
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            2. ACTIONS RAPIDES FUTURES (INACTIVES EN MODE BIENTÔT DISPONIBLE)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
              Fonctionnalités Futures (Aperçu)
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              Opérations Désactivées
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {actionPreviews.map((action) => {
              const IconComp = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setSelectedActionInfo(action)}
                  className="w-full p-4 rounded-[20px] bg-afri-bg-sec border border-afri-border hover:border-amber-500/40 transition-all text-left space-y-2 group cursor-pointer hover:bg-zinc-900/80 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                      action.color === "emerald" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      action.color === "amber" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      action.color === "purple" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                      "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      {action.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                      {action.shortDesc}
                    </p>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>Cliquez pour les détails</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            3. LE SÉQUESTRE SOUVERAIN : LOGIQUE & FONCTIONNEMENT FUTUR
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="rounded-[24px] bg-afri-bg-sec border border-afri-border p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              Principe Clé du Système Futur
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Le Séquestre Souverain d'AFRIGOMBO
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Pour éliminer tout risque d'impayé ou de prestation non délivrée, le Wallet intégrera un mécanisme 
              de séquestre automatisé et transparent. Voici le déroulement qui sera appliqué :
            </p>
          </div>

          {/* Grille des étapes du séquestre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {escrowSteps.map((item) => {
              const StepIcon = item.icon;
              return (
                <div 
                  key={item.step}
                  className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-black text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-md border border-[#D4AF37]/20">
                      ÉTAPE {item.step}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                      <StepIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-white font-sans">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Note sur les règles d'annulation */}
          <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-300 font-mono text-[11px] uppercase">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Règles d'annulation & de médiation</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Avant la confirmation contractuelle d'un talent, l'annulation par le promoteur est intégrale et sans pénalité. 
              Après engagement mutuel, toute demande d'annulation est régie par les clauses du contrat, avec procédure 
              de médiation intégrée sur AFRIGOMBO en cas de litige pour garantir l'équité entre les deux parties.
            </p>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            4. ARCHITECTURE : ABONNEMENTS VS BOOSTS VS WALLET
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="rounded-[24px] bg-afri-bg-sec border border-afri-border p-6 sm:p-8 space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                Architecture de Monétisation AFRIGOMBO
              </h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Le Wallet reste strictement indépendant des abonnements et des boosts ponctuels :
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Abonnements */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-black text-white uppercase">Abonnements</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Accès direct aux avantages du statut Premium / VIP : visibilité prioritaire, outils pro, 
                et insignes de distinction.
              </p>
            </div>

            {/* Boosts */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-black text-white uppercase">Boosts</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Achat de services ponctuels pour propulser un Gombo ou un profil en tête d'affiche 
                sur Le Terrain, sans engagement récurrent.
              </p>
            </div>

            {/* Wallet */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-amber-500/30 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Coins className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-black text-amber-400 uppercase">Wallet Souverain</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Système financier et de séquestre futur, gouverné en temps réel par le bouton 
                administrateur du Centre de Déploiement.
              </p>
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            5. NOTE DE SÉCURITÉ & CONTACT
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="text-center py-4 space-y-2 border-t border-afri-border pt-6">
          <p className="text-[11px] font-mono text-zinc-500">
            AFRIGOMBO SECURE LEDGER SYSTEM • PROTOCOLE DE CONSIGNATION MULTI-DEVISES
          </p>
          <p className="text-[10px] text-zinc-600">
            Dès l'activation par l'administration, le Wallet sera instantanément opérationnel pour tous les utilisateurs qualifiés.
          </p>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BOTTOM SHEET MODAL : DÉTAILS DE L'ACTION SÉLECTIONNÉE
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {selectedActionInfo && (
        <AndroidBottomSheet
          isOpen={!!selectedActionInfo}
          onClose={() => setSelectedActionInfo(null)}
          title={selectedActionInfo.title}
        >
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wide block">
                  Fonctionnalité en phase de finalisation
                </span>
                <p className="text-xs text-zinc-300 font-sans">
                  {selectedActionInfo.shortDesc}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                Ce qui sera disponible au lancement :
              </span>
              <div className="space-y-2">
                {selectedActionInfo.details.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300 font-sans">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
              Statut actuel : 🔒 Inactif sur ordre de la configuration centrale. Aucune transaction financière ne peut être déclenchée.
            </div>

            <button
              type="button"
              onClick={() => setSelectedActionInfo(null)}
              className="w-full py-3 rounded-xl bg-afri-bg-sec hover:bg-zinc-800 border border-afri-border font-bold text-xs text-white uppercase tracking-wider transition cursor-pointer"
            >
              Compris
            </button>
          </div>
        </AndroidBottomSheet>
      )}
    </div>
  );
}
