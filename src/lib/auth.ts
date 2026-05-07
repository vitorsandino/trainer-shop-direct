export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: number;
};

type StoredUser = User & { passHash: string };

type SessionSnapshot = { id?: string; email?: string };

const USERS_KEY = "pkmn_users_v1";
const SESSION_KEY = "pkmn_session_v1";
const listeners = new Set<() => void>();

let authListenerInstalled = false;
let hydrated = false;
let currentUser: User | null = null;

function emit() {
  listeners.forEach((cb) => cb());
}

async function sha256(s: string) {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function authErrorMessage(message?: string) {
  const text = (message || "").toLowerCase();
  if (text.includes("already") || text.includes("registered") || text.includes("exists")) return "Este e-mail já está cadastrado";
  if (text.includes("invalid") || text.includes("credentials")) return "E-mail ou senha inválidos";
  if (text.includes("least 6") || text.includes("mínimo")) return "A senha precisa ter pelo menos 6 caracteres";
  return message || "Não foi possível autenticar agora";
}

function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(list: StoredUser[]) {
  if (typeof window === "undefined") return;
  if (list.length === 0) localStorage.removeItem(USERS_KEY);
  else localStorage.setItem(USERS_KEY, JSON.stringify(list));
}

function readSessionSnapshot(): SessionSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        id: typeof parsed.id === "string" ? parsed.id : undefined,
        email: typeof parsed.email === "string" ? parsed.email.toLowerCase() : undefined,
      };
    }
  } catch {
    if (raw.includes("@")) return { email: raw.trim().toLowerCase() };
    return { id: raw.trim() };
  }

  return null;
}

function persistSession(user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, email: user.email }));
}

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

function toPublicUser(user: StoredUser): User {
  const { passHash: _passHash, ...safeUser } = user;
  return safeUser;
}

function hydrateFromStorage(): User | null {
  if (typeof window === "undefined") return null;

  const session = readSessionSnapshot();
  if (!session) {
    hydrated = true;
    currentUser = null;
    return null;
  }

  const stored = getStoredUsers();
  const match = stored.find((user) => {
    if (session.id && user.id === session.id) return true;
    if (session.email && user.email === session.email) return true;
    return false;
  });

  if (!match) {
    clearSession();
    hydrated = true;
    currentUser = null;
    return null;
  }

  currentUser = toPublicUser(match);
  hydrated = true;
  return currentUser;
}

function ensureAuthListener() {
  if (typeof window === "undefined") return;

  if (!authListenerInstalled) {
    authListenerInstalled = true;
    window.addEventListener("storage", (event) => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key && event.key !== USERS_KEY && event.key !== SESSION_KEY) return;
      hydrateFromStorage();
      emit();
    });
  }

  if (!hydrated) hydrateFromStorage();
}

function findStoredUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return getStoredUsers().find((user) => user.email === normalizedEmail) ?? null;
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
  const password = input.password;

  if (!email || !name || !password) throw new Error("Preencha todos os campos");
  if (password.length < 6) throw new Error("A senha precisa ter pelo menos 6 caracteres");
  if (findStoredUserByEmail(email)) throw new Error("Este e-mail já está cadastrado");

  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email,
    phone,
    createdAt: Date.now(),
    passHash: await sha256(password),
  };

  saveStoredUsers([newUser, ...getStoredUsers()]);
  currentUser = toPublicUser(newUser);
  hydrated = true;
  persistSession(currentUser);
  emit();

  // Welcome email é enviado pela camada de UI (login.tsx) para surfacing de erros.

  return currentUser;
}

export async function login(email: string, password: string) {
  ensureAuthListener();

  const normalizedEmail = email.trim().toLowerCase();
  const storedUser = findStoredUserByEmail(normalizedEmail);
  if (!storedUser) throw new Error("E-mail ou senha inválidos");

  const passHash = await sha256(password);
  if (passHash !== storedUser.passHash) throw new Error("E-mail ou senha inválidos");

  currentUser = toPublicUser(storedUser);
  hydrated = true;
  persistSession(currentUser);
  emit();
  return currentUser;
}

export function logout() {
  hydrated = true;
  currentUser = null;
  clearSession();
  emit();
}

export async function updateProfile(patch: Partial<Pick<User, "name" | "phone">>) {
  ensureAuthListener();
  if (!currentUser) throw new Error("Sessão inválida");

  const nextName = patch.name?.trim() || currentUser.name;
  const nextPhone = patch.phone?.trim() || undefined;
  let updatedUser: StoredUser | null = null;

  const nextUsers = getStoredUsers().map((user) => {
    if (user.id !== currentUser?.id) return user;
    updatedUser = {
      ...user,
      name: nextName,
      phone: nextPhone,
    };
    return updatedUser;
  });

  if (!updatedUser) throw new Error("Usuário não encontrado");

  saveStoredUsers(nextUsers);
  currentUser = toPublicUser(updatedUser);
  hydrated = true;
  persistSession(currentUser);
  emit();
  return currentUser;
}

export async function resetPasswordByEmail(email: string, newPassword: string) {
  ensureAuthListener();

  const normalizedEmail = email.trim().toLowerCase();
  if (newPassword.trim().length < 6) throw new Error("A senha precisa ter pelo menos 6 caracteres");

  const users = getStoredUsers();
  if (!users.some((user) => user.email === normalizedEmail)) {
    throw new Error("Não encontramos uma conta salva neste navegador para esse e-mail");
  }

  const nextHash = await sha256(newPassword);
  let updatedCurrent: StoredUser | null = null;
  const nextUsers = users.map((user) => {
    if (user.email !== normalizedEmail) return user;
    const updated = { ...user, passHash: nextHash };
    if (currentUser?.id === updated.id) updatedCurrent = updated;
    return updated;
  });

  saveStoredUsers(nextUsers);

  if (updatedCurrent) {
    currentUser = toPublicUser(updatedCurrent);
    persistSession(currentUser);
    emit();
  }

  return { ok: true };
}

export { authErrorMessage };
