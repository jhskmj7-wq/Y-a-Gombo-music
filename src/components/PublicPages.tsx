import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Shield, FileText, Trash2, ArrowLeft, Mail, Flame, Lock, CheckCircle, 
  Smartphone, AlertTriangle, MessageSquare, Info, Star, HelpCircle, 
  Send, Loader2, BookOpen, Heart, DollarSign, Globe, MapPin, Sparkles, Users, Award
} from "lucide-react";
import { gomboDB } from "../firebase";
import { UserProfile } from "../types";
import { supportConfig } from "../supportConfig";

interface PublicPageProps {
  onBack: () => void;
  darkMode?: boolean;
}

export function PrivacyPage({ onBack }: PublicPageProps) {
  return (
    <div className="min-h-screen bg-afri-bg text-afri-text py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pb-6 border-b border-afri-border">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-afri-text-sec hover:text-[#D4AF37] bg-afri-bg-sec border border-afri-border rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la scène</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-[#D4AF37]">
            <Flame className="w-4.5 h-4.5 text-[#D4AF37] fill-current" />
            <span>GOMBO PROTÉGÉ</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-afri-bg-sec/10 text-[#D4AF37] rounded-2xl">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-afri-text tracking-tight uppercase">
            Charte de Confidentialité
          </h1>
          <p className="text-xs text-afri-text-sec max-w-md mx-auto">
            Dernière mise à jour : Mai 2026. Conforme aux règles de protection du Showbiz de Côte d'Ivoire.
          </p>
        </div>

        {/* Core content */}
        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 1. Collecte des données utilisateur
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Pour vous donner accès aux gombos d'Abidjan et vous mettre en relation avec les meilleurs maquis, clubs, promoteurs et festivals, <strong>Y’A GOMBO MUSIC</strong> collecte les données strictement nécessaires au bon déroulement de vos prestations scéniques :
            </p>
            <ul className="text-xs text-afri-text-muted pl-5 space-y-1.5 list-disc">
              <li>Vos informations d'identité (Prénom, Nom, Nom de scène ou d'artiste).</li>
              <li>Vos coordonnées de communication (Téléphone direct et numéro WhatsApp).</li>
              <li>Votre localisation générale d'activité (Communes d'Abidjan e.g. Cocody, Yopougon, Marcory).</li>
              <li>Vos caractéristiques artistiques (Spécialités d'instruments, genres musicaux favoris, années d'expérience).</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 2. Firebase Authentication
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Nous utilisons le service sécurisé de <strong>Firebase Authentication</strong> (fourni par Google Cloud) pour gérer l'accès à votre compte. 
              Vos identifiants de connexion (adresse email et mot de passe chiffré) sont gérés de manière sécurisée et confidentielle. 
              Y’A GOMBO MUSIC n'a jamais accès en clair à votre mot de passe ni à vos facteurs d'authentification tiers.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 3. Stockage des données de profil
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Les informations relatives à votre profil showbiz, à vos portefeuilles de rémunérations accumulés et à l'historique de vos candidatures de gombos sont stockées dans une base de données cloud hautement sécurisée <strong>Cloud Firestore</strong> (Firebase).
              Vos coordonnées Mobile Money (Wave, Orange Money) restent chiffrées et ne sont divulguées à l'autre partie contractante (recruteur ou musicien) <strong>qu'uniquement après validation réciproque du contrat ou du cachet</strong>.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 4. Sécurité renforcée des données
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Nous mettons en œuvre des mesures de sécurité optimales au niveau réseau, applicatif et physique pour garantir l'intégrité de vos informations. Les règles de sécurité strictes préviennent tout accès non autorisé à vos données d'annonceur ou de prestataire.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 5. Suppression immédiate du compte
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Chez Y'A GOMBO MUSIC, vous êtes l'unique propriétaire de vos données de scène. Vous pouvez à tout moment demander, ou exécuter par vous-même, la suppression intégrale de vos informations de notre écosystème :
            </p>
            <div className="p-4 bg-afri-bg-sec/5 rounded-2xl text-xs space-y-1.5 border border-[#D4AF37]/20">
              <p className="font-bold text-[#D4AF37]">⚙️ Procédure de suppression autonome :</p>
              <p className="text-afri-text-sec">Rendez-vous sur votre espace <strong>Mon Coin</strong>, ouvrez les <strong>Réglages</strong> dans le panneau de contrôle, et cliquez sur <strong>Supprimer mon compte</strong> dans la section Compte. L'ensemble de vos données seront effacées immédiatement.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 6. Contact support d'Abidjan
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Pour toute question sur la protection de votre vie privée ou pour exercer vos droits d'accès et d'opposition, vous pouvez joindre à tout moment nos experts showbiz au Plateau :
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => supportConfig.openSupport("Confidentialité / Protection des données")}
                className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold rounded-xl border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                <span>Contacter le Support Officiel ({supportConfig.phoneNumber})</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 7. Assistance & Protection
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              AFRIGOMBO met à votre disposition un Support Officiel accessible via le Centre d'Aide. 
              Les utilisateurs peuvent contacter librement le Support Officiel AFRIGOMBO. 
              En revanche, les échanges privés de numéros, WhatsApp, emails, liens, QR Codes ou réseaux sociaux entre utilisateurs sont strictly interdits lorsqu'ils visent à contourner la plateforme et ses sécurités de paiement.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 8. Confidentialité & Coordonnées
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Les coordonnées personnelles (téléphone, email) sont utilisées uniquement pour le fonctionnement sécurisé de la plateforme. Elles ne sont jamais rendues publiques sans consentement explicite. Le numéro WhatsApp du Support Officiel est disponible dans le Centre d'Aide afin d'assister les utilisateurs.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export function TermsPage({ onBack }: PublicPageProps) {
  return (
    <div className="min-h-screen bg-afri-bg text-afri-text py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pb-6 border-b border-afri-border">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-afri-text-sec hover:text-[#D4AF37] bg-afri-bg-sec border border-afri-border rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la scène</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-[#D4AF37]">
            <Flame className="w-4.5 h-4.5 text-[#D4AF37] fill-current" />
            <span>TERRAIN SAIN</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-afri-bg-sec/10 text-[#D4AF37] rounded-2xl">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-afri-text tracking-tight uppercase">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-xs text-afri-text-sec max-w-sm mx-auto">
            Règlement officiel de l'arène Y’A GOMBO MUSIC. Applicable à tous les artistes et recruteurs musicaux de Côte d’Ivoire.
          </p>
        </div>

        {/* Core content */}
        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 1. Conditions d'utilisation
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              En créant un compte ou en naviguant sur l'application <strong>Y’A GOMBO MUSIC</strong>, vous acceptez sans réserve le présent règlement. L'application a pour vocation exclusive de faciliter la mise en relation showbiz, la publication d'annonces de gombos musicaux (prestations), et la gestion sécurisée des cachets d'artistes.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 2. Responsabilités des utilisateurs
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Chaque utilisateur est personnellement responsable des données qu'il publie, des messages partagés, et des engagements contractuels pris sur la plateforme. 
              Les artistes s'engagent à se présenter à l'heure aux répétitions ou aux concerts prévus. Les recruteurs contractants s'engagent à respecter l'intégrité physique de nos musiciens et à payer le solde convenu.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 3. Contenu rigoureusement interdit
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Tout contenu sortant du cadre du showbiz et de la musique ivoirienne est strictement prohibé. Notre équipe d'animation effectue des audits réguliers. Sont formellement interdits :
            </p>
            <ul className="text-xs text-afri-text-muted pl-5 space-y-1.5 list-disc">
              <li>Le harcèlement moral, sexuel, ou les injures envers un membre de la corporation artistique.</li>
              <li>La publication de fausses annonces de gombos ou de tarifs mensongers dans le but de tromper.</li>
              <li>Les médias à caractère pornographique, violent, politique ou haineux.</li>
              <li>La publicité ou l'incitation à des services d'arnaque de crédit mobile money.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 4. Réservations musicales & Engagements
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Une fois qu'un recruteur accepte officiellement une candidature d'artiste pour un gombo, le contrat est réputé conclu. 
              En cas de désistement injustifié de dernière minute (moins de 24h avant le spectacle sans justificatif de force majeure), l'artiste s'expose à une baisse de sa note artistique ou à une exclusion temporaire de l'application.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 5. Transactions de paiement de cachets
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Les transferts de fonds s'effectuent par le biais des passerelles sécurisées tierces (Wave, Orange Money). Y’A GOMBO MUSIC propose un système de solde virtuel permettant de consolider ses revenus. 
              Il vous incombe de vérifier l’exactitude de vos numéros de Mobile Money configurés dans les réglages. Nous déclinons toute responsabilité en cas de transfert vers un numéro erroné déjà validé par vos soins.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 6. Tolérance zéro face aux comportements abusifs
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed text-red-600 dark:text-rose-400 font-bold">
              Y’A GOMBO MUSIC applique une politique de tolérance zéro face aux comportements frauduleux, abusifs ou trompeurs. L'utilisation d'identité d'artistes célèbres usurpés, la création de faux comptes recruteurs, la diffamation publique et le non-paiement répété des artistes mèneront à une suppression immédiate et sans préavis du compte ainsi qu'au blocage de votre adresse IP à Abidjan.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> 7. Mode Bêta Manuelle
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Pendant la phase Bêta, les paiements sont validés manuellement par AFRIGOMBO. L'utilisateur ne verra jamais de numéro personnel. L'affichage sera exclusivement "Paiement AFRIGOMBO" ou "Paiement en cours de vérification". Les fonctionnalités sont déployées progressivement.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export function DeleteAccountPage({ onBack }: PublicPageProps) {
  return (
    <div className="min-h-screen bg-afri-bg text-afri-text py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pb-6 border-b border-afri-border">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-afri-text-sec hover:text-[#D4AF37] bg-afri-bg-sec border border-afri-border rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quitter</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-rose-500">
            <AlertTriangle className="w-4.5 h-4.5" />
            <span>SÉCURITÉ</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-rose-500/10 text-rose-500 rounded-2xl shadow-inner">
            <Trash2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-afri-text tracking-tight uppercase">
            Suppression du compte Y’A GOMBO MUSIC
          </h1>
          <p className="text-xs text-afri-text-sec max-w-sm mx-auto leading-relaxed">
            Vous souhaitez quitter la scène ? Voici la procédure simplifiée pour effacer définitivement vos informations.
          </p>
        </div>

        {/* Action card */}
        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="space-y-4">
            <span className="text-xs font-black text-[#D4AF37] uppercase tracking-widest block">Étapes de suppression</span>
            
            <div className="grid gap-4">
              
              {/* Etape 1 */}
              <div className="flex gap-4 p-4 bg-afri-bg-ter rounded-2xl border border-afri-border">
                <div className="w-8 h-8 rounded-full bg-afri-bg-sec/10 text-[#D4AF37] flex items-center justify-center font-black shrink-0 text-sm">
                  1
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-afri-text uppercase tracking-wider">Aller dans Mon Coin</h3>
                  <p className="text-xs text-afri-text-sec leading-relaxed">
                    Connectez-vous à votre compte et cliquez sur l'onglet <strong>Mes Plans / Mon Coin</strong> (votre profil personnel d'artiste) en bas à droite de l'écran mobile ou dans la barre latérale.
                  </p>
                </div>
              </div>

              {/* Etape 2 */}
              <div className="flex gap-4 p-4 bg-afri-bg-ter rounded-2xl border border-afri-border">
                <div className="w-8 h-8 rounded-full bg-afri-bg-sec/10 text-[#D4AF37] flex items-center justify-center font-black shrink-0 text-sm">
                  2
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-afri-text uppercase tracking-wider">Ouvrir Réglages</h3>
                  <p className="text-xs text-afri-text-sec leading-relaxed">
                    Cliquez sur le bouton <strong>Réglages</strong> (l'icône d'engrenage) à côté de vos statistiques de prestations artistiques pour afficher le sous-panneau de contrôle.
                  </p>
                </div>
              </div>

              {/* Etape 3 */}
              <div className="flex gap-4 p-4 bg-afri-bg-ter rounded-2xl border border-afri-border">
                <div className="w-8 h-8 rounded-full bg-afri-bg-sec/10 text-[#D4AF37] flex items-center justify-center font-black shrink-0 text-sm">
                  3
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-afri-text uppercase tracking-wider">Cliquer Supprimer mon compte</h3>
                  <p className="text-xs text-afri-text-sec leading-relaxed">
                    Sélectionnez l'onglet <strong>👨‍💻 Compte</strong>, puis à la section <strong>Zone de Danger ⚠️</strong>, cliquez sur le bouton rouge <strong>Supprimer mon compte</strong> et validez la confirmation.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Details */}
          <div className="pt-4 border-t border-afri-border space-y-4">
            <span className="text-xs font-black text-[#D4AF37] uppercase tracking-widest block">Quelles données sont supprimées ?</span>
            
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Dès la confirmation de votre suppression de compte, notre gestionnaire d'écosystème exécute les opérations de purge suivantes de manière automatique et irréversible :
            </p>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex flex-col gap-1.5">
                <Lock className="w-5 h-5 text-rose-500 shrink-0" />
                <h4 className="text-xs font-bold text-afri-text">Données Firebase</h4>
                <p className="text-[10px] text-afri-text-sec">Vos identifiants d'Authentification stockés chez Google Cloud sont purgés de la base de données de sécurité.</p>
              </div>

              <div className="p-3.5 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex flex-col gap-1.5">
                <User className="w-5 h-5 text-rose-500 shrink-0" />
                <h4 className="text-xs font-bold text-afri-text">Votre Profil Pro</h4>
                <p className="text-[10px] text-afri-text-sec">Vos informations publiques d'artiste, vos genres musicaux, vos statuts de disponibilité et votre solde sont supprimés définitivement.</p>
              </div>

              <div className="p-3.5 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex flex-col gap-1.5">
                <Smartphone className="w-5 h-5 text-rose-500 shrink-0" />
                <h4 className="text-xs font-bold text-afri-text">Vos Médias & Gombos</h4>
                <p className="text-[10px] text-afri-text-sec">Tous les fichiers audios, maquettes, vidéos, photos de profil et historiques de candidatures sont balayés à jamais de nos stockages.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export function AboutPage({ onBack }: PublicPageProps) {
  return (
    <div className="min-h-screen bg-afri-bg text-afri-text py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div className="flex items-center justify-between pb-6 border-b border-afri-border">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-afri-text-sec hover:text-[#D4AF37] bg-afri-bg-sec border border-afri-border rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-[#D4AF37]">
            <Flame className="w-4.5 h-4.5 text-[#D4AF37] fill-current" />
            <span>AFRIGOMBO • Y’A GOMBO MUSIC</span>
          </div>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-afri-bg-sec/15 text-[#D4AF37] rounded-2xl animate-bounce">
            <Info className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-afri-text tracking-tight uppercase">
            À Propos de Nous
          </h1>
          <p className="text-xs text-afri-text-sec max-w-md mx-auto">
            La révolution numérique d'AFRIGOMBO : opportunités certifiées et cachets sécurisés du showbiz.
          </p>
        </div>

        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase border-b border-afri-border pb-2 flex items-center gap-2">
              <span className="text-[#D4AF37]">🇨🇮</span> Notre Mission
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              <strong>AFRIGOMBO</strong>, propulsé par la solution <strong>Y'A GOMBO MUSIC</strong>, a été conçu par et pour les artistes. Notre but ultime est de professionnaliser la recherche, la planification et le paiement certifié des contrats musicaux et gombos scéniques à Abidjan et partout en Afrique de l'Ouest.
            </p>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Fini les fausses promesses, les intermédiaires gourmands ou les cachets non payés après des heures de show live intense. Nous offrons une plateforme transparente de mise en relation directe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-afri-bg-sec/5 rounded-2xl border border-[#D4AF37]/10 space-y-2">
              <span className="text-lg">⚡</span>
              <h3 className="text-xs font-black uppercase text-afri-text">Confiance Mutuelle</h3>
              <p className="text-[11px] text-afri-text-sec leading-relaxed">Des profils de prestataires vérifiés, des avis sincères, et un annuaire transparent pour rassurer le showbiz.</p>
            </div>
            <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10 space-y-2">
              <span className="text-lg">💰</span>
              <h3 className="text-xs font-black uppercase text-afri-text">Paiement Garanti</h3>
              <p className="text-[11px] text-afri-text-sec leading-relaxed">Les fonds sont bloqués de manière sécurisée et débloqués instantanément dès que l'artiste monte sur scène.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-afri-border space-y-3">
            <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider">L'Équipe Fondatrice</h3>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Basée à Cocody, notre équipe rassemble des développeurs ivoiriens passionnés de musique et des promoteurs d'événements de confiance, résolus à digitaliser la culture ivoirienne de façon vertueuse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SupportPage({ onBack }: PublicPageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Gombos & Annuaire");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Sync current profile if logged in
    const stored = localStorage.getItem("gombo_current_user_profile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !subject.trim()) {
      alert("Veuillez remplir le sujet et votre message.");
      return;
    }

    setLoading(true);
    try {
      await gomboDB.publishSupportMessage({
        userId: profile?.uid || "visiteur_anonyme",
        email: profile?.email || "contacts@yagombo.com",
        subject,
        message,
        category
      });
      setSuccess(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi de votre requête de support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-afri-bg text-afri-text py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div className="flex items-center justify-between pb-6 border-b border-afri-border">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-afri-text-sec hover:text-[#D4AF37] bg-afri-bg-sec border border-afri-border rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-[#D4AF37]">
            <Flame className="w-4.5 h-4.5 text-[#D4AF37] fill-current" />
            <span>SUPPORT EN DIRECT</span>
          </div>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-afri-bg-sec/10 text-[#D4AF37] rounded-2xl">
            <HelpCircle className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-afri-text tracking-tight uppercase">
            Centre d'Assistance 📞
          </h1>
          <p className="text-xs text-afri-text-sec max-w-md mx-auto">
            Des animateurs et conseillers disponibles 24h/7 pour régler vos soucis d'installation, paiement ou contrat d'artiste.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-afri-bg-sec border border-afri-border rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase text-afri-text tracking-wider">Canal de Support Officiel</h3>
            
            <div className="space-y-4 text-xs font-semibold">
              <div className="flex items-start gap-2 pt-1">
                <span className="text-emerald-550 font-bold shrink-0">🟢 WhatsApp :</span>
                <div>
                  <button 
                    onClick={() => supportConfig.openSupport("Centre d'Assistance")}
                    className="text-[#D4AF37] hover:underline block font-bold text-left cursor-pointer text-afri-gold"
                  >
                    {supportConfig.phoneNumber}
                  </button>
                  <span className="text-[10px] text-afri-text-muted font-medium">Support direct 24h/7</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-afri-bg-sec border border-afri-border rounded-3xl p-6 sm:p-8 shadow-sm">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-4"
              >
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <h3 className="text-sm font-black uppercase text-afri-text">Message Envoyé !</h3>
                <p className="text-xs text-afri-text-sec max-w-xs mx-auto leading-relaxed">Votre requête de support a été enregistrée avec succès. Notre équipe à Cocody vous répondra dans un délai de 2 heures maximum.</p>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="px-4 py-2 bg-afri-bg-sec/10 text-[#D4AF37] text-xs font-bold rounded-xl"
                >
                  Envoyer un autre message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xs font-black uppercase text-afri-text mb-2 tracking-wider">Écrire au Support</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-afri-text-sec mb-1.5 uppercase">Catégorie de Demande</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs font-bold text-afri-text"
                  >
                    <option value="Gombos & Annuaire">💼 Gombos & Annuaire</option>
                    <option value="Paiements & Wave / OM">💰 Paiements & Retrait Wave/OM</option>
                    <option value="Bug / Dysfonctionnement">🐛 Bug Technique</option>
                    <option value="Mon Compte / Certification">👤 Compte & Certification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-afri-text-sec mb-1.5 uppercase">Sujet de la Demande</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Problème d'affichage de mon avatar"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs font-bold text-afri-text"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-afri-text-sec mb-1.5 uppercase">Description détaillée</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Saisissez votre problème ici..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs font-bold text-afri-text"
                  />
                  {profile && (
                    <span className="text-[10px] text-afri-text-muted mt-1 block">Votre email associé : {profile.email}</span>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#B48F17] hover:from-[#B48F17] hover:to-[#9A7A13] text-afri-text font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-afri-text" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-afri-text" />
                        <span>Envoyer le Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CachetsPage({ onBack }: PublicPageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("gombo_current_user_profile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  return (
    <div className="min-h-screen bg-afri-bg text-afri-text py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div className="flex items-center justify-between pb-6 border-b border-afri-border">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-afri-text-sec hover:text-[#D4AF37] bg-afri-bg-sec border border-afri-border rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-[#D4AF37]">
            <Flame className="w-4.5 h-4.5 text-[#D4AF37] fill-current" />
            <span>TRANSPARENCE DES CACHETS</span>
          </div>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-afri-bg-sec/10 text-[#D4AF37] rounded-2xl">
            <DollarSign className="w-8 h-8 animate-pulse text-emerald-550" />
          </div>
          <h1 className="text-3xl font-black text-afri-text tracking-tight uppercase">
            Gestion des Cachets 💰
          </h1>
          <p className="text-xs text-afri-text-sec max-w-sm mx-auto">
            Garantissez votre rémunération à 100%. Finies les pertes d'argent après les mariages ou les maquis.
          </p>
        </div>

        {/* Balance Showcase */}
        {profile && (
          <div className="p-6 bg-afri-bg-sec rounded-3xl border border-afri-border text-afri-text flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-afri-text-sec uppercase tracking-widest block">Votre solde de cachets actif</span>
              <span className="text-2xl font-black font-mono text-afri-gold">{(profile.balance || 0).toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="space-y-1.5 text-center sm:text-right">
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 bg-afri-bg-sec/25 text-afri-gold border border-afri-border rounded-full inline-block">Réseau d'épargne d'urgence</span>
              <p className="text-[10px] text-afri-text-muted">Retraits disponibles 24h/24 via Wave ou Orange Money.</p>
            </div>
          </div>
        )}

        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> Fonctionnement de l'Escrow de Y'A GOMBO MUSIC
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Pour assurer l'honnêteté de toutes les parties, Y'A GOMBO MUSIC utilise un système exclusif de tiers-confiance de cachets :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-4 bg-afri-bg-ter border border-afri-border rounded-2xl space-y-2">
                <span className="text-lg text-afri-gold font-bold">1</span>
                <h4 className="text-xs font-black uppercase text-afri-text">Le Client verse le cachet</h4>
                <p className="text-[11px] text-afri-text-sec leading-relaxed">Dès qu'un musicien est réservé pour un gombo, le client dépose la somme convenue sur la plateforme.</p>
              </div>

              <div className="p-4 bg-afri-bg-ter border border-afri-border rounded-2xl space-y-2">
                <span className="text-lg text-afri-gold font-bold">2</span>
                <h4 className="text-xs font-black uppercase text-afri-text">Fonds sécurisés</h4>
                <p className="text-[11px] text-afri-text-sec leading-relaxed">L'argent reste bloqué en lieu sûr. Le musicien joue en toute sérénité, sachant le cachet déjà disponible.</p>
              </div>

              <div className="p-4 bg-afri-bg-ter border border-afri-border rounded-2xl space-y-2">
                <span className="text-lg text-afri-gold font-bold">3</span>
                <h4 className="text-xs font-black uppercase text-afri-text">Déblocage instantané</h4>
                <p className="text-[11px] text-afri-text-sec leading-relaxed">Dès le concert terminé, le client valide, et les fonds sont versés directement au portefeuille de l'artiste.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-afri-border">
            <h3 className="text-xs font-black uppercase text-emerald-500 tracking-wider mb-2">Commissions de service : 0%</h3>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Y'A GOMBO MUSIC est un projet culturel d'Abidjan : nous ne prenons aucune commission sur les prestations artistiques directes en 2026. L'intégralité du cachet négocié va dans la poche des musiciens de scène.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const User = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

