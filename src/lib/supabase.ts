import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton Supabase Client pour AfriGombo (Stockage Supabase Storage)
 * 
 * SÉCURITÉ :
 * - Uniquement la clé PUBLIQUE (anon / publishable key) est autorisée côté navigateur.
 * - Ne JAMAIS utiliser de SUPABASE_SECRET_KEY, sb_secret_... ou service_role dans le frontend.
 */

export const DEFAULT_SUPABASE_URL = "https://qefnkgtstcisplbrjcxy.supabase.co";

const supabaseUrl: string = (
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
).trim();

const supabaseKey: string = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ""
).trim();

export const SUPABASE_BUCKET_NAME: string = (
  import.meta.env.VITE_SUPABASE_BUCKET || "afrigombo-médias"
).trim();

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === "string" &&
    supabaseUrl.length > 0 &&
    typeof supabaseKey === "string" &&
    supabaseKey.length > 0 &&
    !supabaseKey.includes("your-publishable-key")
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    try {
      clientInstance = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error("[SUPABASE] Erreur initialisation client :", err);
      return null;
    }
  }
  return clientInstance;
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
