import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getProduct, type Product, formatPrice, whatsappLink, CATEGORIES } from "@/lib/products";

export const Route = createFileRoute("/produto/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const p = getProduct(id);
    setProduct(p ?? null);
  }, [id]);

  if (product === undefined) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Carregando...</div>;
  if (product === null) throw notFound();

  const catLabel = CATEGORIES.find(c => c.value === product.category)?.label;

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-secondary">← Voltar</Link>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-card">
            <img src={product.images[active]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 ${i === active ? "border-primary" : "border-border"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <p className="text-xs uppercase tracking-widest text-secondary">{catLabel}</p>
          <h1 className="font-display text-3xl md:text-4xl">{product.name}</h1>
          <p className="font-display text-4xl text-primary">{formatPrice(product.price)}</p>
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
            className="block w-full rounded-lg bg-whatsapp py-4 text-center text-lg font-bold text-whatsapp-foreground shadow-lg transition hover:brightness-110"
          >
            Comprar via WhatsApp
          </a>
          <p className="text-center text-xs text-muted-foreground">
            Mensagem automática: "Olá! Tenho interesse no produto: {product.name}"
          </p>
        </div>
      </div>
    </div>
  );
}
