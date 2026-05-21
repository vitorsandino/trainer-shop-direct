import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, MessageCircle, Instagram, ShieldCheck, Zap, ShoppingCart } from "lucide-react";
import { getProduct, subscribeProducts, type Product, formatPrice, whatsappLink, CATEGORIES, trackProductView, trackProductClick, productCategories, discountPercent } from "@/lib/products";
import { addToCart } from "@/lib/cart";

export const Route = createFileRoute("/produto/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const p = getProduct(id);
      setProduct(p ?? null);
    };
    refresh();
    const unsub = subscribeProducts(refresh);
    const p = getProduct(id);
    if (p) trackProductView(p.id);
    return unsub;
  }, [id]);

  const next = useCallback(() => {
    if (!product) return;
    setActive((a) => (a + 1) % product.images.length);
  }, [product]);
  const prev = useCallback(() => {
    if (!product) return;
    setActive((a) => (a - 1 + product.images.length) % product.images.length);
  }, [product]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, next, prev]);

  if (product === undefined) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Carregando...</div>;
  if (product === null) throw notFound();

  const cats = productCategories(product);
  const catLabels = cats.map(v => CATEGORIES.find(c => c.value === v)?.label ?? v).join(" · ");
  const off = discountPercent(product);
  const hasImages = product.images.length > 0;
  const outOfStock = typeof product.stock === "number" && product.stock <= 0;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link>
        <span>/</span>
        {cats[0] && (
          <>
            <Link to="/categoria/$slug" params={{ slug: cats[0] }} className="hover:text-foreground">
              {CATEGORIES.find(c => c.value === cats[0])?.label ?? cats[0]}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </div>

      <div className="grid gap-6 md:gap-10 lg:grid-cols-2">
        {/* Galeria */}
        <div>
          <div className="group relative aspect-square overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#141432] to-[#0a0a1a]">
            {hasImages && (
              <>
                <img
                  src={product.images[active]}
                  alt={product.name}
                  className="h-full w-full cursor-zoom-in object-contain p-6"
                  onClick={() => setLightbox(true)}
                />
                <button
                  onClick={() => setLightbox(true)}
                  aria-label="Ampliar"
                  className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur transition group-hover:opacity-100"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                {product.images.length > 1 && (
                  <>
                    <button onClick={prev} aria-label="Anterior" className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/70 text-foreground backdrop-blur">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={next} aria-label="Próxima" className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/70 text-foreground backdrop-blur">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 sm:h-20 sm:w-20 ${i === active ? "border-primary" : "border-border"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--highlight)]">{catLabels}</p>
            <h1 className="mt-2 font-display text-3xl leading-tight md:text-4xl">{product.name}</h1>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            {off !== null ? (
              <>
                <div className="flex items-center gap-3">
                  <p className="text-base text-muted-foreground line-through">{formatPrice(product.originalPrice!)}</p>
                  <span className="rounded-md bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">-{off}% OFF</span>
                </div>
                <p className="mt-1 font-display text-4xl text-foreground md:text-5xl">{formatPrice(product.price)}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--whatsapp)]">Você economiza {formatPrice(product.originalPrice! - product.price)}</p>
              </>
            ) : (
              <p className="font-display text-4xl text-foreground md:text-5xl">{formatPrice(product.price)}</p>
            )}
            {product.stock !== undefined && (
              <p className={`mt-3 text-sm font-semibold ${outOfStock ? "text-destructive" : "text-[var(--whatsapp)]"}`}>
                {outOfStock ? "● Esgotado" : `● Em estoque (${product.stock})`}
              </p>
            )}
          </div>

          {/* CTAs WhatsApp first */}
          <div className="space-y-3">
            <a
              href={whatsappLink(product.name)}
              target="_blank" rel="noopener noreferrer"
              onClick={() => trackProductClick(product.id)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--whatsapp)] py-4 text-base font-bold text-[var(--whatsapp-foreground)] shadow-[0_10px_30px_-10px_rgba(37,211,102,0.6)] transition hover:scale-[1.01] hover:brightness-110"
            >
              <MessageCircle className="h-5 w-5" />
              {outOfStock ? "Consultar disponibilidade" : "Comprar no WhatsApp"}
            </a>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://instagram.com/pandex.store"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold transition hover:border-[var(--highlight)] hover:text-[var(--highlight)]"
              >
                <Instagram className="h-4 w-4" /> Ver Instagram
              </a>
              <button
                disabled={outOfStock}
                onClick={() => {
                  const r = addToCart(product.id, 1);
                  trackProductClick(product.id);
                  if (r.capped) alert(`Só temos ${r.stock} em estoque.`);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" /> Adicionar
              </button>
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl border border-border bg-card p-3">
              <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-[var(--highlight)]" />
              <p className="text-muted-foreground">Original lacrado</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <Zap className="mx-auto mb-1 h-4 w-4 text-[var(--highlight)]" />
              <p className="text-muted-foreground">Postagem rápida</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <MessageCircle className="mx-auto mb-1 h-4 w-4 text-[var(--highlight)]" />
              <p className="text-muted-foreground">Atend. humano</p>
            </div>
          </div>

          {/* Descrição */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Descrição</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{product.description}</p>
          </div>
        </div>
      </div>

      {lightbox && hasImages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
          {product.images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Anterior" className="absolute left-2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white md:left-6">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Próxima" className="absolute right-2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white md:right-6">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img
            src={product.images[active]}
            alt={product.name}
            className="max-h-[88vh] max-w-[92vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
            {active + 1} / {product.images.length}
          </div>
        </div>
      )}
    </div>
  );
}
