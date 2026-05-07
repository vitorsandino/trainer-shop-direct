import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getProducts, subscribeProducts, type Product, formatPrice } from "@/lib/products";

const GRADIENTS = [
  "from-fuchsia-600 via-purple-700 to-indigo-900",
  "from-emerald-500 via-teal-700 to-slate-900",
  "from-amber-400 via-orange-600 to-rose-900",
  "from-red-600 via-rose-800 to-black",
  "from-yellow-400 via-amber-600 to-red-800",
  "from-sky-500 via-blue-700 to-indigo-900",
];

export function CollectionsShowcase() {
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    const refresh = () => setItems(getProducts().filter((p) => p.banner));
    refresh();
    return subscribeProducts(refresh);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-secondary">Coleções em destaque</p>
          <h2 className="font-display text-2xl md:text-3xl">Selecionados pra você</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {items.map((p, idx) => {
          const gradient = GRADIENTS[idx % GRADIENTS.length];
          const cover = p.images[0];
          return (
            <Link
              key={p.id}
              to="/produto/$id"
              params={{ id: p.id }}
              className={`group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${gradient} transition hover:-translate-y-1 hover:border-secondary hover:shadow-[var(--shadow-glow)]`}
            >
              {cover && (
                <img
                  src={cover}
                  alt={p.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:scale-105 group-hover:opacity-100"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

              {p.bannerBadge && (
                <span className="absolute left-3 top-3 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground shadow">
                  {p.bannerBadge}
                </span>
              )}

              <Sparkles className="absolute right-4 top-4 h-5 w-5 text-white/70" />

              <div className="absolute inset-x-0 bottom-0 p-4">
                {p.bannerSubtitle && (
                  <p className="text-[10px] uppercase tracking-widest text-white/80">{p.bannerSubtitle}</p>
                )}
                <h3 className="mt-1 font-display text-base text-white drop-shadow-lg sm:text-lg md:text-xl line-clamp-2">
                  {p.name}
                </h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-display text-sm text-white">{formatPrice(p.price)}</span>
                  <span className="text-xs text-white/90 underline-offset-4 group-hover:underline">
                    Ver →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
