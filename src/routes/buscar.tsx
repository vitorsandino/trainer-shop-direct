import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { z } from "zod";
import { getProducts, subscribeProducts, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters, applyFilters, defaultFilters, type FilterState } from "@/components/ProductFilters";

export const Route = createFileRoute("/buscar")({
  validateSearch: z.object({ q: z.string().optional() }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  useEffect(() => {
    const refresh = () => setProducts(getProducts());
    refresh();
    return subscribeProducts(refresh);
  }, []);

  // sincroniza URL após digitar (debounce leve)
  useEffect(() => {
    const t = setTimeout(() => {
      navigate({ to: "/buscar", search: { q: term }, replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [term, navigate]);

  const lower = term.toLowerCase();
  const matched = lower
    ? products.filter(p => p.name.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower))
    : products;
  const list = applyFilters(matched, filters);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--highlight)]">— Busca</p>
        <h1 className="mt-2 font-display text-3xl">Encontre seu produto</h1>
      </div>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {term && (
          <button onClick={() => setTerm("")} className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-muted hover:bg-secondary">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Digite para buscar em tempo real..."
          className="w-full rounded-full border border-border bg-card py-3.5 pl-11 pr-12 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        {list.length} produto(s) {term && `para "${term}"`}
      </p>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <ProductFilters value={filters} onChange={setFilters} showCategories total={list.length} />

        <div>
          {list.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-display text-lg">Nada encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Tente outros termos ou ajuste os filtros.</p>
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
