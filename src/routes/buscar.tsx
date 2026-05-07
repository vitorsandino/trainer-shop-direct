import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  useEffect(() => {
    const refresh = () => setProducts(getProducts());
    refresh();
    return subscribeProducts(refresh);
  }, []);

  const term = q.toLowerCase();
  const matched = products.filter(p =>
    p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
  );
  const list = applyFilters(matched, filters);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-2xl">Resultados para "{q}"</h1>
      <p className="mb-6 text-sm text-muted-foreground">{list.length} produto(s) encontrado(s)</p>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <ProductFilters value={filters} onChange={setFilters} showCategories total={list.length} />

        <div>
          {list.length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">Nada encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {list.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
