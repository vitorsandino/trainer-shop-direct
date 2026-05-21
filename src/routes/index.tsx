import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, MessageCircle, ArrowRight, Zap, Instagram, Sparkles } from "lucide-react";
import { CATEGORIES, getProducts, subscribeProducts, type Product, whatsappLink, WHATSAPP_NUMBER } from "@/lib/products";
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
  const featured = products.filter(p => p.featured).slice(0, 6);
  const latest = [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
  const heroFeatured = featured[0] ?? latest[0];
  const sideFeatured = (featured.length > 1 ? featured.slice(1, 4) : latest.slice(0, 3));

  return (
    <div>
      {/* HERO MAGAZINE — manchete + featured cards */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 grid-fade opacity-30" />
        <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-primary/30 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 -top-20 h-96 w-96 rounded-full bg-[var(--highlight)]/20 blur-[120px]" />

        <div className="container relative mx-auto px-4 py-10 md:py-16">
          {/* eyebrow */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/70 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--whatsapp)] shadow-[0_0_8px_var(--whatsapp)]" />
              Pokémon TCG · Catálogo Premium
            </span>
            <a href="https://instagram.com/pandex.store" target="_blank" rel="noopener noreferrer"
              className="hidden items-center gap-2 text-xs font-medium text-muted-foreground hover:text-[var(--highlight)] sm:inline-flex">
              <Instagram className="h-3.5 w-3.5" /> @pandex.store
            </a>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Manchete principal */}
            <div className="space-y-6">
              <h1 className="font-display text-5xl leading-[0.95] text-balance md:text-7xl lg:text-[5.5rem]">
                CATÁLOGO<br/>
                <span className="bg-gradient-to-r from-[var(--highlight)] via-primary to-[var(--highlight)] bg-clip-text text-transparent">
                  POKÉMON TCG
                </span><br/>
                <span className="text-foreground/40">curado pra você.</span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Boosters, ETBs, coleções e cartas avulsas selecionados a dedo.
                Originais lacrados, atendimento humano e compra direta no WhatsApp.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/categoria/$slug" params={{ slug: CATEGORIES[0]?.value ?? "booster" }}
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-bold text-primary-foreground transition hover:scale-[1.02] hover:shadow-[var(--shadow-glow)]"
                >
                  Explorar catálogo
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá Pandex! Quero ver o catálogo.")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-7 py-4 text-sm font-bold text-foreground backdrop-blur transition hover:border-[var(--whatsapp)] hover:text-[var(--whatsapp)]"
                >
                  <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                </a>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[var(--highlight)]" /> Produtos originais</span>
                <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-[var(--highlight)]" /> Postagem rápida</span>
                <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-[var(--highlight)]" /> Atendimento WhatsApp</span>
              </div>
            </div>

            {/* Hero featured product */}
            {heroFeatured ? (
              <Link to="/produto/$id" params={{ id: heroFeatured.id }}
                className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#141432] to-[#1e1e5a]/40 p-6">
                <span className="absolute right-4 top-4 z-10 rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground backdrop-blur">★ Destaque</span>
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#0a0a1a]/60">
                  {heroFeatured.images[0] ? (
                    <img src={heroFeatured.images[0]} alt={heroFeatured.name}
                      className="h-full w-full object-contain p-6 transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <img src={logoMark} alt="Pandex" className="h-32 w-32 object-contain opacity-60" />
                    </div>
                  )}
                </div>
                <p className="mt-4 line-clamp-1 font-display text-xl">{heroFeatured.name}</p>
                <p className="mt-1 text-sm text-[var(--highlight)]">
                  {heroFeatured.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </Link>
            ) : (
              <div className="relative grid place-items-center overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#141432] to-[#1e1e5a]/40 p-12">
                <div className="absolute inset-0 -m-10 rounded-full bg-gradient-to-tr from-primary/30 to-[var(--highlight)]/20 blur-3xl" />
                <img src={logoMark} alt="Pandex Store" className="relative h-56 w-56 object-contain" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick categorias chips */}
      <section className="border-b border-border bg-card/40 backdrop-blur">
        <div className="container mx-auto flex gap-3 overflow-x-auto px-4 py-4">
          {CATEGORIES.map(c => (
            <Link
              key={c.value}
              to="/categoria/$slug"
              params={{ slug: c.value }}
              className="flex-shrink-0 rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Categorias em bento grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--highlight)]">— Categorias</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">Explore o universo</h2>
          </div>
          <Sparkles className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.value}
              to="/categoria/$slug"
              params={{ slug: c.value }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition glow-hover hover:-translate-y-1 hover:border-primary"
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/[0.07] transition group-hover:bg-primary/30" />
              <div className="relative">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">0{i + 1}</span>
                <p className="mt-2 font-display text-lg text-foreground">{c.label}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--highlight)] transition group-hover:gap-2">
                  Ver <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CollectionsShowcase />

      {/* Magazine: Featured grande + cards laterais */}
      {(heroFeatured && sideFeatured.length > 0) && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--highlight)]">— Em destaque</p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">Mais procurados</h2>
            </div>
            <Link to="/categoria/$slug" params={{ slug: CATEGORIES[0]?.value ?? "booster" }} className="hidden text-sm font-semibold text-foreground hover:text-[var(--highlight)] sm:inline-flex">
              Ver tudo →
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {featured[0] && <ProductCard product={featured[0]} />}
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {sideFeatured.slice(0, 3).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Latest grid */}
      {latest.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--highlight)]">— Novidades</p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">Acabou de chegar</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {latest.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Instagram showcase */}
      <section className="container mx-auto px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#141432] via-[#1e1e5a]/50 to-[#141432] p-8 md:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--highlight)]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--highlight)] backdrop-blur">
                <Instagram className="h-3 w-3" /> Instagram
              </span>
              <h3 className="mt-3 font-display text-3xl leading-tight md:text-5xl">
                Acompanhe o drop diário em<br/>
                <a href="https://instagram.com/pandex.store" target="_blank" rel="noopener noreferrer" className="text-[var(--highlight)] hover:underline">
                  @pandex.store
                </a>
              </h3>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                Novidades, lançamentos, unboxings e cartas raras. Veja tudo antes no nosso Instagram.
              </p>
              <a
                href="https://instagram.com/pandex.store"
                target="_blank" rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition hover:scale-105"
              >
                <Instagram className="h-4 w-4" /> Seguir no Instagram
              </a>
            </div>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-2">
              {(latest.slice(0, 4)).map((p, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-background/40">
                  {p.images[0] ? (
                    <img src={p.images[0]} alt="" className="h-full w-full object-contain p-2" loading="lazy" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground"><Instagram className="h-6 w-6" /></div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition hover:opacity-100" />
                </div>
              ))}
              {latest.length === 0 && (
                <>
                  {[0,1,2,3].map(i => (
                    <div key={i} className="aspect-square rounded-xl border border-border bg-background/40" />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Produtos Originais", text: "Lacrados e garantidos." },
            { icon: Zap, title: "Postagem Rápida", text: "Despacho ágil para todo Brasil." },
            { icon: MessageCircle, title: "Atendimento WhatsApp", text: "Resposta direta e humana." },
          ].map((it, i) => (
            <a key={i} href={i === 2 ? whatsappLink("Atendimento") : "#"} target={i === 2 ? "_blank" : undefined} rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground transition group-hover:bg-[var(--highlight)]">
                <it.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-display text-lg">{it.title}</p>
              <p className="text-sm text-muted-foreground">{it.text}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
