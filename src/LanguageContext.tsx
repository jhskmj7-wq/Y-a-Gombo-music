import React, { createContext, useContext, useState } from "react";

export type Language = "fr" | "en" | "nouchi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation & General
    settings_title: "Réglages Système",
    settings_subtitle: "Personnalisez votre expérience Y’A GOMBO MUSIC",
    mon_profil: "Mon profil",
    mon_afri_id: "Mon GOMBO ID",
    notifications: "Notifications",
    securite: "Sécurité",
    langue: "Langue",
    theme: "Thème",
    confidentialite: "Confidentialité",
    cgu: "CGU & Conditions",
    privacy_policy: "Politique de Confidentialité",
    faq: "FAQ & Aide",
    centre_aide: "Centre d'Aide",
    deconnexion: "Déconnexion",
    annuler: "Annuler",
    enregistrer: "Enregistrer",
    heritage: "Mon Héritage",
    terrain: "Navigation",
    messages: "Messages",
    commentaires: "Commentaires",
    publications: "Publications",
    theme_noir_or: "Noir & Or",
    theme_blanc_or: "Blanc & Or",
    theme_bleu_nuit: "Bleu Nuit",
    choisir_langue: "Choisir la Langue",
    langue_desc: "Sélectionnez votre langue de navigation préférée.",
    langue_fr: "Français",
    langue_en: "English",
    langue_nouchi: "Nouchi",
    recherche: "Recherche",
    publier: "Publier",
    messages_tab: "Messages",
    annuaire: "Annuaire",
    booster_tab: "Booster",
    evenement: "Événements",
    recherche_filtres: "RECHERCHE & FILTRES",
    valider_filtres: "Valider les filtres d'or ⚡",
    voir_tout: "Voir tout",
    opportunites_une: "OPPORTUNITÉS À LA UNE",
    recents: "RÉCENTS & POPULAIRES",
    monetisation_tab: "MONÉTISATION",

    // Actions Rapides
    qa_publier: "Publier",
    qa_contrats: "Contrats",
    qa_calendrier: "Calendrier",
    qa_messages: "Messages",
    qa_renfort: "Renfort Express",
    qa_renfort_short: "Renfort",
    qa_gombo_id: "Mon GOMBO ID",
    qa_gombo_id_short: "GOMBO ID",
    qa_favoris: "Favoris",
    qa_plus: "Plus",

    // Views
    view_home: "Accueil",
    view_vibes: "Vibes",
    view_wallet: "Wallet & Finances",
    view_contracts: "Contrats Gombo Safe",
    view_premium: "Afrigombo Premium",
    view_kyc: "Vérification KYC",
    view_command_center: "Centre de Commandement",
    view_throne: "Trône du Fondateur",

    // Favoris
    fav_title: "⭐ Mes Favoris & Artistes Suivis",
    fav_subtitle: "Retrouvez vos gombos enregistrés, vos artistes et vos opportunités.",
    fav_empty_gombos: "Aucun gombo sauvegardé pour le moment.",
    fav_empty_artists: "Aucun artiste suivi pour le moment.",
    fav_gombos_title: "Gombos Enregistrés",
    fav_artists_title: "Artistes & Promoteurs Favoris",
    fav_posts_title: "Publications Sauvegardées",

    // Wallet
    wallet_title: "Wallet & Portefeuille",
    wallet_balance: "Solde Disponible",
    wallet_deposit: "Recharger",
    wallet_withdraw: "Retirer",
    wallet_history: "Historique des Transactions",

    // System Buttons
    btn_confirm: "Confirmer",
    btn_close: "Fermer",
    btn_back: "Retour",
    btn_submit: "Envoyer",
    msg_success: "Opération réussie !",
    msg_error: "Une erreur est survenue.",
    notif_title: "Centre de Notifications"
  },
  en: {
    // Navigation & General
    settings_title: "System Settings",
    settings_subtitle: "Customize your Y’A GOMBO MUSIC experience",
    mon_profil: "My Profile",
    mon_afri_id: "My GOMBO ID",
    notifications: "Notifications",
    securite: "Security",
    langue: "Language",
    theme: "Theme",
    confidentialite: "Privacy",
    cgu: "Terms & Conditions",
    privacy_policy: "Privacy Policy",
    faq: "FAQ & Support",
    centre_aide: "Help Center",
    deconnexion: "Logout",
    annuler: "Cancel",
    enregistrer: "Save",
    heritage: "My Heritage",
    terrain: "Navigate",
    messages: "Messages",
    commentaires: "Comments",
    publications: "Posts",
    theme_noir_or: "Black & Gold",
    theme_blanc_or: "White & Gold",
    theme_bleu_nuit: "Midnight Blue",
    choisir_langue: "Choose Language",
    langue_desc: "Select your preferred navigation language.",
    langue_fr: "French",
    langue_en: "English",
    langue_nouchi: "Nouchi",
    recherche: "Search",
    publier: "Publish",
    messages_tab: "Messages",
    annuaire: "Directory",
    booster_tab: "Booster",
    evenement: "Events",
    recherche_filtres: "SEARCH & FILTERS",
    valider_filtres: "Apply Filters ⚡",
    voir_tout: "See all",
    opportunites_une: "SPOTLIGHT OPPORTUNITIES",
    recents: "RECENT & POPULAR",
    monetisation_tab: "MONETIZATION",

    // Actions Rapides
    qa_publier: "Publish",
    qa_contrats: "Contracts",
    qa_calendrier: "Calendar",
    qa_messages: "Messages",
    qa_renfort: "Express Support",
    qa_renfort_short: "Support",
    qa_gombo_id: "My GOMBO ID",
    qa_gombo_id_short: "GOMBO ID",
    qa_favoris: "Favorites",
    qa_plus: "More",

    // Views
    view_home: "Home",
    view_vibes: "Vibes",
    view_wallet: "Wallet & Finances",
    view_contracts: "Gombo Safe Contracts",
    view_premium: "Afrigombo Premium",
    view_kyc: "KYC Verification",
    view_command_center: "Command Center",
    view_throne: "Founder's Throne",

    // Favoris
    fav_title: "⭐ My Favorites & Followed Artists",
    fav_subtitle: "Find your saved gombos, artists, and opportunities.",
    fav_empty_gombos: "No saved gombos at the moment.",
    fav_empty_artists: "No followed artists at the moment.",
    fav_gombos_title: "Saved Gombos",
    fav_artists_title: "Favorite Artists & Promoters",
    fav_posts_title: "Saved Posts",

    // Wallet
    wallet_title: "Wallet & Finances",
    wallet_balance: "Available Balance",
    wallet_deposit: "Top Up",
    wallet_withdraw: "Withdraw",
    wallet_history: "Transaction History",

    // System Buttons
    btn_confirm: "Confirm",
    btn_close: "Close",
    btn_back: "Back",
    btn_submit: "Submit",
    msg_success: "Operation successful!",
    msg_error: "An error occurred.",
    notif_title: "Notification Center"
  },
  nouchi: {
    // Navigation & General
    settings_title: "Mes réglages",
    settings_subtitle: "Faut caler ton système Y’A GOMBO MUSIC",
    mon_profil: "Mon Profile",
    mon_afri_id: "Mon Identité",
    notifications: "Mes News",
    securite: "Protège-toi",
    langue: "Causerie",
    theme: "Ma Vue",
    confidentialite: "Mes Affaires",
    cgu: "Les Droits",
    privacy_policy: "Mes Affaires Privées",
    faq: "Demander d'aide",
    centre_aide: "Demander d'aide",
    deconnexion: "Je m'en vais",
    annuler: "Faut laisser",
    enregistrer: "C'est bon",
    heritage: "Ma Puissance",
    terrain: "Le Terrain",
    messages: "Mes Bails",
    commentaires: "On dit quoi ?",
    publications: "Mes Sons",
    theme_noir_or: "Gando & Or",
    theme_blanc_or: "Kpakpato & Or",
    theme_bleu_nuit: "Zinzin Nuit",
    choisir_langue: "Choisis ta Langue",
    langue_desc: "Faut caler comme tu veux causer ici.",
    langue_fr: "Français chic",
    langue_en: "L'Anglais",
    langue_nouchi: "Nouchi 225",
    recherche: "Chercher",
    publier: "Caper",
    messages_tab: "Bails",
    annuaire: "Kpakpato",
    booster_tab: "Charger",
    evenement: "Les Show",
    recherche_filtres: "CHERCHE TA CHOSE",
    valider_filtres: "C'est calé ⚡",
    voir_tout: "Tout déballer",
    opportunites_une: "GOMBOS CHICS",
    recents: "DERNIÈRES INFOS",
    monetisation_tab: "L'ARGENT",

    // Actions Rapides
    qa_publier: "Caper",
    qa_contrats: "Contrats",
    qa_calendrier: "Calendrier",
    qa_messages: "Bails",
    qa_renfort: "Renfort Express",
    qa_renfort_short: "Renfort",
    qa_gombo_id: "Mon Identité",
    qa_gombo_id_short: "GOMBO ID",
    qa_favoris: "Mes Favoris",
    qa_plus: "En Plus",

    // Views
    view_home: "Le Bâtiment",
    view_vibes: "La Vibe",
    view_wallet: "L'Argent & Kplo",
    view_contracts: "Bails Sécurisés",
    view_premium: "Gombo VIP",
    view_kyc: "Papiers Certifiés",
    view_command_center: "Le QG",
    view_throne: "Trône du Chef",

    // Favoris
    fav_title: "⭐ Mes Bails Favoris & Talents",
    fav_subtitle: "Retrouve tes gombos calés, tes artistes et tes kpakpatos.",
    fav_empty_gombos: "Aucun gombo calé pour l'instant.",
    fav_empty_artists: "Aucun artiste suivi pour le moment.",
    fav_gombos_title: "Gombos Sauvegardés",
    fav_artists_title: "Artistes & Cadres Favoris",
    fav_posts_title: "Vibes Sauvegardées",

    // Wallet
    wallet_title: "L'Argent & Kplo",
    wallet_balance: "Kplo Disponible",
    wallet_deposit: "Mettre l'Argent",
    wallet_withdraw: "Enlever L'Argent",
    wallet_history: "Mouvements de Sous",

    // System Buttons
    btn_confirm: "Valider",
    btn_close: "Fermer",
    btn_back: "Retourner",
    btn_submit: "Envoyer",
    msg_success: "C'est validé !",
    msg_error: "Grave erreur est arrivée.",
    notif_title: "Mes Notifications"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("gombo_language") as Language;
      if (saved === "fr" || saved === "en" || saved === "nouchi") {
        return saved;
      }
      return "fr";
    } catch (e) {
      return "fr";
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("gombo_language", lang);
    } catch (e) {
      // ignore
    }
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language] || translations["fr"];
    if (langDict && langDict[key]) return langDict[key];
    const frDict = translations["fr"];
    if (frDict && frDict[key]) return frDict[key];
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
