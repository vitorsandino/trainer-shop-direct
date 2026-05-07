import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getOrdersByUser, type Order, statusColor, statusLabel, subscribeOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { Package } from "lucide-react";

export const Route = createFileRoute("/conta/pedidos/")({
  component: MyOrders,
});

function MyOrders() {
  const user = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    if (!user) return;
    const refresh = () => setOrders(getOrdersByUser(user.id));
    refresh();
    return subscribeOrders(refresh);
  }, [user]);
  if (!user) return null;

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center">
        <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="font-display text-xl">Você ainda não tem pedidos</h2>
        <Link to="/" className="mt-4 inline-block rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Começar a comprar</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map(o => (
        <Link key={o.id} to="/conta/pedidos/$id" params={{ id: o.id }}
          className="block rounded-lg border border-border bg-card p-4 transition hover:border-primary">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg">Pedido #{o.code}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("pt-BR")}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(o.status)}`}>{statusLabel(o.status)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">{o.items.reduce((s, i) => s + i.qty, 0)} item(s)</span>
            <span className="font-bold text-primary">{formatPrice(o.total)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
