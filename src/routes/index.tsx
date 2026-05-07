import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, ShieldCheck, MessageCircle, Sparkles } from "lucide-react";
import { CATEGORIES, getProducts, type Product, whatsappLink } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { CollectionsShowcase } from "@/components/CollectionsShowcase";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => setProducts(getProducts()), []);
  const featured = products.filter(p => p.featured).slice(0, 8);
  const latest = [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

  return (
    <div>
      {/* Categorias quick-nav — primeira coisa que o cliente vê */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto flex gap-3 overflow-x-auto px-4 py-4">
          {CATEGORIES.map(c => (
            <Link
              key={c.value}
              to="/categoria/$slug"
              params={{ slug: c.value }}
              className="flex-shrink-0 rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Hero compacto, sem imagem grande */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/15">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/25 px-3 py-1 text-xs font-bold uppercase tracking-widest text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Pokémon TCG · Atacado e varejo
            </span>
            <h1 className="font-display text-3xl leading-[1.05] text-foreground md:text-5xl">
              A loja do <span className="text-primary">panda</span> mais fofo do <span className="text-secondary">TCG</span>
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
              Boosters, Elite Trainer Boxes, coleções e cards avulsos. Preço justo, envio rápido e atendimento humano.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/categoria/$slug" params={{ slug: CATEGORIES[0]?.value ?? "booster" }} className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg transition hover:brightness-110">
                Ver catálogo
              </Link>
              <a href={whatsappLink("Catálogo Pandex Store")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold transition hover:border-primary">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Lacrados originais</span>
              <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-primary" /> Envio para todo Brasil</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categorias em grid visual */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Categorias</p>
          <h2 className="font-display text-2xl md:text-3xl">Explore por tipo</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORIES.map(c => (
            <Link
              key={c.value}
              to="/categoria/$slug"
              params={{ slug: c.value }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-secondary/10 p-6 transition hover:-translate-y-1 hover:border-primary hover:shadow-[var(--shadow-glow)]"
            >
              <p className="font-display text-lg text-foreground group-hover:text-primary">{c.label}</p>
              <span className="mt-2 inline-block text-xs font-medium text-muted-foreground">Ver produtos →</span>
            </Link>
          ))}
        </div>
      </section>

      <CollectionsShowcase />

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Em destaque</p>
              <h2 className="font-display text-2xl md:text-3xl">Mais procurados</h2>
            </div>
            <Link to="/categoria/$slug" params={{ slug: CATEGORIES[0]?.value ?? "booster" }} className="text-sm font-semibold text-primary hover:underline">
              Ver tudo →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Latest */}
      {latest.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Novidades</p>
            <h2 className="font-display text-2xl md:text-3xl">Acabou de chegar</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {latest.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Trust strip */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-secondary/10 p-6 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <div><p className="font-display text-base">Envio rápido</p><p className="text-sm text-muted-foreground">Postagem em até 24h.</p></div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div><p className="font-display text-base">100% original</p><p className="text-sm text-muted-foreground">Produtos lacrados e garantidos.</p></div>
          </div>
          <div className="flex items-start gap-3">
            <MessageCircle className="h-6 w-6 text-primary" />
            <div><p className="font-display text-base">Atendimento humano</p><p className="text-sm text-muted-foreground">Tire dúvidas direto no WhatsApp.</p></div>
          </div>
        </div>
      </section>
    </div>
  );
}
