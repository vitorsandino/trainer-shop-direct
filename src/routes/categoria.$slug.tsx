import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CATEGORIES, type Category, getProducts, subscribeProducts, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters, applyFilters, defaultFilters, type FilterState } from "@/components/ProductFilters";

export const Route = createFileRoute("/categoria/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const cat = CATEGORIES.find(c => c.value === slug);
  if (!cat) throw notFound();

  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  useEffect(() => {
    const refresh = () => setProducts(getProducts());
    refresh();
    return subscribeProducts(refresh);
  }, []);

  const list = applyFilters(products, filters, { lockedCategory: slug as Category });

  return (
    <div className="container mx-auto px-4 py-8 md:py-10">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link>
        <span>/</span>
        <span className="text-foreground">{cat.label}</span>
      </div>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--highlight)]">— Categoria</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">{cat.label}</h1>
        </div>
        <p className="hidden text-sm text-muted-foreground sm:block">{list.length} produto(s)</p>
      </div>

      {/* sub-categorias chips */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map(c => (
          <Link key={c.value} to="/categoria/$slug" params={{ slug: c.value }}
            className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${c.value === slug ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60"}`}>
            {c.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <ProductFilters value={filters} onChange={setFilters} total={list.length} />

        <div>
          {list.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <p className="font-display text-lg">Nenhum produto encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou veja outras categorias.</p>
              <Link to="/" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--highlight)] hover:underline">
                Voltar ao catálogo <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {list.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
