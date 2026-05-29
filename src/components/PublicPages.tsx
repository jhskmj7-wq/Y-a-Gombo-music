import React from "react";
import { Shield, FileText, Trash2, ArrowLeft, Mail, Flame, Lock, CheckCircle, Smartphone, AlertTriangle, MessageSquare, Info } from "lucide-react";

interface PublicPageProps {
  onBack: () => void;
  darkMode?: boolean;
}

export function PrivacyPage({ onBack }: PublicPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0516] py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] bg-white dark:bg-[#120E22]/80 border border-gray-150 dark:border-gray-800 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la scène</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-[#7C3AED] dark:text-[#A78BFA]">
            <Flame className="w-4.5 h-4.5 text-[#7C3AED] fill-current" />
            <span>GOMBO PROTÉGÉ</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-purple-100 dark:bg-purple-950/30 text-[#7C3AED] dark:text-[#A78BFA] rounded-2xl">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
            Charte de Confidentialité
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Dernière mise à jour : Mai 2026. Conforme aux règles de protection du Showbiz de Côte d'Ivoire.
          </p>
        </div>

        {/* Core content */}
        <div className="bg-white dark:bg-[#120E22] border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2 border-b border-gray-50 dark:border-gray-850 pb-2">
              <span className="text-[#7C3AED]">✓</span> 1. Collecte des données utilisateur
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Pour vous donner accès aux gombos d'Abidjan et vous mettre en relation avec les meilleurs maquis, clubs, promoteurs et festivals, <strong>Y’A GOMBO MUSIC</strong> collecte les données strictement nécessaires au bon déroulement de vos prestations scéniques :
            </p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 pl-5 space-y-1.5 list-disc">
              <li>Vos informations d'identité (Prénom, Nom, Nom de scène ou d'artiste).</li>
              <li>Vos coordonnées de communication (Téléphone direct et numéro WhatsApp).</li>
              <li>Votre localisation générale d'activité (Communes d'Abidjan e.g. Cocody, Yopougon, Marcory).</li>
              <li>Vos caractéristiques artistiques (Spécialités d'instruments, genres musicaux favoris, années d'expérience).</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2 border-b border-gray-50 dark:border-gray-850 pb-2">
              <span className="text-[#7C3AED]">✓</span> 2. Firebase Authentication
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Nous utilisons le service sécurisé de <strong>Firebase Authentication</strong> (fourni par Google Cloud) pour gérer l'accès à votre compte. 
              Vos identifiants de connexion (adresse email et mot de passe chiffré) sont gérés de manière sécurisée et confidentielle. 
              Y’A GOMBO MUSIC n'a jamais accès en clair à votre mot de passe ni à vos facteurs d'authentification tiers.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2 border-b border-gray-50 dark:border-gray-850 pb-2">
              <span className="text-[#7C3AED]">✓</span> 3. Stockage des données de profil
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Les informations relatives à votre profil showbiz, à vos portefeuilles de rémunérations accumulés et à l'historique de vos candidatures de gombos sont stockées dans une base de données cloud hautement sécurisée <strong>Cloud Firestore</strong> (Firebase).
              Vos coordonnées Mobile Money (Wave, Orange Money) restent chiffrées et ne sont divulguées à l'autre partie contractante (recruteur ou musicien) <strong>qu'uniquement après validation réciproque du contrat ou du cachet</strong>.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2 border-b border-gray-50 dark:border-gray-850 pb-2">
              <span className="text-[#7C3AED]">✓</span> 4. Sécurité renforcée des données
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Nous mettons en œuvre des mesures de sécurité optimales au niveau réseau, applicatif et physique pour garantir l'intégrité de vos informations. Les règles de sécurité strictes préviennent tout accès non autorisé à vos données d'annonceur ou de prestataire.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2 border-b border-gray-50 dark:border-gray-850 pb-2">
              <span className="text-[#7C3AED]">✓</span> 5. Suppression immédiate du compte
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Chez Y'A GOMBO MUSIC, vous êtes l'unique propriétaire de vos données de scène. Vous pouvez à tout moment demander, ou exécuter par vous-même, la suppression intégrale de vos informations de notre écosystème :
            </p>
            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/10 rounded-2xl text-xs space-y-1.5 border border-purple-100/30">
              <p className="font-bold text-[#7C3AED] dark:text-[#A78BFA]">⚙️ Procédure de suppression autonome :</p>
              <p>Rendez-vous sur votre espace <strong>Mon Coin</strong>, ouvrez les <strong>Réglages</strong> dans le panneau de contrôle, et cliquez sur <strong>Supprimer mon compte</strong> dans la section Compte. L'ensemble de vos données seront effacées immédiatement.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2 border-b border-gray-50 dark:border-gray-850 pb-2">
              <span className="text-[#7C3AED]">✓</span> 6. Contact support d'Abidjan
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Pour toute question sur la protection de votre vie privée ou pour exercer vos droits d'accès et d'opposition, vous pouvez joindre à tout moment nos experts showbiz au Plateau :
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="mailto:support@gombo.ci"
                className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-xs font-bold rounded-xl border border-gray-150 dark:border-gray-800 text-gray-700 dark:text-white transition-all"
              >
                <Mail className="w-4 h-4 text-[#7C3AED]" />
                <span>support@gombo.ci</span>
              </a>
              <a
                href="https://wa.me/2250102030405?text=Salut%20l%27equipe%20Gombo%20!%20J%27ai%20une%20question%20concerant%20mes%20donnees%20personnelles."
                target="_blank"
                rel="no-referrer"
                className="flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-xs font-bold rounded-xl border border-emerald-100/30 text-emerald-600 dark:text-emerald-400 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Parler sur WhatsApp</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export function TermsPage({ onBack }: PublicPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0516] py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] bg-white dark:bg-[#120E22]/80 border border-gray-150 dark:border-gray-800 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la scène</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-[#7C3AED] dark:text-[#A78BFA]">
            <Flame className="w-4.5 h-4.5 text-[#7C3AED] fill-current" />
            <span>TERRAIN SAIN</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-purple-100 dark:bg-purple-950/30 text-[#7C3AED] dark:text-[#A78BFA] rounded-2xl">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Règlement officiel de l'arène Y’A GOMBO MUSIC. Applicable à tous les artistes et recruteurs musicaux de Côte d’Ivoire.
          </p>
        </div>

        {/* Core content */}
        <div className="bg-white dark:bg-[#120E22] border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2 border-b border-gray-50 dark:border-gray-850 pb-2">
              <span className="text-[#7C3AED]">✓</span> 1. Conditions d'utilisation
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              En créant un compte ou en naviguant sur l'application <strong>Y’A GOMBO MUSIC</strong>, vous acceptez sans réserve le présent règlement. L'application a pour vocation exclusive de faciliter la mise en relation showbiz, la publication d'annonces de gombos musicaux (prestations), et la gestion sécurisée des cachets d'artistes.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2 border-b border-gray-50 dark:border-gray-850 pb-2">
              <span className="text-[#7C3AED]">✓</span> 2. Responsabilités des utilisateurs
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Chaque utilisateur est personnellement responsable des données qu'il publie, des messages partagés, et des engagements contractuels pris sur la plateforme. 
              Les artistes s'engagent à se présenter à l'heure aux répétitions ou aux concerts prévus. Les recruteurs contractants s'engagent à respecter l'intégrité physique de nos musiciens et à payer le solde convenu.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2 border-b border-gray-50 dark:border-gray-850 pb-2">
              <span className="text-[#7C3AED]">✓</span> 3. Contenu rigoureusement interdit
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Tout contenu sortant du cadre du showbiz et de la musique ivoirienne est strictement prohibé. Notre équipe d'animation effectue des audits réguliers. Sont formellement interdits :
            </p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 pl-5 space-y-1.5 list-disc">
              <li>Le harcèlement moral, sexuel, ou les injures envers un membre de la corporation artistique.</li>
              <li>La publication de fausses annonces de gombos ou de tarifs mensongers dans le but de tromper.</li>
              <li>Les médias à caractère pornographique, violent, politique ou haineux.</li>
              <li>La publicité ou l'incitation à des services d'arnaque de crédit mobile money.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2 border-b border-gray-50 dark:border-gray-850 pb-2">
              <span className="text-[#7C3AED]">✓</span> 4. Réservations musicales & Engagements
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Une fois qu'un recruteur accepte officiellement une candidature d'artiste pour un gombo, le contrat est réputé conclu. 
              En cas de désistement injustifié de dernière minute (moins de 24h avant le spectacle sans justificatif de force majeure), l'artiste s'expose à une baisse de sa note artistique ou à une exclusion temporaire de l'application.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2 border-b border-gray-50 dark:border-gray-850 pb-2">
              <span className="text-[#7C3AED]">✓</span> 5. Transactions de paiement de cachets
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Les transferts de fonds s'effectuent par le biais des passerelles sécurisées tierces (Wave, Orange Money). Y’A GOMBO MUSIC propose un système de solde virtuel permettant de consolider ses revenus. 
              Il vous incombe de vérifier l’exactitude de vos numéros de Mobile Money configurés dans les réglages. Nous déclinons toute responsabilité en cas de transfert vers un numéro erroné déjà validé par vos soins.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-2 border-b border-gray-50 dark:border-gray-850 pb-2">
              <span className="text-[#7C3AED]">✓</span> 6. Tolérance zéro face aux comportements abusifs
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed text-red-600 dark:text-rose-400 font-bold">
              Y’A GOMBO MUSIC applique une politique de tolérance zéro face aux comportements frauduleux, abusifs ou trompeurs. L'utilisation d'identité d'artistes célèbres usurpés, la création de faux comptes recruteurs, la diffamation publique et le non-paiement répété des artistes mèneront à une suppression immédiate et sans préavis du compte ainsi qu'au blocage de votre adresse IP à Abidjan.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export function DeleteAccountPage({ onBack }: PublicPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0516] py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] bg-white dark:bg-[#120E22]/80 border border-gray-150 dark:border-gray-800 rounded-xl transition-all cursor-pointer shadow-xs"
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
          <div className="inline-flex p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl shadow-inner">
            <Trash2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
            Suppression du compte Y’A GOMBO MUSIC
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            Vous souhaitez quitter la scène ? Voici la procédure simplifiée pour effacer définitivement vos informations.
          </p>
        </div>

        {/* Action card */}
        <div className="bg-white dark:bg-[#120E22] border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="space-y-4">
            <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block">Étapes de suppression</span>
            
            <div className="grid gap-4">
              
              {/* Etape 1 */}
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 flex items-center justify-center font-black shrink-0 text-sm">
                  1
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Aller dans Mon Coin</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Connectez-vous à votre compte et cliquez sur l'onglet <strong>Mes Plans / Mon Coin</strong> (votre profil personnel d'artiste) en bas à droite de l'écran mobile ou dans la barre latérale.
                  </p>
                </div>
              </div>

              {/* Etape 2 */}
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 flex items-center justify-center font-black shrink-0 text-sm">
                  2
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Ouvrir Réglages</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Cliquez sur le bouton <strong>Réglages</strong> (l'icône d'engrenage) à côté de vos statistiques de prestations artistiques pour afficher le sous-panneau de contrôle.
                  </p>
                </div>
              </div>

              {/* Etape 3 */}
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 flex items-center justify-center font-black shrink-0 text-sm">
                  3
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Cliquer Supprimer mon compte</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Sélectionnez l'onglet <strong>👨‍💻 Compte</strong>, puis à la section <strong>Zone de Danger ⚠️</strong>, cliquez sur le bouton rouge <strong>Supprimer mon compte</strong> et validez la confirmation.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Details */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800/80 space-y-4">
            <span className="text-xs font-black text-[#7C3AED] dark:text-[#A78BFA] uppercase tracking-widest block">Quelles données sont supprimées ?</span>
            
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Dès la confirmation de votre suppression de compte, notre gestionnaire d'écosystème exécute les opérations de purge suivantes de manière automatique et irréversible :
            </p>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/10 rounded-2xl border border-rose-100/20 flex flex-col gap-1.5">
                <Lock className="w-5 h-5 text-rose-500 shrink-0" />
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Données Firebase</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Vos identifiants d'Authentification stockés chez Google Cloud sont purgés de la base de données de sécurité.</p>
              </div>

              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/10 rounded-2xl border border-rose-100/20 flex flex-col gap-1.5">
                <User className="w-5 h-5 text-rose-500 shrink-0" />
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Votre Profil Pro</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Vos informations publiques d'artiste, vos genres musicaux, vos statuts de disponibilité et votre solde sont supprimés définitivement.</p>
              </div>

              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/10 rounded-2xl border border-rose-100/20 flex flex-col gap-1.5">
                <Smartphone className="w-5 h-5 text-rose-500 shrink-0" />
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Vos Médias & Gombos</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Tous les fichiers audios, maquettes, vidéos, photos de profil et historiques de candidatures sont balayés à jamais de nos stockages.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

const User = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
