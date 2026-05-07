import { Link } from "@tanstack/react-router";
import { type Product, formatPrice, discountPercent, productCategories } from "@/lib/products";
import { addToCart } from "@/lib/cart";
import { ShoppingCart, ImageOff } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product);
  const cats = productCategories(product);
  const hasImg = product.images && product.images[0];
  const second = product.images?.[1];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-[var(--shadow-card)]">
      <Link to="/produto/$id" params={{ id: product.id }} className="flex flex-1 flex-col">
        {/* Imagem com proporção 4:5, fundo neutro, hover swap */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-muted/60 to-background">
          {hasImg ? (
            <>
              <img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-105 sm:p-5"
              />
              {second && (
                <img
                  src={second}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-contain p-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:p-5"
                />
              )}
              {/* brilho sutil no hover */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </>
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <ImageOff className="h-10 w-10 opacity-40" />
            </div>
          )}

          {off !== null && (
            <span className="absolute left-2 top-2 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold tracking-wide text-destructive-foreground shadow-md sm:left-3 sm:top-3">
              -{off}%
            </span>
          )}
          {product.featured && (
            <span className="absolute right-2 top-2 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold tracking-wide text-secondary-foreground shadow-md sm:right-3 sm:top-3">
              ★ DESTAQUE
            </span>
          )}
          {typeof product.stock === "number" && product.stock <= 0 && (
            <div className="absolute inset-0 grid place-items-center bg-black/50">
              <span className="rounded-md bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">ESGOTADO</span>
            </div>
          )}
          {typeof product.stock === "number" && product.stock > 0 && product.stock <= 3 && (
            <span className="absolute bottom-2 left-2 rounded bg-yellow-500/90 px-2 py-0.5 text-[10px] font-bold text-yellow-950">
              Últimas {product.stock}
            </span>
          )}
        </div>

        {/* Texto */}
        <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
          {cats.length > 0 && (
            <p className="line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground/80">
              {cats.join(" · ")}
            </p>
          )}
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base">
            {product.name}
          </h3>
          <div className="mt-auto pt-2">
            {off !== null ? (
              <div className="leading-tight">
                <p className="text-[11px] text-muted-foreground line-through">{formatPrice(product.originalPrice!)}</p>
                <p className="font-display text-lg text-primary sm:text-xl">{formatPrice(product.price)}</p>
              </div>
            ) : (
              <p className="font-display text-lg text-primary sm:text-xl">{formatPrice(product.price)}</p>
            )}
          </div>
        </div>
      </Link>

      {/* CTA — sempre visível no mobile, surge no hover no desktop */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); addToCart(product.id, 1); }}
        className="m-3 mt-0 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground shadow transition hover:brightness-110 sm:m-4 sm:mt-0 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
        aria-label={`Adicionar ${product.name} ao carrinho`}
      >
        <ShoppingCart className="h-3.5 w-3.5" /> Adicionar
      </button>
    </div>
  );
}
