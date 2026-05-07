import { getSupabase } from "@/lib/supabase-client";

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: number;
};

type LegacyUser = User & { passHash: string };

const LEGACY_USERS_KEY = "pkmn_users_v1";
const LEGACY_SESSION_KEY = "pkmn_session_v1";
const listeners = new Set<() => void>();

let authListenerInstalled = false;
let hydrated = false;
let currentUser: User | null = null;
let hydratePromise: Promise<User | null> | null = null;

function emit() {
  listeners.forEach((cb) => cb());
}

function normalizeUser(raw: any): User | null {
  if (!raw?.id || !raw?.email) return null;
  const name = typeof raw.user_metadata?.name === "string" && raw.user_metadata.name.trim()
    ? raw.user_metadata.name.trim()
    : String(raw.email).split("@")[0];
  const phone = typeof raw.user_metadata?.phone === "string" && raw.user_metadata.phone.trim()
    ? raw.user_metadata.phone.trim()
    : undefined;

  return {
    id: raw.id,
    name,
    email: String(raw.email).trim().toLowerCase(),
    phone,
    createdAt: raw.created_at ? new Date(raw.created_at).getTime() : Date.now(),
  };
}

async function sha256(s: string) {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getLegacyUsers(): LegacyUser[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LEGACY_USERS_KEY) || "[]"); } catch { return []; }
}

function saveLegacyUsers(list: LegacyUser[]) {
  if (typeof window === "undefined") return;
  if (list.length === 0) localStorage.removeItem(LEGACY_USERS_KEY);
  else localStorage.setItem(LEGACY_USERS_KEY, JSON.stringify(list));
}

function clearLegacySession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_SESSION_KEY);
}

function removeLegacyUser(email: string) {
  const next = getLegacyUsers().filter((user) => user.email !== email);
  saveLegacyUsers(next);
  clearLegacySession();
}

function authErrorMessage(message?: string) {
  const text = (message || "").toLowerCase();
  if (text.includes("invalid login credentials")) return "E-mail ou senha inválidos";
  if (text.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar";
  if (text.includes("user already registered")) return "Este e-mail já está cadastrado";
  if (text.includes("password should be at least")) return "A senha precisa ter pelo menos 6 caracteres";
  return message || "Não foi possível autenticar agora";
}

async function hydrateCurrentUser(force = false): Promise<User | null> {
  if (typeof window === "undefined") return null;
  if (hydratePromise && !force) return hydratePromise;

  hydratePromise = (async () => {
    const supabase = await getSupabase();
    if (!supabase) {
      hydrated = true;
      currentUser = null;
      emit();
      return null;
    }

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      currentUser = null;
    } else {
      currentUser = normalizeUser(data.user);
    }
    hydrated = true;
    if (currentUser) clearLegacySession();
    emit();
    return currentUser;
  })().finally(() => {
    hydratePromise = null;
  });

  return hydratePromise;
}

function ensureAuthListener() {
  if (typeof window === "undefined" || authListenerInstalled) return;
  authListenerInstalled = true;

  void hydrateCurrentUser();
  void getSupabase().then((supabase) => {
    if (!supabase) return;
    supabase.auth.onAuthStateChange((_event, session) => {
      currentUser = normalizeUser(session?.user ?? null);
      hydrated = true;
      if (currentUser) clearLegacySession();
      emit();
    });
  });

  window.addEventListener("focus", () => {
    void hydrateCurrentUser(true);
  });
}

async function migrateLegacyUser(email: string, password: string) {
  const legacyUser = getLegacyUsers().find((user) => user.email === email);
  if (!legacyUser) return null;
  const passHash = await sha256(password);
  if (passHash !== legacyUser.passHash) return null;

  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: legacyUser.name,
        phone: legacyUser.phone ?? "",
      },
    },
  });

  if (error) throw new Error(authErrorMessage(error.message));

  if (!data.session) {
    const loginResult = await supabase.auth.signInWithPassword({ email, password });
    if (loginResult.error) throw new Error(authErrorMessage(loginResult.error.message));
    currentUser = normalizeUser(loginResult.data.user);
  } else {
    currentUser = normalizeUser(data.user);
  }

  hydrated = true;
  removeLegacyUser(email);
  emit();
  return currentUser;
}

export function subscribeAuth(cb: () => void) {
  ensureAuthListener();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getSessionUserId(): string | null {
  ensureAuthListener();
  return currentUser?.id ?? null;
}

export function getCurrentUser(): User | null | undefined {
  ensureAuthListener();
  return hydrated ? currentUser : undefined;
}

export async function register(input: { name: string; email: string; phone?: string; password: string }) {
  ensureAuthListener();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const phone = input.phone?.trim() || undefined;

  if (!email || !input.password || !name) throw new Error("Preencha todos os campos");

  // Cria o usuário no servidor (já confirmado, sem e-mail do Supabase) e envia welcome via SMTP
  const { registerUserServer } = await import("@/lib/email.functions");
  await registerUserServer({ data: { email, password: input.password, name, phone } });

  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase não configurado");

  const loginResult = await supabase.auth.signInWithPassword({ email, password: input.password });
  if (loginResult.error) throw new Error(authErrorMessage(loginResult.error.message));
  currentUser = normalizeUser(loginResult.data.user);

  hydrated = true;
  removeLegacyUser(email);
  emit();
  return currentUser;
}

export async function login(email: string, password: string) {
  ensureAuthListener();
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
  if (error) {
    const migratedUser = await migrateLegacyUser(normalizedEmail, password);
    if (migratedUser) return migratedUser;
    throw new Error(authErrorMessage(error.message));
  }

  currentUser = normalizeUser(data.user);
  hydrated = true;
  clearLegacySession();
  emit();
  return currentUser;
}

export function logout() {
  hydrated = true;
  currentUser = null;
  clearLegacySession();
  emit();
  void getSupabase().then((supabase) => supabase?.auth.signOut());
}

export async function updateProfile(patch: Partial<Pick<User, "name" | "phone">>) {
  ensureAuthListener();
  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Sessão inválida");

  const currentMeta = userData.user.user_metadata ?? {};
  const nextName = patch.name?.trim() || currentMeta.name || currentUser?.name || "";
  const nextPhone = patch.phone?.trim() || "";

  const { data, error } = await supabase.auth.updateUser({
    data: {
      ...currentMeta,
      name: nextName,
      phone: nextPhone,
    },
  });

  if (error) throw new Error(authErrorMessage(error.message));

  currentUser = normalizeUser(data.user);
  hydrated = true;
  emit();
}
