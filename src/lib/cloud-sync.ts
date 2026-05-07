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

let initialized = false;
let pulling = false;
let pushEnabled = false;
const pendingPushes = new Map<string, NodeJS.Timeout>();
const PUSH_DEBOUNCE_MS = 800;

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
export async function pullFromCloud(): Promise<{ ok: boolean; count: number; error?: string }> {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, count: 0, error: "Supabase não configurado" };
  pulling = true;
  setStatus("pulling");
  try {
    const { data, error } = await supabase.from(TABLE).select("key,value");
    if (error) { setStatus("error"); return { ok: false, count: 0, error: error.message }; }
    let count = 0;
    for (const row of data ?? []) {
      try {
        localStorage.setItem(row.key, JSON.stringify(row.value));
        count++;
      } catch {}
    }
    setStatus("idle");
    // Notifica listeners (recarrega a página pra refletir tudo)
    window.dispatchEvent(new Event("cloud-sync-pulled"));
    return { ok: true, count };
  } finally {
    pulling = false;
  }
}

/** Sobe uma chave individual pro Supabase. */
async function pushKey(key: string, valueRaw: string) {
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
  const rows: { key: string; value: unknown; updated_at: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(SYNC_PREFIX)) continue;
    const raw = localStorage.getItem(k);
    if (raw === null) continue;
    let value: unknown;
    try { value = JSON.parse(raw); } catch { value = raw; }
    rows.push({ key: k, value, updated_at: new Date().toISOString() });
  }
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
  const original = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key: string, value: string) {
    original.call(this, key, value);
    if (this !== window.localStorage) return;
    if (pulling) return;
    if (!pushEnabled) return;
    if (!key.startsWith(SYNC_PREFIX)) return;
    // Debounce
    const existing = pendingPushes.get(key);
    if (existing) clearTimeout(existing);
    pendingPushes.set(key, setTimeout(() => {
      pendingPushes.delete(key);
      pushKey(key, value).catch(e => console.error("[cloud-sync] push erro", e));
    }, PUSH_DEBOUNCE_MS));
  };
}

/** Inicia o sync: instala o interceptor e faz pull inicial. */
export async function initCloudSync(): Promise<{ ok: boolean; pulled: number; error?: string }> {
  installInterceptor();
  const res = await pullFromCloud();
  return { ok: res.ok, pulled: res.count, error: res.error };
}
