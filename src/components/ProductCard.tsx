import { Link } from "@tanstack/react-router";
import { type Product, formatPrice, whatsappLink } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-[var(--shadow-glow)]">
      <Link to="/produto/$id" params={{ id: product.id }} className="block">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        </div>
        <div className="space-y-2 p-4">
          <p className="text-xs uppercase tracking-wider text-secondary">{product.category}</p>
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{product.name}</h3>
          <p className="font-display text-lg text-primary">{formatPrice(product.price)}</p>
        </div>
      </Link>
      <a
        href={whatsappLink(product.name)}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-x-3 bottom-3 translate-y-16 rounded-md bg-whatsapp px-3 py-2 text-center text-xs font-bold text-whatsapp-foreground opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"
      >
        Comprar via WhatsApp
      </a>
    </div>
  );
}
