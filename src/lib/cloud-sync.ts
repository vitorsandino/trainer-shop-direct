/**
 * Cloud Sync v3 — nuvem é a fonte da verdade.
 *
 * - Na inicialização: baixa TUDO do Supabase e grava no localStorage (cache).
 * - Em cada write local (saveProducts, saveOrders, etc): grava local + sobe pra nuvem.
 * - Realtime do Supabase: quando algo muda na tabela `app_kv`, baixa a chave e atualiza o cache.
 * - Sem debounce, sem merge complexo: o último write vence (ok pra admin único editando).
 */

import { getSupabase } from "./supabase-client";

const SYNC_PREFIX = "pkmn_";
const TABLE = "app_kv";

const SYNCABLE_KEYS = new Set([
  "pkmn_products_v2",
  "pkmn_categories_v1",
  "pkmn_collections_v1",
  "pkmn_finance_v1",
  "pkmn_orders_v1",
]);

let initialized = false;
let pulling = false;
let pushEnabled = true; // sempre habilitado — qualquer write local sobe
let bridgeInstalled = false;
let realtimeSubscribed = false;

const keyListeners = new Map<string, Set<() => void>>();

function isSyncableKey(key: string) {
  return key.startsWith(SYNC_PREFIX) && SYNCABLE_KEYS.has(key);
}

function emitKeyChange(key: string) {
  keyListeners.get(key)?.forEach((cb) => cb());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cloud-sync-key", { detail: { key } }));
  }
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

  window.addEventListener("online", () => { setStatus("idle"); void pullFromCloud(); });
  window.addEventListener("offline", () => setStatus("offline"));
  window.addEventListener("focus", () => { void pullFromCloud(); });
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

export function enablePush() { pushEnabled = true; }
export function disablePush() { pushEnabled = false; }

export type SyncStatus = "idle" | "pulling" | "pushing" | "error" | "offline";
const statusListeners = new Set<(s: SyncStatus) => void>();
let currentStatus: SyncStatus = "idle";

function setStatus(s: SyncStatus) {
  currentStatus = s;
  statusListeners.forEach(cb => cb(s));
}
export function getSyncStatus() { return currentStatus; }
export function subscribeSyncStatus(cb: (s: SyncStatus) => void) {
  statusListeners.add(cb);
  cb(currentStatus);
  return () => { statusListeners.delete(cb); };
}

/** Baixa todas as chaves do Supabase e sobrescreve o localStorage (nuvem é a verdade). */
export async function pullFromCloud(): Promise<{ ok: boolean; count: number; error?: string }> {
  const supabase = await getSupabase();
  if (!supabase) {
    setStatus("offline");
    return { ok: false, count: 0, error: "Supabase não configurado" };
  }
  setStatus("pulling");
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("key,value")
      .in("key", Array.from(SYNCABLE_KEYS));

    if (error) { setStatus("error"); return { ok: false, count: 0, error: error.message }; }

    let count = 0;
    const changedKeys = new Set<string>();
    pulling = true;
    try {
      for (const row of data ?? []) {
        const key: string = row.key;
        const raw = JSON.stringify(row.value);
        if (localStorage.getItem(key) !== raw) {
          localStorage.setItem(key, raw);
          changedKeys.add(key);
          count++;
        }
      }
    } finally {
      pulling = false;
    }

    setStatus("idle");
    changedKeys.forEach((key) => emitKeyChange(key));
    if (changedKeys.size > 0) window.dispatchEvent(new Event("cloud-sync-pulled"));
    return { ok: true, count };
  } catch (e: any) {
    setStatus("error");
    return { ok: false, count: 0, error: e?.message ?? String(e) };
  }
}

/** Sobe uma chave individual pro Supabase (substitui). */
async function pushKey(key: string, valueRaw: string) {
  if (!isSyncableKey(key)) return;
  const supabase = await getSupabase();
  if (!supabase) return;
  let value: unknown;
  try { value = JSON.parse(valueRaw); } catch { value = valueRaw; }

  setStatus("pushing");
  const { error } = await supabase
    .from(TABLE)
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) { console.error("[cloud-sync] push falhou", key, error); setStatus("error"); return; }
  setStatus("idle");
}

/** Sobe TODAS as chaves locais pra nuvem. */
export async function pushAllToCloud(): Promise<{ ok: boolean; count: number; error?: string }> {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, count: 0, error: "Supabase não configurado" };
  setStatus("pushing");
  const rows: { key: string; value: unknown; updated_at: string }[] = [];
  for (const key of SYNCABLE_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw == null) continue;
    try { rows.push({ key, value: JSON.parse(raw), updated_at: new Date().toISOString() }); } catch {}
  }
  if (rows.length === 0) { setStatus("idle"); return { ok: true, count: 0 }; }
  const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: "key" });
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
    // Push imediato — sem debounce
    pushKey(key, value).catch(e => console.error("[cloud-sync] push erro", e));
  };
}

/** Realtime: assina mudanças na tabela app_kv pra todos os clientes. */
async function subscribeRealtime() {
  if (realtimeSubscribed) return;
  const supabase = await getSupabase();
  if (!supabase) return;
  realtimeSubscribed = true;
  supabase
    .channel("app_kv_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE },
      (payload: any) => {
        const row = payload.new ?? payload.old;
        const key = row?.key;
        if (!key || !isSyncableKey(key)) return;
        if (payload.eventType === "DELETE") return;
        const raw = JSON.stringify(row.value);
        if (localStorage.getItem(key) === raw) return;
        pulling = true;
        try {
          localStorage.setItem(key, raw);
        } finally {
          pulling = false;
        }
        emitKeyChange(key);
      }
    )
    .subscribe();
}

/** Inicia o sync. */
export async function initCloudSync(): Promise<{ ok: boolean; pulled: number; error?: string }> {
  installInterceptor();
  const res = await pullFromCloud();
  // Se localmente havia chaves que ainda não estavam na nuvem, sobe
  if (res.ok) {
    const cloudKeys = new Set<string>();
    const supabase = await getSupabase();
    if (supabase) {
      const { data } = await supabase.from(TABLE).select("key").in("key", Array.from(SYNCABLE_KEYS));
      (data ?? []).forEach((r: any) => cloudKeys.add(r.key));
    }
    const missing: { key: string; value: unknown; updated_at: string }[] = [];
    for (const key of SYNCABLE_KEYS) {
      if (cloudKeys.has(key)) continue;
      const raw = localStorage.getItem(key);
      if (raw == null) continue;
      try { missing.push({ key, value: JSON.parse(raw), updated_at: new Date().toISOString() }); } catch {}
    }
    if (missing.length > 0 && supabase) {
      await supabase.from(TABLE).upsert(missing, { onConflict: "key" });
    }
  }
  void subscribeRealtime();
  startPolling();
  return { ok: res.ok, pulled: res.count, error: res.error };
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
function startPolling() {
  if (pollTimer || typeof window === "undefined") return;
  pollTimer = setInterval(() => {
    if (document.hidden || !navigator.onLine) return;
    pullFromCloud().catch(() => {});
  }, 6000);
}
