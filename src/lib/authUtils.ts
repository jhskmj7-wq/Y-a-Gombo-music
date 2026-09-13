import { auth } from "./firebase";

/**
 * Récupère les identifiants de session de l'utilisateur actif (Firebase Auth ou session locale)
 */
export function getActiveSessionUser(): { uid?: string; email?: string } {
  if (auth?.currentUser) {
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email || undefined
    };
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("afrigombo_user_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.uid) {
          return {
            uid: parsed.uid,
            email: parsed.email || undefined
          };
        }
      }
    } catch (_) {}
  }
  return {};
}

/**
 * Récupère de manière sécurisée et centralisée un ID Token Firebase valide.
 * Si l'instance d'auth est en cours d'initialisation, attend brièvement authStateReady.
 * @param forceRefresh - Si true, force le renouvellement auprès des serveurs Google Identity.
 * @returns Le jeton ID Token frais ou undefined si non disponible.
 */
export async function getFreshIdToken(forceRefresh = false): Promise<string | undefined> {
  try {
    if (!auth) return undefined;

    let user = auth.currentUser;
    if (!user && typeof (auth as any).authStateReady === "function") {
      try {
        await (auth as any).authStateReady();
        user = auth.currentUser;
      } catch (_) {}
    }

    if (!user) {
      user = await new Promise<any>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 1500);
        const unsub = auth.onAuthStateChanged((u) => {
          clearTimeout(timeout);
          unsub();
          resolve(u);
        });
      });
    }

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

/**
 * Appelle l'endpoint sécurisé pour obtenir une URL signée Supabase Storage pour un document KYC.
 */
export async function fetchSignedKycUrl(
  rawPath: string,
  isAdmin = false
): Promise<{ signedUrl?: string; error?: string }> {
  if (!rawPath) return { error: "Chemin de document vide" };

  // Déjà une URL directe ou signée
  if (
    (rawPath.includes("token=") && (rawPath.startsWith("http://") || rawPath.startsWith("https://"))) ||
    rawPath.startsWith("data:") ||
    rawPath.startsWith("blob:")
  ) {
    return { signedUrl: rawPath };
  }

  const session = getActiveSessionUser();
  const idToken = await getFreshIdToken(false);

  const endpoint = isAdmin ? "/api/admin/kyc/view" : "/api/user/kyc/view";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
      },
      body: JSON.stringify({
        idToken,
        clientUid: session.uid,
        clientEmail: session.email,
        storagePaths: [rawPath],
        bucket: "afrigombo-private"
      })
    });

    if (res.ok) {
      const data = await res.json();
      const signed = data?.results?.[0]?.signedUrl;
      if (signed && (signed.startsWith("http://") || signed.startsWith("https://"))) {
        return { signedUrl: signed };
      }
      return { error: data?.error || "Document non trouvé ou accès refusé" };
    } else {
      const errData = await res.json().catch(() => ({}));
      return { error: errData.error || `Erreur serveur (${res.status})` };
    }
  } catch (err: any) {
    return { error: err.message || "Erreur de connexion" };
  }
}

