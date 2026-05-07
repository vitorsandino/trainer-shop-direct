import { createServerFn } from "@tanstack/react-start";

/** Entrega URL + anon key públicas do Supabase do usuário pro browser. */
export const getSupabaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  const url =
    process.env.MY_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    null;
  const anonKey =
    process.env.MY_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    null;
  if (!url || !anonKey) {
    return { url: null, anonKey: null, error: "Supabase não configurado" };
  }
  return { url, anonKey, error: null };
});
