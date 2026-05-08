import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { requestPasswordReset } from "@/lib/email-client";

export const Route = createFileRoute("/esqueci-senha")({
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await requestPasswordReset({ email: email.trim().toLowerCase(), origin: window.location.origin });
      setDone(true);
    } catch (e: any) { setErr(e?.message ?? "Erro"); }
    finally { setBusy(false); }
  };

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <h1 className="mb-1 font-display text-2xl">Esqueci minha senha</h1>
        <p className="mb-5 text-sm text-muted-foreground">Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>
        {done ? (
          <div className="rounded-md bg-primary/10 p-4 text-sm">
            Se este e-mail estiver cadastrado, você receberá em alguns instantes um link para redefinir a senha (válido por 1 hora). Cheque também a caixa de spam.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
              className="w-full rounded-md border border-border bg-input px-4 py-3 outline-none focus:border-primary" />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
              {busy ? "Enviando..." : "Enviar link de redefinição"}
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/login" className="hover:text-primary">← Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}
