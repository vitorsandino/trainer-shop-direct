import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import hero from "@/assets/hero.jpg";
import { CATEGORIES, getProducts, type Product, whatsappLink } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => setProducts(getProducts()), []);
  const featured = products.filter(p => p.featured).slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" width={1536} height={768} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="container relative mx-auto flex min-h-[70vh] flex-col items-start justify-center gap-6 px-4 py-20">
          <span className="rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-secondary">
            Pokémon TCG · Loja Oficial Não-Oficial
          </span>
          <h1 className="max-w-2xl font-display text-4xl leading-tight md:text-6xl">
            Capture os <span className="text-primary">cards mais raros</span> do universo Pokémon
          </h1>
          <p className="max-w-xl text-base text-muted-foreground md:text-lg">
            Boosters lacrados, Elite Trainer Boxes, coleções especiais e cards avulsas. Atendimento direto via WhatsApp.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={whatsappLink("Catálogo PokéTCG Store")}
              target="_blank" rel="noopener noreferrer"
              className="rounded-md bg-whatsapp px-6 py-3 font-bold text-whatsapp-foreground shadow-lg transition hover:brightness-110"
            >
              Comprar via WhatsApp
            </a>
            <Link to="/categoria/$slug" params={{ slug: "booster" }} className="rounded-md border border-border bg-card/60 px-6 py-3 font-semibold backdrop-blur transition hover:border-primary">
              Ver catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-6 font-display text-2xl">Explore por categoria</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORIES.map(c => (
            <Link
              key={c.value}
              to="/categoria/$slug"
              params={{ slug: c.value }}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition hover:border-secondary hover:shadow-[var(--shadow-glow)]"
            >
              <p className="font-display text-lg group-hover:text-secondary">{c.label}</p>
              <span className="mt-2 inline-block text-sm text-muted-foreground">Ver produtos →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl">Em destaque</h2>
          <Link to="/categoria/$slug" params={{ slug: "booster" }} className="text-sm text-secondary hover:underline">
            Ver tudo →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {featured.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
