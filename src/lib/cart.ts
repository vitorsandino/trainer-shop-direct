import { getProducts, type Product } from "./products";

export type CartItem = { productId: string; qty: number };

const KEY = "pkmn_cart_v1";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach(cb => cb());
}

const listeners = new Set<() => void>();
export function subscribeCart(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }

export function addToCart(productId: string, qty = 1) {
  const items = getCart();
  const i = items.findIndex(x => x.productId === productId);
  if (i >= 0) items[i].qty += qty; else items.push({ productId, qty });
  save(items);
}
export function setQty(productId: string, qty: number) {
  const items = getCart().map(x => x.productId === productId ? { ...x, qty: Math.max(1, qty) } : x);
  save(items);
}
export function removeFromCart(productId: string) {
  save(getCart().filter(x => x.productId !== productId));
}
export function clearCart() { save([]); }

export function cartCount(): number {
  return getCart().reduce((s, x) => s + x.qty, 0);
}

export type CartLine = { product: Product; qty: number; subtotal: number };
export function getCartLines(): { lines: CartLine[]; total: number } {
  const products = getProducts();
  const lines: CartLine[] = [];
  let total = 0;
  for (const it of getCart()) {
    const product = products.find(p => p.id === it.productId);
    if (!product) continue;
    const subtotal = product.price * it.qty;
    total += subtotal;
    lines.push({ product, qty: it.qty, subtotal });
  }
  return { lines, total };
}
