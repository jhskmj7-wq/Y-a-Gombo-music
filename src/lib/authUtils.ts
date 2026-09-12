import { auth } from "./firebase";

/**
 * Récupère de manière sécurisée et centralisée un ID Token Firebase valide.
 * @param forceRefresh - Si true (défaut pour opérations critiques/uploads), force le renouvellement auprès des serveurs Google Identity.
 * @returns Le jeton ID Token frais ou undefined si l'utilisateur n'est pas connecté.
 */
export async function getFreshIdToken(forceRefresh = true): Promise<string | undefined> {
  try {
    const user = auth?.currentUser;
    if (!user) {
      return undefined;
    }
    try {
      return await user.getIdToken(forceRefresh);
    } catch (err) {
      console.warn("[AUTH UTILS] Échec du renouvellement forcé du token, tentative avec le cache local :", err);
      return await user.getIdToken(false);
    }
  } catch (error) {
    console.warn("[AUTH UTILS] Impossible d'obtenir l'ID Token Firebase :", error);
    return undefined;
  }
}
