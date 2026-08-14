export type AccessLevel = "PUBLIC" | "AUTH_REQUIRED" | "DISABLED";

/**
 * AFRIGOMBO Sovereign Access Policy - Single Source of Truth
 * 
 * PUBLIC: Consultation libre sans connexion (Accueil, Réels/Vibes, Marché public, Paramètres, Signaler)
 * AUTH_REQUIRED: Action ou espace privé nécessitant un compte (Wallet, Profil, Messagerie, Notifications, Postuler, Publier, Liker, Commenter)
 * DISABLED: Fonctionnalité désactivée ou en maintenance
 */
export const MENU_ACCESS_POLICY: Record<string, AccessLevel> = {
  // Public exploration spaces (Consultation autorisée sans compte)
  user_terrain: "PUBLIC",
  user_vibes: "PUBLIC",
  user_reels: "PUBLIC",
  user_grand_marche: "PUBLIC",
  user_academie: "PUBLIC",
  user_events: "PUBLIC",
  user_settings: "PUBLIC",
  user_opportunities: "PUBLIC",
  user_help_center: "PUBLIC",
  user_about: "PUBLIC",
  user_support: "PUBLIC",
  user_whats_new: "PUBLIC",
  nearby: "PUBLIC",

  // Personal and protected spaces (Connexion requise)
  user_publish: "AUTH_REQUIRED",
  user_mes_gombos: "AUTH_REQUIRED",
  user_heritage: "AUTH_REQUIRED",
  user_wallet: "AUTH_REQUIRED",
  user_messages: "AUTH_REQUIRED",
  user_notifications: "AUTH_REQUIRED",
  user_favorites: "AUTH_REQUIRED",
  user_contracts: "AUTH_REQUIRED",
  user_renforts: "AUTH_REQUIRED",
  user_edit_profile: "AUTH_REQUIRED",
  user_gombo_id: "AUTH_REQUIRED",
  user_comments: "AUTH_REQUIRED",
  user_downloads: "AUTH_REQUIRED",
  user_history: "AUTH_REQUIRED",
  user_gombo_plus: "AUTH_REQUIRED",
  user_subscription_management: "AUTH_REQUIRED",

  // Administration spaces (Strictement protégés)
  dashboard: "AUTH_REQUIRED",
  super_admin: "AUTH_REQUIRED",
  users: "AUTH_REQUIRED",
  posts: "AUTH_REQUIRED",
  gombos: "AUTH_REQUIRED",
  verifications: "AUTH_REQUIRED",
  admin_finances: "AUTH_REQUIRED",
  contracts: "AUTH_REQUIRED",
  reports: "AUTH_REQUIRED",
  revenue: "AUTH_REQUIRED",
  alertes: "AUTH_REQUIRED",
  security: "AUTH_REQUIRED",
};

/**
 * Returns access level for a given menu key
 */
export function getMenuAccessLevel(menuKey: string): AccessLevel {
  if (menuKey in MENU_ACCESS_POLICY) {
    return MENU_ACCESS_POLICY[menuKey];
  }
  // Any administrative or personal prefix defaults to AUTH_REQUIRED
  if (menuKey.startsWith("admin_") || menuKey.startsWith("user_mes_") || menuKey.includes("wallet") || menuKey.includes("messages")) {
    return "AUTH_REQUIRED";
  }
  return "PUBLIC";
}

/**
 * Returns whether a menu is publicly accessible without login
 */
export function isMenuPublic(menuKey: string): boolean {
  return getMenuAccessLevel(menuKey) === "PUBLIC";
}

/**
 * Returns whether a menu requires user authentication
 */
export function isMenuProtected(menuKey: string): boolean {
  return getMenuAccessLevel(menuKey) === "AUTH_REQUIRED";
}
