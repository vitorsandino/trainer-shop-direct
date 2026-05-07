import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import {
  pullFromCloud, pushAllToCloud, subscribeSyncStatus, type SyncStatus, enablePush,
} from "@/lib/cloud-sync";

export function CloudTab() {
  const [status, setStatus] = useState<SyncStatus>("offline");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    enablePush();
    const unsub = subscribeSyncStatus(setStatus);
    return () => { unsub(); };
  }, []);

  const handlePull = async () => {
    setBusy(true); setMsg(null);
    const r = await pullFromCloud();
    setBusy(false);
    if (r.ok) {
      setMsg({ type: "ok", text: `${r.count} chaves baixadas. Recarregando...` });
      setTimeout(() => window.location.reload(), 800);
    } else setMsg({ type: "err", text: r.error || "Erro ao baixar" });
  };

  const handlePushAll = async () => {
    if (!confirm("Enviar TODOS os dados deste navegador para a nuvem? Vai sobrescrever o que estiver online.")) return;
    setBusy(true); setMsg(null);
    const r = await pushAllToCloud();
    setBusy(false);
    if (r.ok) setMsg({ type: "ok", text: `${r.count} chaves enviadas para a nuvem.` });
    else setMsg({ type: "err", text: r.error || "Erro ao enviar" });
  };

  const statusInfo: Record<SyncStatus, { label: string; color: string; Icon: typeof Cloud }> = {
    idle:    { label: "Sincronizado",   color: "text-emerald-400",  Icon: CheckCircle2 },
    pulling: { label: "Baixando...",    color: "text-blue-400",     Icon: RefreshCw },
    pushing: { label: "Enviando...",    color: "text-blue-400",     Icon: Upload },
    error:   { label: "Erro de sync",   color: "text-destructive",  Icon: AlertCircle },
    offline: { label: "Offline",        color: "text-muted-foreground", Icon: CloudOff },
  };
  const s = statusInfo[status];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <Cloud className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-display text-xl">Sincronização em nuvem</h2>
            <p className="text-sm text-muted-foreground">Seus dados ficam salvos online no Supabase.</p>
          </div>
        </div>

        <div className={`mb-4 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm ${s.color}`}>
          <s.Icon className={`h-4 w-4 ${status === "pulling" || status === "pushing" ? "animate-spin" : ""}`} /> {s.label}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            disabled={busy}
            onClick={handlePull}
            className="flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-3 text-sm font-semibold transition hover:bg-card disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Baixar da nuvem
          </button>
          <button
            disabled={busy}
            onClick={handlePushAll}
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> Enviar deste navegador
          </button>
        </div>

        {msg && (
          <p className={`mt-4 text-sm ${msg.type === "ok" ? "text-emerald-400" : "text-destructive"}`}>{msg.text}</p>
        )}

        <div className="mt-6 space-y-2 rounded-md bg-background/50 p-4 text-xs text-muted-foreground">
          <p><strong className="text-foreground">Como funciona:</strong></p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Toda alteração no admin (produtos, categorias, financeiro...) é salva automaticamente na nuvem.</li>
            <li>Ao abrir o site em qualquer navegador, os dados mais recentes são baixados.</li>
            <li><strong className="text-foreground">Primeira vez?</strong> Clique em "Enviar deste navegador" para subir os dados que você já criou.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
