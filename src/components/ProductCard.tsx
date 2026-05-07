import { Link } from "@tanstack/react-router";
import { type Product, formatPrice, discountPercent, productCategories } from "@/lib/products";
import { addToCart } from "@/lib/cart";
import { ShoppingCart } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product);
  const cats = productCategories(product);
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-[var(--shadow-glow)]">
      <Link to="/produto/$id" params={{ id: product.id }} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
          {off !== null && (
            <span className="absolute left-2 top-2 rounded-md bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground shadow-lg">
              -{off}%
            </span>
          )}
        </div>
        <div className="space-y-2 p-4">
          <p className="line-clamp-1 text-xs uppercase tracking-wider text-secondary">{cats.join(" · ")}</p>
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{product.name}</h3>
          {off !== null ? (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground line-through">De {formatPrice(product.originalPrice!)}</p>
              <p className="font-display text-lg text-primary">Por {formatPrice(product.price)}</p>
            </div>
          ) : (
            <p className="font-display text-lg text-primary">{formatPrice(product.price)}</p>
          )}
        </div>
      </Link>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); addToCart(product.id, 1); }}
        className="absolute inset-x-3 bottom-3 inline-flex translate-y-16 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100"
      >
        <ShoppingCart className="h-3.5 w-3.5" /> Adicionar ao carrinho
      </button>
    </div>
  );
}
