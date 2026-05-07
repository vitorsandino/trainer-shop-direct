import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-widest text-secondary">Categoria</p>
        <h1 className="font-display text-3xl">{cat.label}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <ProductFilters value={filters} onChange={setFilters} total={list.length} />

        <div>
          {list.length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
              Nenhum produto encontrado com esses filtros.
            </p>
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
