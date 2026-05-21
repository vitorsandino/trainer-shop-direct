import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, getProducts, subscribeProducts, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/pokemon")({
  component: PokemonPage,
  head: () => ({
    meta: [
      { title: "Pokémon TCG · Pandex Store" },
      { name: "description", content: "Catálogo completo de Pokémon TCG: boosters, ETBs, boxes, coleções e cartas avulsas originais lacradas. Compra direta no WhatsApp." },
    ],
  }),
});

function PokemonPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [active, setActive] = useState<string>("todos");

  useEffect(() => {
    const refresh = () => setProducts(getProducts());
    refresh();
    return subscribeProducts(refresh);
  }, []);

  const filtered = useMemo(() => {
    if (active === "todos") return products;
    return products.filter(p => p.category === active || p.categories?.includes(active));
  }, [products, active]);

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-br from-[#eef0ff] via-white to-[#f5f6fb]">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" /> Pokémon TCG
          </span>
          <h1 className="mt-3 font-display text-4xl text-foreground md:text-5xl">Pokémon TCG</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Boosters, ETBs, boxes, coleções e cartas avulsas. Produtos originais lacrados, com atendimento direto no WhatsApp.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-white">
        <div className="container mx-auto flex gap-2 overflow-x-auto px-4 py-4">
          <button onClick={() => setActive("todos")}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${active === "todos" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-foreground hover:border-primary hover:text-primary"}`}>
            Todos
          </button>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setActive(c.value)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${active === c.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-foreground hover:border-primary hover:text-primary"}`}>
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
            <p className="text-muted-foreground">Nenhum produto disponível nesta categoria.</p>
            <Link to="/" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">Voltar à página inicial</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
