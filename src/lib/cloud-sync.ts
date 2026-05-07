/**
 * Cloud Sync — sincronização automática entre localStorage e Supabase.
 *
 * Funciona como uma camada transparente:
 * - Ao iniciar (após login admin): baixa todas as chaves `pkmn_*` da nuvem e
 *   sobrescreve o localStorage local.
 * - Ao salvar localmente (qualquer setItem em chave `pkmn_*`): envia pro Supabase
 *   com debounce.
 * - Tabela única `app_kv` no Supabase: key (text PK) + value (jsonb) + updated_at.
 */

import { getSupabase } from "./supabase-client";

const SYNC_PREFIX = "pkmn_";
const TABLE = "app_kv";
const SYNCABLE_KEYS = new Set([
  "pkmn_users_v1",
  "pkmn_products_v2",
  "pkmn_categories_v1",
  "pkmn_collections_v1",
  "pkmn_finance_v1",
  "pkmn_analytics_v1",
  "pkmn_orders_v1",
]);
const POLL_MS = 4000;

let initialized = false;
let pulling = false;
let pushEnabled = false;
let pollingStarted = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let bridgeInstalled = false;
const pendingPushes = new Map<string, ReturnType<typeof setTimeout>>();
const PUSH_DEBOUNCE_MS = 800;

const keyListeners = new Map<string, Set<() => void>>();

function isSyncableKey(key: string) {
  return key.startsWith(SYNC_PREFIX) && SYNCABLE_KEYS.has(key);
}

function emitKeyChange(key: string) {
  keyListeners.get(key)?.forEach((cb) => cb());
  window.dispatchEvent(new CustomEvent("cloud-sync-key", { detail: { key } }));
}

function installBrowserBridge() {
  if (bridgeInstalled || typeof window === "undefined") return;
  bridgeInstalled = true;

  window.addEventListener("storage", (event) => {
    if (event.storageArea !== window.localStorage) return;
    if (!event.key) {
      SYNCABLE_KEYS.forEach((key) => emitKeyChange(key));
      return;
    }
    if (isSyncableKey(event.key)) emitKeyChange(event.key);
  });

  window.addEventListener("online", () => setStatus("idle"));
  window.addEventListener("offline", () => setStatus("offline"));
}

export function subscribeCloudKey(key: string, cb: () => void) {
  if (typeof window === "undefined") return () => {};
  installBrowserBridge();
  const listeners = keyListeners.get(key) ?? new Set<() => void>();
  listeners.add(cb);
  keyListeners.set(key, listeners);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) keyListeners.delete(key);
  };
}

function getLocalRows() {
  const rows: { key: string; value: unknown; updated_at: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !isSyncableKey(key)) continue;
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    let value: unknown;
    try { value = JSON.parse(raw); } catch { value = raw; }
    rows.push({ key, value, updated_at: new Date().toISOString() });
  }
  return rows;
}

function startBackgroundPolling() {
  if (pollingStarted || typeof window === "undefined") return;
  pollingStarted = true;
  pollTimer = setInterval(() => {
    if (document.hidden || !navigator.onLine) return;
    pullFromCloud({ background: true }).catch((e) => console.error("[cloud-sync] poll erro", e));
  }, POLL_MS);
}

/** Habilita push automático (só admin deve chamar). */
export function enablePush() { pushEnabled = true; }
export function disablePush() { pushEnabled = false; }

const statusListeners = new Set<(s: SyncStatus) => void>();
export type SyncStatus = "idle" | "pulling" | "pushing" | "error" | "offline";
let currentStatus: SyncStatus = "idle";

function setStatus(s: SyncStatus) {
  currentStatus = s;
  statusListeners.forEach(cb => cb(s));
}
export function getSyncStatus() { return currentStatus; }
export function subscribeSyncStatus(cb: (s: SyncStatus) => void) {
  statusListeners.add(cb);
  cb(currentStatus);
  return () => statusListeners.delete(cb);
}

/** Baixa todas as chaves `pkmn_*` do Supabase e grava no localStorage. */
export async function pullFromCloud(options?: { background?: boolean }): Promise<{ ok: boolean; count: number; error?: string }> {
  const supabase = await getSupabase();
  if (!supabase) {
    setStatus("offline");
    return { ok: false, count: 0, error: "Supabase não configurado" };
  }
  pulling = true;
  if (!options?.background) setStatus("pulling");
  try {
    const { data, error } = await supabase.from(TABLE).select("key,value").in("key", Array.from(SYNCABLE_KEYS));
    if (error) { setStatus("error"); return { ok: false, count: 0, error: error.message }; }
    let count = 0;
    const changedKeys = new Set<string>();
    for (const row of data ?? []) {
      try {
        const nextRaw = JSON.stringify(row.value);
        if (localStorage.getItem(row.key) === nextRaw) continue;
        localStorage.setItem(row.key, nextRaw);
        changedKeys.add(row.key);
        count++;
      } catch {}
    }
    setStatus("idle");
    changedKeys.forEach((key) => emitKeyChange(key));
    window.dispatchEvent(new Event("cloud-sync-pulled"));
    return { ok: true, count };
  } finally {
    pulling = false;
  }
}

/** Sobe uma chave individual pro Supabase. */
async function pushKey(key: string, valueRaw: string) {
  if (!isSyncableKey(key)) return;
  const supabase = await getSupabase();
  if (!supabase) return;
  let value: unknown;
  try { value = JSON.parse(valueRaw); } catch { value = valueRaw; }
  setStatus("pushing");
  const { error } = await supabase.from(TABLE).upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) { console.error("[cloud-sync] push falhou", key, error); setStatus("error"); return; }
  setStatus("idle");
}

/** Sobe TODAS as chaves `pkmn_*` do localStorage atual (usado na 1ª vez). */
export async function pushAllToCloud(): Promise<{ ok: boolean; count: number; error?: string }> {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, count: 0, error: "Supabase não configurado" };
  setStatus("pushing");
  const rows = getLocalRows();
  if (rows.length === 0) { setStatus("idle"); return { ok: true, count: 0 }; }
  const { error } = await supabase.from(TABLE).upsert(rows);
  if (error) { setStatus("error"); return { ok: false, count: 0, error: error.message }; }
  setStatus("idle");
  return { ok: true, count: rows.length };
}

/** Intercepta localStorage.setItem para fazer push automático. */
function installInterceptor() {
  if (initialized) return;
  initialized = true;
  installBrowserBridge();
  const original = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key: string, value: string) {
    original.call(this, key, value);
    if (this !== window.localStorage) return;
    if (pulling) return;
    if (!pushEnabled) return;
    if (!isSyncableKey(key)) return;
    // Debounce
    const existing = pendingPushes.get(key);
    if (existing) clearTimeout(existing);
    pendingPushes.set(key, setTimeout(() => {
      pendingPushes.delete(key);
      pushKey(key, value).catch(e => console.error("[cloud-sync] push erro", e));
    }, PUSH_DEBOUNCE_MS));
  };
}

/** Inicia o sync: instala o interceptor e faz pull inicial. Push fica ativo pra todos. */
export async function initCloudSync(): Promise<{ ok: boolean; pulled: number; error?: string }> {
  installInterceptor();
  const res = await pullFromCloud();
  if (res.ok && res.count === 0 && getLocalRows().length > 0) {
    await pushAllToCloud();
  }
  // Ativa push automático pra qualquer navegador (cadastros, pedidos, etc. sobem pra nuvem).
  enablePush();
  startBackgroundPolling();
  return { ok: res.ok, pulled: res.count, error: res.error };
}
