import React from "react";
import { Shield, FileText, CheckCircle2, AlertTriangle, Lock, MessageSquare, PhoneCall } from "lucide-react";
import { supportConfig } from "../supportConfig";

export const CGUContent: React.FC = () => (
  <div className="space-y-6 text-xs text-afri-text-sec leading-relaxed font-sans">
    <div className="text-center space-y-2 pb-4 border-b border-afri-border/60">
      <div className="inline-flex p-3 bg-afri-gold/10 text-afri-gold rounded-2xl">
        <FileText className="w-7 h-7" />
      </div>
      <h2 className="text-xl sm:text-2xl font-black text-afri-text uppercase tracking-tight">
        Conditions Générales d'Utilisation (CGU)
      </h2>
      <p className="text-[11px] text-afri-text-sec max-w-sm mx-auto font-medium">
        Règlement officiel de l'écosystème AFRIGOMBO • Y’A GOMBO MUSIC. Applicable à tous les artistes, musiciens, prestataires et recruteurs en Côte d’Ivoire.
      </p>
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border/60 pb-2">
        <span className="text-afri-gold">✓</span> 1. Acceptation & Vocation Exclusive
      </h3>
      <p>
        En créant un compte ou en utilisant l'application <strong>AFRIGOMBO (Y’A GOMBO MUSIC)</strong>, vous acceptez pleinement et sans réserve le présent règlement. L'application a pour vocation exclusive de faciliter la mise en relation showbiz, la publication d'annonces de gombos scéniques (prestations, concerts, répétitions, contrats), et la gestion sécurisée des cachets d'artistes.
      </p>
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border/60 pb-2">
        <span className="text-afri-gold">✓</span> 2. Engagements & Responsabilités des Utilisateurs
      </h3>
      <p>
        Chaque utilisateur est personnellement responsable des contenus qu'il publie, des messages partagés, et des engagements contractuels pris sur la plateforme. 
        Les artistes s'engagent à se présenter à l'heure aux répétitions ou prestations convenues. Les recruteurs contractants s'engagent à respecter l'intégrité physique et professionnelle des artistes et à régler l'intégralité du cachet convenu via les canaux sécurisés.
      </p>
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border/60 pb-2">
        <span className="text-afri-gold">✓</span> 3. Contenu Rigoureusement Interdit
      </h3>
      <p>
        Tout contenu sortant du cadre du showbiz et de la musique est strictement prohibé. Notre équipe de modération effectue des contrôles réguliers. Sont formellement interdits :
      </p>
      <ul className="pl-5 space-y-1.5 list-disc text-afri-text-muted">
        <li>Le harcèlement moral, sexuel, ou les injures envers un membre de la communauté.</li>
        <li>La publication de fausses annonces de gombos ou de tarifs mensongers.</li>
        <li>Les médias à caractère haineux, violent, politique ou pornographique.</li>
        <li>Les arnaques, spams, ou incitations à des transferts frauduleux hors plateforme.</li>
      </ul>
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border/60 pb-2">
        <span className="text-afri-gold">✓</span> 4. Contrats & Engagements de Prestation
      </h3>
      <p>
        Lorsqu'un recruteur accepte la candidature d'un artiste pour un gombo, le contrat est réputé conclu. 
        En cas de désistement injustifié de dernière minute (moins de 24h avant l'évènement sans justificatif majeur), l'utilisateur fautif s'expose à un pénalité de note artistique ou à la suspension de son compte.
      </p>
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border/60 pb-2">
        <span className="text-afri-gold">✓</span> 5. Sécurité des Paiements & Cachets
      </h3>
      <p>
        Les transactions s'effectuent par le biais de passerelles sécurisées (Wave, Orange Money) ou via le compte séquestre AFRIGOMBO. Il incombe à l'utilisateur de vérifier l'exactitude des numéros enregistrés. 
        Pendant la phase Bêta, les validations de paiements sont vérifiées par le système AFRIGOMBO pour éliminer tout risque d'escroquerie direct entre inconnus.
      </p>
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border/60 pb-2">
        <span className="text-afri-gold">✓</span> 6. Tolérance Zéro & Sanctions
      </h3>
      <p className="text-red-500 font-bold">
        AFRIGOMBO applique une politique de tolérance zéro face aux comportements frauduleux. L'usurpation d'identité d'artistes célèbres, la création de faux profil de recruteurs, le non-respect répété des engagements ou le contournement malveillant mèneront au blocage immédiat et irréversible du compte.
      </p>
    </div>

    <div className="p-4 bg-afri-bg-ter border border-afri-gold/20 rounded-2xl flex items-center justify-between gap-3">
      <div>
        <h4 className="font-black text-afri-text uppercase text-[11px]">Besoin d'assistance juridique ou technique ?</h4>
        <p className="text-[10px] text-afri-text-muted">Le Support Officiel AFRIGOMBO est disponible 24/7.</p>
      </div>
      <button
        onClick={() => supportConfig.openSupport("CGU & Assistance")}
        className="px-3 py-2 bg-afri-gold text-black rounded-xl text-[10px] font-black uppercase cursor-pointer shrink-0"
      >
        Support Officiel
      </button>
    </div>
  </div>
);

export const PrivacyContent: React.FC = () => (
  <div className="space-y-6 text-xs text-afri-text-sec leading-relaxed font-sans">
    <div className="text-center space-y-2 pb-4 border-b border-afri-border/60">
      <div className="inline-flex p-3 bg-afri-gold/10 text-afri-gold rounded-2xl">
        <Shield className="w-7 h-7" />
      </div>
      <h2 className="text-xl sm:text-2xl font-black text-afri-text uppercase tracking-tight">
        Politique de Confidentialité & Protection des Données
      </h2>
      <p className="text-[11px] text-afri-text-sec max-w-sm mx-auto font-medium">
        Engagement ferme pour la protection de la vie privée des membres de la communauté AFRIGOMBO.
      </p>
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border/60 pb-2">
        <span className="text-afri-gold">✓</span> 1. Collecte Strictement Utile
      </h3>
      <p>
        Pour permettre la recherche de contrats, la réservation d'artistes et le versement des cachets, <strong>AFRIGOMBO</strong> collecte uniquement les informations nécessaires :
      </p>
      <ul className="pl-5 space-y-1.5 list-disc text-afri-text-muted">
        <li>Informations de profil (Nom, Prénom, Nom de scène/artiste, Avatar).</li>
        <li>Coordonnées de communication (Numéro de téléphone, compte WhatsApp, Email).</li>
        <li>Commune et localisation d'activité (Cocody, Yopougon, Marcory, etc.).</li>
        <li>Compétences artistiques, spécialités d'instruments, style musical, portfolio.</li>
      </ul>
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border/60 pb-2">
        <span className="text-afri-gold">✓</span> 2. Authentification & Données Sécurisées
      </h3>
      <p>
        Nous utilisons <strong>Firebase Authentication</strong> (Google Cloud Security) pour sécuriser vos connexions. Vos mots de passe sont chiffrés et inaccessibles. 
        Vos données de profil et portefeuilles sont conservés dans un environnement cloud sécurisé <strong>Cloud Firestore</strong>.
      </p>
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border/60 pb-2">
        <span className="text-afri-gold">✓</span> 3. Protection des Coordonnées
      </h3>
      <p>
        Vos coordonnées personnelles (numéro direct, numéros Mobile Money Wave/Orange Money) restent strictement protégées et chiffrées. Elles ne sont divulguées qu'en cas de contrat mutuellement confirmé ou pour l'exécution d'un transfert autorisé par vos soins.
      </p>
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border/60 pb-2">
        <span className="text-afri-gold">✓</span> 4. Droit à l’Oubli & Suppression du Compte
      </h3>
      <p>
        Vous êtes le seul propriétaire de vos données. Vous pouvez à tout moment exécuter la suppression intégrale de votre compte et de vos médias depuis la rubrique <strong>Réglages &gt; Zone de Danger &gt; Supprimer mon compte</strong>. L'ensemble de vos données sera purgé définitivement.
      </p>
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border/60 pb-2">
        <span className="text-afri-gold">✓</span> 5. Non-Revente & Contact Support
      </h3>
      <p>
        AFRIGOMBO ne vend ni ne loue aucune donnée personnelle à des tiers. Les numéros de téléphone sont exclusivement utilisés pour les notifications de gombos et le support. 
        Le Support Officiel est joignable directement en cliquant sur <strong>Contacter le Support AFRIGOMBO</strong>.
      </p>
    </div>

    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-3">
      <div>
        <h4 className="font-black text-emerald-400 uppercase text-[11px]">Données Protégées & Chiffrées</h4>
        <p className="text-[10px] text-afri-text-muted">Conforme aux standards de sécurité Google Cloud & Firebase 2026.</p>
      </div>
      <button
        onClick={() => supportConfig.openSupport("Confidentialité des données")}
        className="px-3 py-2 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase cursor-pointer shrink-0"
      >
        Contact DPD
      </button>
    </div>
  </div>
);
