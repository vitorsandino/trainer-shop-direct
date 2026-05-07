/**
 * Cloud Sync — sincronização automática entre localStorage e Supabase.
 *
 * Estratégia anti-conflito:
 * - Para chaves que guardam arrays de objetos (users, products, orders, categories, collections),
 *   o sync FAZ MERGE por `id` (ou `value` no caso de categorias) usando `updatedAt`/`createdAt`
 *   como tiebreak — ao invés de simplesmente substituir o array inteiro.
 * - Antes de cada pull, dá flush em todos os pushes pendentes (debounce) pra evitar
 *   que o pull sobrescreva escritas locais ainda na fila.
 * - Push é debounced por 800ms; pull roda a cada 4s em background.
 */

import { getSupabase } from "./supabase-client";

const SYNC_PREFIX = "pkmn_";
const TABLE = "app_kv";

// Chaves array que devem ser mergeadas item-a-item.
const MERGEABLE_LIST_KEYS: Record<string, string> = {
  pkmn_users_v1: "id",
  pkmn_products_v2: "id",
  pkmn_orders_v1: "id",
  pkmn_categories_v1: "value",
  pkmn_collections_v1: "id",
};

const SYNCABLE_KEYS = new Set([
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
const pendingPushes = new Map<string, { value: string; timer: ReturnType<typeof setTimeout> }>();
const PUSH_DEBOUNCE_MS = 800;

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

  window.addEventListener("online", () => setStatus("idle"));
  window.addEventListener("offline", () => setStatus("offline"));
  window.addEventListener("focus", () => {
    pullFromCloud({ background: true }).catch(() => {});
  });
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

function tsOf(item: any): number {
  return Number(item?.updatedAt ?? item?.createdAt ?? 0) || 0;
}

/** Faz merge entre arrays local e cloud usando idField + tiebreak por timestamp. */
function mergeLists(local: unknown, cloud: unknown, idField: string): unknown[] {
  const localArr = Array.isArray(local) ? local : [];
  const cloudArr = Array.isArray(cloud) ? cloud : [];
  const map = new Map<string, any>();
  for (const item of cloudArr) {
    const id = item?.[idField];
    if (id != null) map.set(String(id), item);
  }
  for (const item of localArr) {
    const id = item?.[idField];
    if (id == null) continue;
    const key = String(id);
    const existing = map.get(key);
    if (!existing) { map.set(key, item); continue; }
    // mais novo vence; sem timestamps, mantém local
    if (tsOf(item) >= tsOf(existing)) map.set(key, item);
  }
  return Array.from(map.values());
}

function readLocal(key: string): unknown {
  const raw = localStorage.getItem(key);
  if (raw == null) return undefined;
  try { return JSON.parse(raw); } catch { return raw; }
}

function getLocalRows() {
  const rows: { key: string; value: unknown; updated_at: string }[] = [];
  for (const key of SYNCABLE_KEYS) {
    const v = readLocal(key);
    if (v === undefined) continue;
    rows.push({ key, value: v, updated_at: new Date().toISOString() });
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

/** Habilita push automático. */
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
  return () => { statusListeners.delete(cb); };
}

/** Dispara imediatamente todos os pushes pendentes (debounced). */
async function flushPendingPushes() {
  const entries = Array.from(pendingPushes.entries());
  for (const [key, { timer }] of entries) clearTimeout(timer);
  pendingPushes.clear();
  for (const [key, { value }] of entries) {
    try { await pushKey(key, value); } catch (e) { console.error("[cloud-sync] flush erro", key, e); }
  }
}

/** Baixa todas as chaves do Supabase e MERGE com o localStorage. */
export async function pullFromCloud(options?: { background?: boolean }): Promise<{ ok: boolean; count: number; error?: string }> {
  const supabase = await getSupabase();
  if (!supabase) {
    setStatus("offline");
    return { ok: false, count: 0, error: "Supabase não configurado" };
  }
  // Garante que escritas locais pendentes subam ANTES de puxar (evita perda).
  await flushPendingPushes();
  pulling = true;
  if (!options?.background) setStatus("pulling");
  try {
    const { data, error } = await supabase.from(TABLE).select("key,value").in("key", Array.from(SYNCABLE_KEYS));
    if (error) { setStatus("error"); return { ok: false, count: 0, error: error.message }; }
    let count = 0;
    const changedKeys = new Set<string>();
    const toUploadBack: { key: string; value: unknown; updated_at: string }[] = [];

    for (const row of data ?? []) {
      const key: string = row.key;
      const cloudVal = row.value;
      const localVal = readLocal(key);
      let nextVal: unknown = cloudVal;

      const idField = MERGEABLE_LIST_KEYS[key];
      if (idField && Array.isArray(cloudVal) && Array.isArray(localVal)) {
        const merged = mergeLists(localVal, cloudVal, idField);
        nextVal = merged;
        // Se merge difere do que está na nuvem, devolve pra cloud
        if (JSON.stringify(merged) !== JSON.stringify(cloudVal)) {
          toUploadBack.push({ key, value: merged, updated_at: new Date().toISOString() });
        }
      }

      const nextRaw = JSON.stringify(nextVal);
      if (localStorage.getItem(key) !== nextRaw) {
        try {
          pulling = true;
          localStorage.setItem(key, nextRaw);
          changedKeys.add(key);
          count++;
        } finally {
          pulling = true; // mantém true até fim do try externo
        }
      }
    }

    // Sobe merges de volta pra todos os clientes verem o estado completo
    if (pushEnabled && toUploadBack.length > 0) {
      const { error: upErr } = await supabase.from(TABLE).upsert(toUploadBack);
      if (upErr) console.warn("[cloud-sync] re-upload merge falhou", upErr);
    }

    setStatus("idle");
    changedKeys.forEach((key) => emitKeyChange(key));
    if (changedKeys.size > 0) window.dispatchEvent(new Event("cloud-sync-pulled"));
    return { ok: true, count };
  } finally {
    pulling = false;
  }
}

/** Sobe uma chave individual pro Supabase, mergeando com o que já está lá. */
async function pushKey(key: string, valueRaw: string) {
  if (!isSyncableKey(key)) return;
  const supabase = await getSupabase();
  if (!supabase) return;
  let value: unknown;
  try { value = JSON.parse(valueRaw); } catch { value = valueRaw; }

  const idField = MERGEABLE_LIST_KEYS[key];
  if (idField && Array.isArray(value)) {
    // Lê estado atual da nuvem e mergeia antes de sobrescrever
    const { data: existing } = await supabase.from(TABLE).select("value").eq("key", key).maybeSingle();
    const cloudVal = existing?.value;
    if (Array.isArray(cloudVal)) {
      const merged = mergeLists(value, cloudVal, idField);
      value = merged;
      // Atualiza localStorage com o merge também (sem disparar push)
      try {
        pulling = true;
        localStorage.setItem(key, JSON.stringify(merged));
        emitKeyChange(key);
      } finally {
        pulling = false;
      }
    }
  }

  setStatus("pushing");
  const { error } = await supabase.from(TABLE).upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) { console.error("[cloud-sync] push falhou", key, error); setStatus("error"); return; }
  setStatus("idle");
}

/** Sobe TODAS as chaves locais pra nuvem (1ª vez). */
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
    const existing = pendingPushes.get(key);
    if (existing) clearTimeout(existing.timer);
    const timer = setTimeout(() => {
      pendingPushes.delete(key);
      pushKey(key, value).catch(e => console.error("[cloud-sync] push erro", e));
    }, PUSH_DEBOUNCE_MS);
    pendingPushes.set(key, { value, timer });
  };
}

/** Inicia o sync. */
export async function initCloudSync(): Promise<{ ok: boolean; pulled: number; error?: string }> {
  installInterceptor();
  enablePush();
  const res = await pullFromCloud();
  if (res.ok && getLocalRows().length > 0) {
    // Garante que os dados locais subam (merge feito em pushKey/pull)
    await pushAllToCloud();
  }
  startBackgroundPolling();
  return { ok: res.ok, pulled: res.count, error: res.error };
}
