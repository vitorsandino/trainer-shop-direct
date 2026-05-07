export type OrderStatus =
  | "pendente"
  | "pago"
  | "preparacao"
  | "enviado"
  | "entregue"
  | "cancelado";

export const ORDER_STATUSES: { value: OrderStatus; label: string; color: string }[] = [
  { value: "pendente", label: "Pendente", color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" },
  { value: "pago", label: "Pago", color: "bg-blue-500/20 text-blue-700 dark:text-blue-300" },
  { value: "preparacao", label: "Em preparação", color: "bg-purple-500/20 text-purple-700 dark:text-purple-300" },
  { value: "enviado", label: "Enviado", color: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300" },
  { value: "entregue", label: "Entregue", color: "bg-green-500/20 text-green-700 dark:text-green-300" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-500/20 text-red-700 dark:text-red-300" },
];

export function statusLabel(s: OrderStatus) { return ORDER_STATUSES.find(x => x.value === s)?.label ?? s; }
export function statusColor(s: OrderStatus) { return ORDER_STATUSES.find(x => x.value === s)?.color ?? ""; }

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
};

export type OrderAddress = {
  fullName: string;
  phone: string;
  zip: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  notes?: string;
};

export type OrderHistoryEntry = { at: number; status: OrderStatus; note?: string };

export type Order = {
  id: string;
  code: string; // human-friendly
  userId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  address: OrderAddress;
  trackingCode?: string;
  history: OrderHistoryEntry[];
  createdAt: number;
  updatedAt: number;
};

const KEY = "pkmn_orders_v1";

export function getOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(list: Order[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  listeners.forEach(cb => cb());
}
const listeners = new Set<() => void>();
export function subscribeOrders(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }

export function createOrder(o: Omit<Order, "id" | "code" | "status" | "history" | "createdAt" | "updatedAt">): Order {
  const now = Date.now();
  const order: Order = {
    ...o,
    id: crypto.randomUUID(),
    code: "PDX-" + now.toString(36).toUpperCase().slice(-6),
    status: "pendente",
    history: [{ at: now, status: "pendente", note: "Pedido criado" }],
    createdAt: now,
    updatedAt: now,
  };
  save([order, ...getOrders()]);
  return order;
}

export function updateOrderStatus(id: string, status: OrderStatus, note?: string) {
  const list = getOrders().map(o => {
    if (o.id !== id) return o;
    return {
      ...o,
      status,
      updatedAt: Date.now(),
      history: [...o.history, { at: Date.now(), status, note }],
    };
  });
  save(list);
}

export function setTrackingCode(id: string, code: string) {
  save(getOrders().map(o => o.id === id ? { ...o, trackingCode: code, updatedAt: Date.now() } : o));
}

export function getOrdersByUser(userId: string): Order[] {
  return getOrders().filter(o => o.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
}

export function getOrder(id: string): Order | undefined {
  return getOrders().find(o => o.id === id);
}
