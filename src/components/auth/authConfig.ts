export interface AuthProviderConfig {
  id: "google" | "apple" | "facebook";
  name: string;
  enabled: boolean;
  status: "active" | "coming_soon" | "disabled";
  badgeText: string;
  notice?: string;
}

export const AUTH_PROVIDERS_CONFIG: Record<"google" | "apple" | "facebook", AuthProviderConfig> = {
  google: {
    id: "google",
    name: "Google",
    enabled: true,
    status: "active",
    badgeText: "ACTIF"
  },
  apple: {
    id: "apple",
    name: "Apple",
    enabled: true,
    status: "active",
    badgeText: "ACTIF"
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    enabled: false,
    status: "coming_soon",
    badgeText: "BIENTÔT DISPONIBLE",
    notice: "Facebook sera bientôt disponible."
  }
};

export const AUTH_POPUP_DEFAULT_TEXTS = {
  title: "ACCÈS PRIVÉ",
  subtitle: "Touchez Continuer pour accéder à cette fonctionnalité",
  dismissText: "Plus tard"
};
