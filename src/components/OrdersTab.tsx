import { useEffect, useMemo, useState } from "react";
import { getOrders, updateOrderStatus, setTrackingCode, type Order, type OrderStatus, ORDER_STATUSES, statusColor, statusLabel, subscribeOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { Package, Search, X } from "lucide-react";

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    const refresh = () => setOrders(getOrders());
    refresh();
    return subscribeOrders(refresh);
  }, []);

  // mantém detalhe sincronizado
  useEffect(() => {
    if (!selected) return;
    const fresh = orders.find(o => o.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [orders, selected]);

  const filtered = useMemo(() => {
    return orders
      .filter(o => statusFilter === "all" ? true : o.status === statusFilter)
      .filter(o => {
        if (!q.trim()) return true;
        const s = q.toLowerCase();
        return o.code.toLowerCase().includes(s) || o.userName.toLowerCase().includes(s) || o.userEmail.toLowerCase().includes(s);
      });
  }, [orders, q, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    ORDER_STATUSES.forEach(s => { c[s.value] = orders.filter(o => o.status === s.value).length; });
    return c;
  }, [orders]);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total" value={counts.all} />
        <Stat label="Pendentes" value={counts.pendente ?? 0} />
        <Stat label="Em preparação" value={counts.preparacao ?? 0} />
        <Stat label="Enviados" value={counts.enviado ?? 0} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código, cliente ou email..."
            className="w-full rounded-md border border-border bg-input py-2 pl-9 pr-3 text-sm outline-none focus:border-primary" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-md border border-border bg-input px-3 py-2 text-sm">
          <option value="all">Todos status</option>
          {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/50 text-left">
              <tr>
                <th className="p-3 font-semibold">Pedido</th>
                <th className="p-3 font-semibold">Cliente</th>
                <th className="p-3 font-semibold">Total</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Data</th>
                <th className="p-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-t border-border hover:bg-background/40">
                  <td className="p-3 font-mono text-xs">{o.code}</td>
                  <td className="p-3">
                    <p className="font-medium">{o.userName}</p>
                    <p className="text-xs text-muted-foreground">{o.userEmail}</p>
                  </td>
                  <td className="p-3 font-semibold text-primary">{formatPrice(o.total)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColor(o.status)}`}>{statusLabel(o.status)}</span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("pt-BR")}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setSelected(o)} className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Gerenciar</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">
                  <Package className="mx-auto mb-2 h-8 w-8" /> Nenhum pedido encontrado
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <OrderDrawer order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-2xl">{value}</p>
    </div>
  );
}

function OrderDrawer({ order, onClose }: { order: Order; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [tracking, setTracking] = useState(order.trackingCode ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl">Pedido #{order.code}</h2>
            <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("pt-BR")}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-background"><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-4 rounded-md border border-border bg-background/40 p-3 text-sm">
          <p className="font-semibold">{order.userName}</p>
          <p className="text-muted-foreground">{order.userEmail}</p>
          <p className="text-muted-foreground">{order.address.phone}</p>
          <p className="mt-2">{order.address.street}, {order.address.number}{order.address.complement ? ` — ${order.address.complement}` : ""}</p>
          <p>{order.address.district} — {order.address.city}/{order.address.state} · CEP {order.address.zip}</p>
          {order.address.notes && <p className="mt-2 rounded bg-card p-2 text-xs">Obs: {order.address.notes}</p>}
        </div>

        <div className="mb-4">
          <h3 className="mb-2 font-display">Itens</h3>
          <ul className="divide-y divide-border rounded-md border border-border">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-center gap-3 p-2">
                {it.image && <img src={it.image} alt="" className="h-12 w-12 rounded object-cover" />}
                <div className="flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{it.qty}x {formatPrice(it.price)}</p>
                </div>
                <span className="text-sm font-bold">{formatPrice(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between pt-2 font-display text-lg">
            <span>Total</span><span className="text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="mb-4 rounded-md border border-border p-3">
          <h3 className="mb-2 font-display">Atualizar status</h3>
          <p className="mb-2 text-xs text-muted-foreground">Atual: <span className={`rounded px-2 py-0.5 ${statusColor(order.status)}`}>{statusLabel(order.status)}</span></p>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)"
            className="mb-2 w-full rounded-md border border-border bg-input px-3 py-2 text-sm" />
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUSES.map(s => (
              <button key={s.value} disabled={s.value === order.status}
                onClick={() => { updateOrderStatus(order.id, s.value, note || undefined); setNote(""); }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${s.color}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 rounded-md border border-border p-3">
          <h3 className="mb-2 font-display">Código de rastreio</h3>
          <div className="flex gap-2">
            <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Ex: BR123456789BR"
              className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm" />
            <button onClick={() => setTrackingCode(order.id, tracking.trim())}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Salvar</button>
          </div>
        </div>

        <div className="rounded-md border border-border p-3">
          <h3 className="mb-2 font-display">Histórico</h3>
          <ol className="space-y-2">
            {[...order.history].reverse().map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className={`mt-0.5 rounded px-2 py-0.5 text-[11px] font-semibold ${statusColor(h.status)}`}>{statusLabel(h.status)}</span>
                <div className="flex-1">
                  {h.note && <p>{h.note}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(h.at).toLocaleString("pt-BR")}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
