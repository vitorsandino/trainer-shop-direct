import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { getCartLines, removeFromCart, setQty, subscribeCart, reconcileCartWithStock } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/carrinho")({
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(() => getCartLines());
  useEffect(() => {
    reconcileCartWithStock();
    setData(getCartLines());
    return subscribeCart(() => setData(getCartLines()));
  }, []);

  if (data.lines.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="font-display text-2xl">Seu carrinho está vazio</h1>
        <p className="mt-2 text-sm text-muted-foreground">Adicione produtos para continuar.</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-6 py-3 font-bold text-primary-foreground">Ver produtos</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 font-display text-2xl md:text-3xl">Seu carrinho</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {data.lines.map(({ product, qty, subtotal }) => (
            <div key={product.id} className="flex gap-3 rounded-lg border border-border bg-card p-3">
              {product.images[0] && <img src={product.images[0]} alt="" className="h-20 w-20 rounded object-cover" />}
              <div className="min-w-0 flex-1">
                <Link to="/produto/$id" params={{ id: product.id }} className="line-clamp-2 font-semibold hover:text-primary">{product.name}</Link>
                <p className="text-sm text-primary">{formatPrice(product.price)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => setQty(product.id, qty - 1)} className="grid h-8 w-8 place-items-center rounded border border-border"><Minus className="h-3 w-3" /></button>
                  <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                  <button onClick={() => setQty(product.id, qty + 1)} className="grid h-8 w-8 place-items-center rounded border border-border"><Plus className="h-3 w-3" /></button>
                  <button onClick={() => removeFromCart(product.id)} className="ml-auto rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="text-right text-sm font-bold">{formatPrice(subtotal)}</div>
            </div>
          ))}
        </div>
        <aside className="h-fit rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 font-display text-lg">Resumo</h2>
          <div className="flex justify-between border-b border-border pb-3 text-sm">
            <span>Subtotal</span><span>{formatPrice(data.total)}</span>
          </div>
          <div className="mb-4 flex justify-between pt-3 font-display text-xl">
            <span>Total</span><span className="text-primary">{formatPrice(data.total)}</span>
          </div>
          <button onClick={() => navigate({ to: "/checkout" })} className="w-full rounded-md bg-primary py-3 font-bold text-primary-foreground hover:opacity-90">
            Finalizar compra
          </button>
        </aside>
      </div>
    </div>
  );
}
