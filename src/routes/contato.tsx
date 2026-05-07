import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Mail, MapPin, Clock, Send, Phone, Instagram } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/products";
import { z } from "zod";

const CONTACT_EMAIL = "contato@pandexstore.com.br";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Pandex Store" },
      { name: "description", content: "Fale com a Pandex Store: WhatsApp, e-mail e horário de atendimento. Tire dúvidas sobre Pokémon TCG." },
      { property: "og:title", content: "Contato — Pandex Store" },
      { property: "og:description", content: "WhatsApp, e-mail e formulário de contato direto com a equipe Pandex." },
    ],
  }),
  component: ContatoPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").max(180),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().min(2, "Informe o assunto").max(120),
  message: z.string().trim().min(10, "Escreva uma mensagem com pelo menos 10 caracteres").max(2000),
});

function ContatoPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: Record<string, string> = {};
      for (const i of r.error.issues) errs[i.path.join(".")] = i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    const body = encodeURIComponent(
      `Nome: ${form.name}\nE-mail: ${form.email}\nTelefone: ${form.phone || "-"}\n\n${form.message}`
    );
    const subject = encodeURIComponent(`[Site] ${form.subject}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const wppMsg = encodeURIComponent("Olá! Vim pelo site da Pandex Store e gostaria de tirar uma dúvida.");

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
          Fale com a gente
        </span>
        <h1 className="mt-4 font-display text-3xl text-foreground md:text-5xl">
          Estamos aqui para te ajudar 🐼
        </h1>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          Dúvidas sobre produtos, pedidos ou parcerias? Responda no canal que preferir — atendemos pessoalmente.
        </p>
      </div>

      {/* Cards de canais */}
      <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${wppMsg}`}
          target="_blank" rel="noopener noreferrer"
          className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-[var(--whatsapp)] hover:shadow-[var(--shadow-glow)]"
        >
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-[var(--whatsapp)]/15 text-[var(--whatsapp)]">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h2 className="font-display text-lg">WhatsApp</h2>
          <p className="mt-1 text-sm text-muted-foreground">Resposta mais rápida — em horário comercial.</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--whatsapp)] group-hover:underline">
            <Phone className="h-3.5 w-3.5" /> +55 19 98760-1686
          </p>
        </a>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary hover:shadow-[var(--shadow-glow)]"
        >
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="font-display text-lg">E-mail</h2>
          <p className="mt-1 text-sm text-muted-foreground">Para parcerias, NF e atendimento detalhado.</p>
          <p className="mt-3 break-all text-sm font-bold text-primary group-hover:underline">{CONTACT_EMAIL}</p>
        </a>

        <a
          href="https://instagram.com"
          target="_blank" rel="noopener noreferrer"
          className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-secondary hover:shadow-[var(--shadow-glow)]"
        >
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-secondary/20 text-secondary-foreground">
            <Instagram className="h-6 w-6" />
          </div>
          <h2 className="font-display text-lg">Instagram</h2>
          <p className="mt-1 text-sm text-muted-foreground">Novidades, lançamentos e bastidores.</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-foreground group-hover:underline">
            @pandexstore
          </p>
        </a>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
        {/* Formulário */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <h2 className="font-display text-2xl">Envie uma mensagem</h2>
          <p className="mt-1 text-sm text-muted-foreground">Vamos abrir seu cliente de e-mail com a mensagem pronta.</p>

          {sent && (
            <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700">
              ✅ Pronto! Se nada abriu, copie nosso e-mail: <strong>{CONTACT_EMAIL}</strong>
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome *" error={errors.name}>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="cinput" placeholder="Seu nome completo" />
              </Field>
              <Field label="E-mail *" error={errors.email}>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="cinput" placeholder="voce@email.com" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Telefone (opcional)" error={errors.phone}>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="cinput" placeholder="(19) 9 8760-1686" />
              </Field>
              <Field label="Assunto *" error={errors.subject}>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="cinput" placeholder="Dúvida sobre pedido" />
              </Field>
            </div>
            <Field label="Mensagem *" error={errors.message}>
              <textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="cinput" placeholder="Como podemos ajudar?" />
            </Field>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg transition hover:brightness-110 sm:w-auto"
            >
              <Send className="h-4 w-4" /> Enviar mensagem
            </button>
          </form>
        </div>

        {/* Sidebar info */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
            <Clock className="mb-3 h-6 w-6 text-primary" />
            <h3 className="font-display text-lg">Horário de atendimento</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="flex justify-between"><span className="text-muted-foreground">Seg – Sex</span><strong>09h – 18h</strong></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Sábado</span><strong>09h – 13h</strong></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Dom / feriados</span><strong>Fechado</strong></li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Mensagens fora do horário são respondidas no próximo dia útil.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <MapPin className="mb-3 h-6 w-6 text-secondary" />
            <h3 className="font-display text-lg">Onde estamos</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Operação 100% online — enviamos para todo o Brasil pelos Correios e transportadoras.
            </p>
          </div>
        </aside>
      </div>

      <style>{`.cinput{width:100%;border-radius:.5rem;border:1px solid var(--border);background:var(--input);padding:.65rem .85rem;font-size:.875rem;outline:none;color:var(--foreground)}.cinput:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--primary) 18%,transparent)}`}</style>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
