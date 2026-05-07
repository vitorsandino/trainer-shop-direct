// Sistema simples de contas em localStorage (sem backend).
// Senhas são hashadas com SHA-256 (não é seguro de verdade, mas evita texto puro).

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passHash: string;
  createdAt: number;
};

const USERS_KEY = "pkmn_users_v1";
const SESSION_KEY = "pkmn_session_v1";

async function sha256(s: string) {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function getUsers(): User[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
}
function saveUsers(list: User[]) { localStorage.setItem(USERS_KEY, JSON.stringify(list)); }

const listeners = new Set<() => void>();
export function subscribeAuth(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
function emit() { listeners.forEach(cb => cb()); }

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}
export function getCurrentUser(): User | null {
  const id = getSessionUserId();
  if (!id) return null;
  return getUsers().find(u => u.id === id) ?? null;
}

export async function register(input: { name: string; email: string; phone?: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || !input.name.trim()) throw new Error("Preencha todos os campos");
  const users = getUsers();
  if (users.some(u => u.email === email)) throw new Error("Este e-mail já está cadastrado");
  const user: User = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() || undefined,
    passHash: await sha256(input.password),
    createdAt: Date.now(),
  };
  users.push(user);
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, user.id);
  emit();
  return user;
}

export async function login(email: string, password: string) {
  const e = email.trim().toLowerCase();
  const users = getUsers();
  const u = users.find(x => x.email === e);
  if (!u) throw new Error("E-mail ou senha inválidos");
  const h = await sha256(password);
  if (h !== u.passHash) throw new Error("E-mail ou senha inválidos");
  localStorage.setItem(SESSION_KEY, u.id);
  emit();
  return u;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  emit();
}

export function updateProfile(patch: Partial<Pick<User, "name" | "phone">>) {
  const u = getCurrentUser();
  if (!u) return;
  const users = getUsers().map(x => x.id === u.id ? { ...x, ...patch } : x);
  saveUsers(users);
  emit();
}
