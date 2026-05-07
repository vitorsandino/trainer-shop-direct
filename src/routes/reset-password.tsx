import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { resetPassword } from "@/lib/email.functions";

type Search = { token?: string };

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>): Search => ({ token: typeof s.token === "string" ? s.token : undefined }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const { token } = useSearch({ from: "/reset-password" }) as Search;
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!token) { setErr("Link inválido"); return; }
    if (pw.length < 6) { setErr("A senha precisa ter pelo menos 6 caracteres"); return; }
    if (pw !== pw2) { setErr("As senhas não conferem"); return; }
    setBusy(true);
    try {
      await resetPassword({ data: { token, newPassword: pw } });
      setDone(true);
      setTimeout(() => navigate({ to: "/login" }), 2000);
    } catch (e: any) { setErr(e?.message ?? "Erro ao redefinir"); }
    finally { setBusy(false); }
  };

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <h1 className="mb-1 font-display text-2xl">Criar nova senha</h1>
        <p className="mb-5 text-sm text-muted-foreground">Defina sua nova senha abaixo.</p>
        {done ? (
          <div className="rounded-md bg-primary/10 p-4 text-sm">Senha alterada! Redirecionando para o login...</div>
        ) : !token ? (
          <p className="text-sm text-destructive">Link inválido. <Link to="/esqueci-senha" className="text-primary underline">Solicitar novo link</Link>.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nova senha"
              className="w-full rounded-md border border-border bg-input px-4 py-3 outline-none focus:border-primary" />
            <input type="password" required value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirmar nova senha"
              className="w-full rounded-md border border-border bg-input px-4 py-3 outline-none focus:border-primary" />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
              {busy ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
