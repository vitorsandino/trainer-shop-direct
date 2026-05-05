import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { getProducts, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/buscar")({
  validateSearch: z.object({ q: z.string().optional() }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => setProducts(getProducts()), []);

  const term = q.toLowerCase();
  const list = products.filter(p =>
    p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-2xl">Resultados para "{q}"</h1>
      <p className="mb-6 text-sm text-muted-foreground">{list.length} produto(s) encontrado(s)</p>
      {list.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">Nada encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
