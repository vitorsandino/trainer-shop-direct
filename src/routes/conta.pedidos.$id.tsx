import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getOrder, type Order, statusColor, statusLabel, subscribeOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/conta/pedidos/$id")({
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const user = useAuth();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    const refresh = () => setOrder(getOrder(id) ?? null);
    refresh();
    return subscribeOrders(refresh);
  }, [id]);

  if (order === undefined) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (order === null) throw notFound();
  if (user === undefined) return <div className="p-8 text-center text-muted-foreground">Carregando conta...</div>;
  if (user && order.userId !== user.id) return <div className="rounded-lg border border-border bg-card p-8 text-center">Pedido não encontrado.</div>;

  return (
    <div className="space-y-4">
      <Link to="/conta/pedidos" className="inline-block text-sm text-muted-foreground hover:text-primary">← Meus pedidos</Link>
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Pedido #{order.code}</h2>
            <p className="text-xs text-muted-foreground">Feito em {new Date(order.createdAt).toLocaleString("pt-BR")}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
        </div>
        {order.trackingCode && (
          <p className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
            Código de rastreio: <span className="font-mono font-bold">{order.trackingCode}</span>
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-3 font-display">Itens</h3>
            <ul className="divide-y divide-border">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  {it.image && <img src={it.image} alt="" className="h-14 w-14 rounded object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{it.name}</p>
                    <p className="text-xs text-muted-foreground">{it.qty}x {formatPrice(it.price)}</p>
                  </div>
                  <p className="text-sm font-bold">{formatPrice(it.price * it.qty)}</p>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-border pt-3 font-display text-lg">
              <span>Total</span><span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-3 font-display">Histórico</h3>
            <ol className="space-y-2">
              {[...order.history].reverse().map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 rounded px-2 py-0.5 text-xs font-semibold ${statusColor(h.status)}`}>{statusLabel(h.status)}</span>
                  <div className="flex-1">
                    {h.note && <p>{h.note}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(h.at).toLocaleString("pt-BR")}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-card p-5 text-sm">
          <h3 className="mb-3 font-display">Endereço de entrega</h3>
          <p className="font-semibold">{order.address.fullName}</p>
          <p className="text-muted-foreground">{order.address.phone}</p>
          <p className="mt-2">{order.address.street}, {order.address.number}{order.address.complement ? ` — ${order.address.complement}` : ""}</p>
          <p>{order.address.district} — {order.address.city}/{order.address.state}</p>
          <p className="text-muted-foreground">CEP {order.address.zip}</p>
          {order.address.notes && <p className="mt-3 rounded bg-background p-2 text-xs">{order.address.notes}</p>}
        </aside>
      </div>
    </div>
  );
}
