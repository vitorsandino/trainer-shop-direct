import { createServerFn } from "@tanstack/react-start";

/** Entrega URL + anon key públicas do Supabase do usuário pro browser. */
export const getSupabaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env.MY_SUPABASE_URL;
  const anonKey = process.env.MY_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { url: null, anonKey: null, error: "Supabase não configurado" };
  }
  return { url, anonKey, error: null };
});
