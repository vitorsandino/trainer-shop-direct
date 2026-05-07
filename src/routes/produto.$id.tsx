import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { getProduct, type Product, formatPrice, whatsappLink, CATEGORIES, trackProductView, trackProductClick, productCategories, discountPercent } from "@/lib/products";

export const Route = createFileRoute("/produto/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    const p = getProduct(id);
    setProduct(p ?? null);
    if (p) trackProductView(p.id);
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

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <Link to="/" className="mb-4 inline-block text-sm text-muted-foreground hover:text-secondary">← Voltar</Link>
      <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
        <div>
          <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card">
            {hasImages && (
              <>
                <img
                  src={product.images[active]}
                  alt={product.name}
                  className="h-full w-full cursor-zoom-in object-cover"
                  onClick={() => setLightbox(true)}
                />
                <button
                  onClick={() => setLightbox(true)}
                  aria-label="Ampliar"
                  className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                {product.images.length > 1 && (
                  <>
                    <button onClick={prev} aria-label="Anterior" className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={next} aria-label="Próxima" className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white">
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
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 sm:h-20 sm:w-20 ${i === active ? "border-primary" : "border-border"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 md:space-y-5">
          <p className="text-xs uppercase tracking-widest text-secondary">{catLabels}</p>
          <h1 className="font-display text-2xl md:text-4xl">{product.name}</h1>
          {off !== null ? (
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <p className="text-lg text-muted-foreground line-through md:text-xl">De {formatPrice(product.originalPrice!)}</p>
                <span className="rounded-md bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">-{off}% OFF</span>
              </div>
              <p className="font-display text-3xl text-primary md:text-4xl">Por {formatPrice(product.price)}</p>
              <p className="text-sm font-semibold text-primary">Você economiza {formatPrice(product.originalPrice! - product.price)}</p>
            </div>
          ) : (
            <p className="font-display text-3xl text-primary md:text-4xl">{formatPrice(product.price)}</p>
          )}
          {product.stock !== undefined && (
            <p className="text-sm text-muted-foreground">
              {product.stock > 0 ? `${product.stock} em estoque` : "Esgotado"}
            </p>
          )}
          <div className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {product.description}
          </div>
          <a
            href={whatsappLink(product.name)}
            target="_blank" rel="noopener noreferrer"
            onClick={() => trackProductClick(product.id)}
            className="block w-full rounded-lg bg-whatsapp py-4 text-center text-lg font-bold text-whatsapp-foreground shadow-lg transition hover:brightness-110"
          >
            Comprar via WhatsApp
          </a>
          <p className="text-center text-xs text-muted-foreground">
            Mensagem automática: "Olá! Tenho interesse no produto: {product.name}"
          </p>
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
