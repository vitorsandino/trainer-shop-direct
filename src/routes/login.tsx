import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { login, register } from "@/lib/auth";

type Search = { redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" }) as Search;
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register({ name, email, phone, password });
      navigate({ to: search.redirect ?? "/conta" });
    } catch (e: any) { setErr(e?.message ?? "Erro"); }
    finally { setBusy(false); }
  };

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex gap-2 rounded-lg border border-border p-1">
          <button onClick={() => setMode("login")} className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${mode === "login" ? "bg-primary text-primary-foreground" : ""}`}>Entrar</button>
          <button onClick={() => setMode("register")} className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${mode === "register" ? "bg-primary text-primary-foreground" : ""}`}>Criar conta</button>
        </div>
        <h1 className="mb-1 font-display text-2xl">{mode === "login" ? "Bem-vindo de volta" : "Criar conta"}</h1>
        <p className="mb-5 text-sm text-muted-foreground">{mode === "login" ? "Acesse sua conta para acompanhar seus pedidos." : "Cadastre-se para comprar e acompanhar entregas."}</p>
        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" required
                className="w-full rounded-md border border-border bg-input px-4 py-3 outline-none focus:border-primary" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Celular (opcional)"
                className="w-full rounded-md border border-border bg-input px-4 py-3 outline-none focus:border-primary" />
            </>
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" required autoComplete="email"
            className="w-full rounded-md border border-border bg-input px-4 py-3 outline-none focus:border-primary" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full rounded-md border border-border bg-input px-4 py-3 outline-none focus:border-primary" />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
            {busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta e entrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">← Voltar para a loja</Link>
        </p>
      </div>
    </div>
  );
}
