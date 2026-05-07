import { useEffect, useRef, useState } from "react";
import { Download, Upload, Database, Clock, Trash2, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  downloadBackup, importFromFile, getSnapshots, restoreSnapshot, deleteSnapshot,
  storageUsage, formatBytes, ensureDailySnapshot,
} from "@/lib/backup";

export function BackupTab() {
  const [snaps, setSnaps] = useState(() => getSnapshots());
  const [usage, setUsage] = useState(() => storageUsage());
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => { setSnaps(getSnapshots()); setUsage(storageUsage()); };

  useEffect(() => { ensureDailySnapshot(); refresh(); }, []);

  const handleImport = async (file: File, mode: "replace" | "merge") => {
    try {
      await importFromFile(file, mode);
      setMsg({ type: "ok", text: "Backup importado! A página será recarregada." });
    } catch (e: any) {
      setMsg({ type: "err", text: e.message || "Falha ao importar." });
    }
  };

  return (
    <div className="space-y-5">
      {/* Aviso */}
      <div className="flex items-start gap-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
        <div>
          <p className="font-semibold text-foreground">Seus dados ficam neste navegador</p>
          <p className="text-muted-foreground">
            Para acessar de outro dispositivo (ou não perder ao limpar o navegador), <strong>exporte um backup</strong> e
            guarde o arquivo. No outro navegador, importe o arquivo aqui mesmo.
          </p>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${msg.type === "ok" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
          {msg.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {msg.text}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Exportar */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg">Exportar backup</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Baixa um arquivo <code className="rounded bg-background px-1">.json</code> com TUDO: produtos, categorias,
            coleções, financeiro, pedidos, contas e estatísticas.
          </p>
          <button
            onClick={() => downloadBackup()}
            className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Download className="mr-2 inline h-4 w-4" /> Baixar backup completo
          </button>
        </div>

        {/* Importar */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Upload className="h-5 w-5 text-secondary" />
            <h2 className="font-display text-lg">Importar backup</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Selecione um arquivo de backup. <strong>Substituir</strong> apaga os dados atuais. <strong>Mesclar</strong> adiciona
            sem apagar.
          </p>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f, (window as any).__importMode || "replace"); e.target.value = ""; }} />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { (window as any).__importMode = "replace"; fileRef.current?.click(); }}
              className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/15"
            >
              Substituir tudo
            </button>
            <button
              onClick={() => { (window as any).__importMode = "merge"; fileRef.current?.click(); }}
              className="rounded-md border border-border px-3 py-2.5 text-sm font-semibold transition hover:bg-background"
            >
              Mesclar
            </button>
          </div>
        </div>
      </div>

      {/* Snapshots automáticos */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg">Snapshots automáticos ({snaps.length})</h2>
          </div>
          <span className="text-xs text-muted-foreground">Mantém os últimos 7 dias</span>
        </div>
        {snaps.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum snapshot ainda. O primeiro será criado automaticamente hoje.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {snaps.map(s => (
              <li key={s.at} className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex-1 min-w-[160px]">
                  <p className="font-medium">{new Date(s.at).toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground">
                    {Object.keys(s.data.data).length} áreas salvas
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Restaurar dados de ${new Date(s.at).toLocaleString("pt-BR")}? Os dados atuais serão substituídos.`)) {
                      try { restoreSnapshot(s.at); } catch (e: any) { setMsg({ type: "err", text: e.message }); }
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded border border-border px-3 py-1.5 text-xs hover:bg-background"
                >
                  <RotateCcw className="h-3 w-3" /> Restaurar
                </button>
                <button
                  onClick={() => { deleteSnapshot(s.at); refresh(); }}
                  className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                  aria-label="Excluir snapshot"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Uso de armazenamento */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-secondary" />
            <h2 className="font-display text-lg">Uso de armazenamento</h2>
          </div>
          <span className="font-display text-lg text-primary">{formatBytes(usage.used)}</span>
        </div>
        <ul className="space-y-1.5 text-sm">
          {usage.items.filter(i => i.size > 0).map(i => (
            <li key={i.key} className="flex justify-between">
              <span className="text-muted-foreground">{i.key.replace("pkmn_", "").replace(/_v\d+$/, "")}</span>
              <span className="font-mono text-xs">{formatBytes(i.size)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Limite típico do navegador: ~5–10 MB por site. Imagens são o que mais ocupa espaço.
        </p>
      </div>
    </div>
  );
}
