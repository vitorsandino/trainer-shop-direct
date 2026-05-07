// Backup/restore completo de TODOS os dados em localStorage.
// Permite migrar entre navegadores/dispositivos exportando um único arquivo .json.

const KEYS = [
  "pkmn_products_v2",
  "pkmn_categories_v1",
  "pkmn_collections_v1",
  "pkmn_finance_v1",
  "pkmn_orders_v1",
  "pkmn_users_v1",
  "pkmn_analytics_v1",
  "pkmn_cart_v1",
];

const SNAP_KEY = "pkmn_auto_snapshots_v1";
const MAX_SNAPS = 7;

export type Backup = {
  version: 1;
  exportedAt: number;
  app: "pandex-store";
  data: Record<string, unknown>;
};

export function exportAll(): Backup {
  const data: Record<string, unknown> = {};
  for (const k of KEYS) {
    const raw = localStorage.getItem(k);
    if (raw != null) {
      try { data[k] = JSON.parse(raw); } catch { data[k] = raw; }
    }
  }
  return { version: 1, exportedAt: Date.now(), app: "pandex-store", data };
}

export function downloadBackup(filename?: string) {
  const b = exportAll();
  const name = filename ?? `pandex-backup-${new Date(b.exportedAt).toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(b, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function importAll(b: Backup, mode: "replace" | "merge" = "replace") {
  if (!b || b.app !== "pandex-store" || !b.data) throw new Error("Arquivo de backup inválido.");
  for (const [k, v] of Object.entries(b.data)) {
    if (!KEYS.includes(k)) continue;
    if (mode === "merge" && Array.isArray(v)) {
      const existing = (() => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } })();
      if (Array.isArray(existing)) {
        // merge por id se existir, senão concatena
        const map = new Map<string, any>();
        for (const item of existing) if (item && item.id) map.set(item.id, item);
        for (const item of v as any[]) if (item && item.id) map.set(item.id, item);
        const merged = map.size > 0 ? Array.from(map.values()) : [...existing, ...(v as any[])];
        localStorage.setItem(k, JSON.stringify(merged));
        continue;
      }
    }
    localStorage.setItem(k, JSON.stringify(v));
  }
  // dispara um reload pra recarregar todos os subscribers
  setTimeout(() => window.location.reload(), 200);
}

export async function importFromFile(file: File, mode: "replace" | "merge" = "replace") {
  const text = await file.text();
  const json = JSON.parse(text) as Backup;
  importAll(json, mode);
}

// ---- Snapshots automáticos diários ----
type Snapshot = { at: number; data: Backup };

export function getSnapshots(): Snapshot[] {
  try { return JSON.parse(localStorage.getItem(SNAP_KEY) || "[]"); } catch { return []; }
}

export function ensureDailySnapshot() {
  if (typeof window === "undefined") return;
  const list = getSnapshots();
  const today = new Date().toISOString().slice(0, 10);
  const has = list.some(s => new Date(s.at).toISOString().slice(0, 10) === today);
  if (has) return;
  const snap: Snapshot = { at: Date.now(), data: exportAll() };
  const next = [snap, ...list].slice(0, MAX_SNAPS);
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(next));
  } catch {
    // se estourar quota, mantém só o atual
    try { localStorage.setItem(SNAP_KEY, JSON.stringify([snap])); } catch {}
  }
}

export function restoreSnapshot(at: number) {
  const s = getSnapshots().find(x => x.at === at);
  if (!s) throw new Error("Snapshot não encontrado");
  importAll(s.data, "replace");
}

export function deleteSnapshot(at: number) {
  const list = getSnapshots().filter(s => s.at !== at);
  localStorage.setItem(SNAP_KEY, JSON.stringify(list));
}

export function storageUsage(): { used: number; items: { key: string; size: number }[] } {
  let used = 0;
  const items: { key: string; size: number }[] = [];
  for (const k of [...KEYS, SNAP_KEY]) {
    const v = localStorage.getItem(k);
    const size = v ? new Blob([v]).size : 0;
    used += size;
    items.push({ key: k, size });
  }
  return { used, items: items.sort((a, b) => b.size - a.size) };
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
