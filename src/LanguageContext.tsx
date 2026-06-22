import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "fr" | "en" | "nouchi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    settings_title: "Réglages Système",
    settings_subtitle: "Personnalisez votre expérience Y’A GOMBO MUSIC",
    mon_profil: "Mon profil",
    mon_afri_id: "Mon AfriID",
    notifications: "Notifications",
    securite: "Sécurité",
    langue: "Langue",
    theme: "Thème",
    confidentialite: "Confidentialité",
    cgu: "CGU",
    centre_aide: "Centre aide",
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
    langue_nouchi: "Poutou (Nouchi)",
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
  },
  en: {
    settings_title: "System Settings",
    settings_subtitle: "Customize your Y’A GOMBO MUSIC experience",
    mon_profil: "My Profile",
    mon_afri_id: "My AfriID",
    notifications: "Notifications",
    securite: "Security",
    langue: "Language",
    theme: "Theme",
    confidentialite: "Privacy",
    cgu: "Terms",
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
    langue_nouchi: "Nouchi (Local)",
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
  },
  nouchi: {
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
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("gombo_language") as Language) || "fr";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("gombo_language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations["fr"][key] || key;
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
