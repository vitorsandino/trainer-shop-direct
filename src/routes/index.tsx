import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, MessageCircle, ArrowRight, Truck, Instagram, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { CATEGORIES, getProducts, subscribeProducts, type Product, whatsappLink, WHATSAPP_NUMBER } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { CollectionsShowcase } from "@/components/CollectionsShowcase";
import pandaMark from "@/assets/pandex-panda.png";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    const refresh = () => setProducts(getProducts());
    refresh();
    return subscribeProducts(refresh);
  }, []);

  const featured = products.filter(p => p.featured);
  const latest = [...products].sort((a, b) => b.createdAt - a.createdAt);
  const hero = featured[0] ?? latest[0];

  return (
    <div>
      {/* HERO BANNER — banner principal estilo loja */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-[#eef0ff] via-white to-[#f5f6fb]">
        <div className="container mx-auto grid items-center gap-8 px-4 py-10 md:grid-cols-[1.1fr_1fr] md:py-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--whatsapp)]" /> Loja oficial · Pokémon TCG
            </span>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] text-balance text-foreground md:text-6xl">
              Pandex Store<br/>
              <span className="text-primary">Cartas, Boosters e ETBs</span>
              <br/>originais lacrados.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Catálogo curado para colecionadores e jogadores. Atendimento direto no WhatsApp, com confirmação de estoque, envio rápido e pagamento facilitado.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/categoria/$slug" params={{ slug: CATEGORIES[0]?.value ?? "booster" }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow-soft)] transition hover:scale-[1.02]">
                Ver catálogo <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá Pandex! Gostaria de tirar uma dúvida.")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-sm font-bold text-foreground transition hover:border-[var(--whatsapp)] hover:text-[var(--whatsapp)]">
                <MessageCircle className="h-4 w-4" /> Fale conosco
              </a>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-[var(--shadow-card)] md:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-accent blur-3xl" />
            <div className="relative grid place-items-center">
              <img src={pandaMark} alt="Pandex Store" className="h-64 w-auto object-contain md:h-80" />
            </div>
            {hero && (
              <Link to="/produto/$id" params={{ id: hero.id }}
                className="relative mt-4 flex items-center justify-between gap-4 rounded-2xl border border-border bg-secondary p-4 transition hover:border-primary">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">★ Destaque da semana</p>
                  <p className="line-clamp-1 mt-1 font-display text-base text-foreground">{hero.name}</p>
                  <p className="text-sm font-semibold text-primary">{hero.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
                  Ver <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-white">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-5 text-sm md:grid-cols-4">
          {[
            { icon: BadgeCheck, title: "Produtos originais", text: "Lacrados e garantidos" },
            { icon: Truck, title: "Envio rápido", text: "Postagem em 24h úteis" },
            { icon: ShieldCheck, title: "Compra segura", text: "Atendimento humano" },
            { icon: MessageCircle, title: "Direto no WhatsApp", text: "Pagamento facilitado" },
          ].map((it, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-primary">
                <it.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{it.title}</p>
                <p className="text-xs text-muted-foreground">{it.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorias — chips grandes */}
      <section className="container mx-auto px-4 py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl md:text-3xl">Categorias</h2>
          <Link to="/buscar" search={{ q: "" }} className="text-sm font-semibold text-primary hover:underline">Ver tudo →</Link>
        </div>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {CATEGORIES.map(c => (
            <Link key={c.value} to="/categoria/$slug" params={{ slug: c.value }}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-white p-5 text-center transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--shadow-card)]">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <span className="text-base font-black">{c.label.charAt(0)}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured carousel */}
      {featured.length > 0 && (
        <ProductRow title="Destaques" subtitle="Selecionados pela equipe Pandex" products={featured.slice(0, 12)} />
      )}

      <CollectionsShowcase />

      {/* Novidades */}
      {latest.length > 0 && (
        <ProductRow title="Novidades" subtitle="Acabou de chegar no catálogo" products={latest.slice(0, 12)} />
      )}

      {/* CTA WhatsApp */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid items-center gap-6 rounded-3xl border border-border bg-gradient-to-r from-primary to-[#6366f1] p-8 text-primary-foreground md:grid-cols-[1fr_auto] md:p-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]">
              <MessageCircle className="h-3 w-3" /> Atendimento
            </span>
            <h3 className="mt-3 font-display text-2xl leading-tight md:text-4xl">
              Não encontrou o que procura?<br/>Fale com a gente no WhatsApp.
            </h3>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              Reservas, encomendas, pré-vendas e parcelamento. Resposta em minutos no horário comercial.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={whatsappLink("Atendimento")} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--whatsapp)] px-6 py-3 text-sm font-bold text-white transition hover:brightness-110">
              <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
            </a>
            <a href="https://instagram.com/pandex.store" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary transition hover:bg-white/90">
              <Instagram className="h-4 w-4" /> Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductRow({ title, subtitle, products }: { title: string; subtitle?: string; products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <section className="border-t border-border bg-white">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="hidden gap-2 md:flex">
            <button onClick={() => scroll(-1)} aria-label="Anterior"
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-foreground transition hover:border-primary hover:text-primary">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => scroll(1)} aria-label="Próximo"
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-foreground transition hover:border-primary hover:text-primary">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div ref={ref} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map(p => (
            <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[32%] md:w-[24%] lg:w-[19%]">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
