import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/server/supabase-config.functions";

let clientPromise: Promise<SupabaseClient | null> | null = null;

export function getSupabase(): Promise<SupabaseClient | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    try {
      const cfg = await getSupabaseConfig();
      if (!cfg.url || !cfg.anonKey) {
        console.warn("[supabase] não configurado:", cfg.error);
        return null;
      }
      return createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage },
      });
    } catch (e) {
      console.error("[supabase] erro ao inicializar:", e);
      return null;
    }
  })();
  return clientPromise;
}
