/**
 * AFRIGOMBO ELITE - AUTHENTICATION INTENT PERSISTENCE ENGINE
 * 
 * Permet de mémoriser et reprendre automatiquement l'action et le contexte
 * cible (ex: contacter Koffi, proposer un cachet, ouvrir un message) lorsqu'un
 * utilisateur non connecté tente une action protégée et se connecte ensuite.
 *
 * Strictement conforme : aucune donnée sensible (mot de passe, token, etc.) n'est stockée.
 */

export type AuthIntentAction =
  | "propose_cachet"
  | "contact_talent"
  | "propose_alliance"
  | "direct_message"
  | "toggle_follow"
  | "toggle_save"
  | "custom_action";

export interface PendingAuthTalent {
  uid: string;
  firstName?: string;
  lastName?: string;
  artistName?: string;
  avatarUrl?: string;
  photoURL?: string;
  role?: string;
  commune?: string;
  specialty?: string;
}

export interface PendingAuthIntent {
  action: AuthIntentAction;
  targetUserId?: string;
  targetTalent?: PendingAuthTalent;
  customMessage?: string;
  isAlliance?: boolean;
  metadata?: Record<string, any>;
  timestamp: number;
}

const AUTH_INTENT_STORAGE_KEY = "afrigombo_pending_auth_intent";
const INTENT_TTL_MS = 30 * 60 * 1000; // 30 minutes de validité max

/**
 * Sauvegarde une intention en attente de connexion dans sessionStorage
 */
export function savePendingAuthIntent(intent: Omit<PendingAuthIntent, "timestamp"> & { timestamp?: number }): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PendingAuthIntent = {
      ...intent,
      timestamp: intent.timestamp || Date.now()
    };
    sessionStorage.setItem(AUTH_INTENT_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("afrigombo_auth_intent_changed", { detail: payload }));
  } catch (err) {
    console.warn("⚠️ [AuthIntent] Erreur lors de la sauvegarde de l'intention:", err);
  }
}

/**
 * Récupère l'intention actuellement en attente (si non expirée)
 */
export function getPendingAuthIntent(): PendingAuthIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_INTENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: PendingAuthIntent = JSON.parse(raw);
    if (!parsed || !parsed.action) return null;

    // Vérification de la péremption (30 minutes)
    if (Date.now() - (parsed.timestamp || 0) > INTENT_TTL_MS) {
      clearPendingAuthIntent();
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn("⚠️ [AuthIntent] Erreur de lecture de l'intention:", err);
    return null;
  }
}

/**
 * Efface l'intention en attente une fois qu'elle a été reprise avec succès
 */
export function clearPendingAuthIntent(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTH_INTENT_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("afrigombo_auth_intent_changed", { detail: null }));
  } catch (err) {
    // Ignore storage clear errors
  }
}
