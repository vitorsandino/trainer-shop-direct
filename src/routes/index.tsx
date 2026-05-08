import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, ShieldCheck, MessageCircle, Sparkles, ArrowRight, Zap } from "lucide-react";
import { CATEGORIES, getProducts, subscribeProducts, type Product, whatsappLink } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { CollectionsShowcase } from "@/components/CollectionsShowcase";
import logoMark from "@/assets/pandex-logo.png";

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
  const featured = products.filter(p => p.featured).slice(0, 8);
  const latest = [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

  return (
    <div>
      {/* HERO — preto absoluto, panda gigante, neon discreto */}
      <section className="relative overflow-hidden bg-foreground text-background">
        {/* panda eyes pattern */}
        <div className="pointer-events-none absolute inset-0 panda-grid opacity-[0.08]" />
        {/* neon glow blobs */}
        <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-[var(--neon)] opacity-20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 -top-20 h-96 w-96 rounded-full bg-[var(--electric)] opacity-15 blur-[120px]" />

        <div className="container relative mx-auto grid items-center gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon)] shadow-[0_0_8px_var(--neon)]" />
              Pokémon TCG · Boosters · ETB · Avulsas
            </span>
            <h1 className="font-display text-5xl leading-[0.95] text-balance md:text-7xl lg:text-8xl">
              SUA LOJA<br/>
              <span className="relative inline-block">
                DE TCG
                <span className="absolute -right-3 -top-2 h-3 w-3 rounded-full bg-[var(--neon)] shadow-[0_0_18px_var(--neon)]" />
              </span>{" "}
              <span className="text-white/40">COM</span><br/>
              <span className="bg-gradient-to-r from-white via-white to-[var(--highlight)] bg-clip-text text-transparent">PERSONALIDADE.</span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-white/70 md:text-lg">
              Pokémon TCG selecionado a dedo: boosters, ETB, coleções e cartas avulsas.
              Lacrados originais, postagem rápida e atendimento direto no WhatsApp.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/categoria/$slug" params={{ slug: CATEGORIES[0]?.value ?? "booster" }}
                className="group inline-flex items-center gap-2 rounded-full bg-[var(--neon)] px-7 py-4 text-sm font-bold text-foreground transition hover:scale-[1.02] hover:shadow-[var(--shadow-glow)]"
              >
                Ver catálogo
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <a
                href={whatsappLink("Catálogo Pandex Store")} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/0 px-7 py-4 text-sm font-bold text-white transition hover:border-white hover:bg-white hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 text-xs text-white/60">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[var(--neon)]" /> Lacrados originais</span>
              <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-[var(--neon)]" /> Envio Brasil todo</span>
              <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-[var(--neon)]" /> Postagem em 24h</span>
            </div>
          </div>

          {/* mascote — logo Pandex em card branco */}
          <div className="relative mx-auto hidden md:block">
            <div className="absolute inset-0 -m-10 rounded-full bg-gradient-to-tr from-[var(--neon)]/25 to-[var(--electric)]/20 blur-3xl" />
            <div className="relative grid place-items-center rounded-[2.5rem] border border-white/10 bg-white p-12 backdrop-blur shadow-[var(--shadow-pop)]">
              <img src={logoMark} alt="Pandex Store" className="h-72 w-72 object-contain" />
              <span className="absolute -left-3 top-6 rounded-full border border-white/20 bg-foreground px-3 py-1 text-[10px] font-bold tracking-widest text-[var(--neon)]">NEW DROP</span>
              <span className="absolute -right-2 bottom-10 rounded-full border border-white/20 bg-foreground px-3 py-1 text-[10px] font-bold tracking-widest text-white">100% ORIGINAL</span>
            </div>
          </div>
        </div>

        {/* Marquee de chips */}
        <div className="border-y border-white/10 bg-foreground/60">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60">
            <span>★ Pokémon TCG</span>
            <span>★ Boosters</span>
            <span>★ ETB</span>
            <span className="hidden sm:inline">★ Coleções</span>
            <span>★ Cards Avulsos</span>
            <span className="hidden md:inline">★ Acessórios TCG</span>
          </div>
        </div>
      </section>

      {/* Quick categorias chips */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto flex gap-3 overflow-x-auto px-4 py-4">
          {CATEGORIES.map(c => (
            <Link
              key={c.value}
              to="/categoria/$slug"
              params={{ slug: c.value }}
              className="flex-shrink-0 rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold text-foreground transition hover:border-foreground hover:bg-foreground hover:text-background"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Categorias visuais — cards modernos */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">— Categorias</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">Explore o universo</h2>
          </div>
          <Sparkles className="h-6 w-6 text-foreground/30" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.value}
              to="/categoria/$slug"
              params={{ slug: c.value }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 transition glow-hover hover:-translate-y-1 hover:border-foreground"
            >
              {/* olho de panda decorativo */}
              <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-foreground/[0.04] transition group-hover:bg-[var(--neon)]/20" />
              <div className="pointer-events-none absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-foreground" />
              <div className="relative">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">0{i + 1}</span>
                <p className="mt-2 font-display text-xl text-foreground">{c.label}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-foreground/70 transition group-hover:gap-2 group-hover:text-foreground">
                  Ver produtos <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CollectionsShowcase />

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">— Em destaque</p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">Mais procurados</h2>
            </div>
            <Link to="/categoria/$slug" params={{ slug: CATEGORIES[0]?.value ?? "booster" }} className="hidden text-sm font-semibold text-foreground hover:underline sm:inline-flex">
              Ver tudo →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Banner promo — preto + neon */}
      <section className="container mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 text-background md:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--neon)] opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 panda-grid opacity-[0.08]" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <span className="inline-block rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--neon)]">
                Promo da semana
              </span>
              <h3 className="mt-3 font-display text-3xl leading-tight md:text-5xl">
                Frete grátis acima de <span className="text-[var(--neon)]">R$ 199</span>
              </h3>
              <p className="mt-2 max-w-md text-sm text-white/70">
                Junte sua coleção sem pesar no bolso. Envio Brasil todo, postado em até 24h.
              </p>
            </div>
            <a
              href={whatsappLink("Quero aproveitar o frete grátis")}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start rounded-full bg-[var(--neon)] px-7 py-4 text-sm font-bold text-foreground transition hover:scale-105 hover:shadow-[var(--shadow-glow)]"
            >
              Garantir <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Latest */}
      {latest.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">— Novidades</p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">Acabou de chegar</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {latest.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Trust strip */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Envio rápido", text: "Postagem em até 24h." },
            { icon: ShieldCheck, title: "100% original", text: "Lacrados e garantidos." },
            { icon: MessageCircle, title: "Atendimento humano", text: "Direto no WhatsApp." },
          ].map((it, i) => (
            <div key={i} className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 transition glow-hover hover:-translate-y-1 hover:border-foreground">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-foreground text-background transition group-hover:bg-[var(--highlight)] group-hover:text-white">
                <it.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-display text-lg">{it.title}</p>
              <p className="text-sm text-muted-foreground">{it.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
