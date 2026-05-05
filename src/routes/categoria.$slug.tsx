import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CATEGORIES, type Category, getProducts, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/categoria/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const cat = CATEGORIES.find(c => c.value === slug);
  if (!cat) throw notFound();

  const [products, setProducts] = useState<Product[]>([]);
  const [sort, setSort] = useState<"recent" | "asc" | "desc">("recent");
  useEffect(() => setProducts(getProducts()), []);

  const list = products
    .filter(p => p.category === (slug as Category))
    .sort((a, b) =>
      sort === "asc" ? a.price - b.price : sort === "desc" ? b.price - a.price : b.createdAt - a.createdAt
    );

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-widest text-secondary">Categoria</p>
          <h1 className="font-display text-3xl">{cat.label}</h1>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "recent" | "asc" | "desc")}
          className="rounded-md border border-border bg-input px-3 py-2 text-sm"
        >
          <option value="recent">Mais recentes</option>
          <option value="asc">Menor preço</option>
          <option value="desc">Maior preço</option>
        </select>
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Nenhum produto nesta categoria ainda.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
