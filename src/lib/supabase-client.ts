import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Credenciais públicas (anon key é projetada para ficar exposta no cliente,
// segurança real vem das policies RLS no Supabase).
const SUPABASE_URL = "https://wyeluvzqoyezrtbylhum.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhd2VsdXZ6cW95ZXpydGJ5bGh1bSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.PLACEHOLDER";

let client: SupabaseClient | null = null;

export function getSupabase(): Promise<SupabaseClient | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (client) return Promise.resolve(client);
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: window.localStorage,
      },
    });
    return Promise.resolve(client);
  } catch (e) {
    console.error("[supabase] erro ao inicializar:", e);
    return Promise.resolve(null);
  }
}
