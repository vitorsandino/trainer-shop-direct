import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Credenciais públicas (anon key é projetada para ficar exposta no cliente,
// segurança real vem das policies RLS no Supabase).
const SUPABASE_URL = "https://wyeluvzqoyezrtbylhum.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZWx1dnpxb3llenJ0YnlsaHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMTM2ODEsImV4cCI6MjA5MzY4OTY4MX0.El84Yo5gxwvEPy4CZAmNl5q0domLpPo3p8hJiYIvIzo";

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
