import { getProducts, getProduct, type Product } from "./products";

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

/** Limita à quantidade em estoque (se o produto definir stock). Retorna a qtd efetivamente aplicada. */
function clampToStock(productId: string, desired: number): number {
  const p = getProduct(productId);
  if (!p) return Math.max(0, desired);
  if (typeof p.stock === "number") return Math.max(0, Math.min(desired, p.stock));
  return Math.max(0, desired);
}

/** Adiciona ao carrinho respeitando estoque. Retorna { added, capped } para feedback. */
export function addToCart(productId: string, qty = 1): { added: number; capped: boolean; stock?: number } {
  const items = getCart();
  const i = items.findIndex(x => x.productId === productId);
  const current = i >= 0 ? items[i].qty : 0;
  const desired = current + qty;
  const allowed = clampToStock(productId, desired);
  const p = getProduct(productId);
  const stock = p?.stock;
  if (allowed <= 0) return { added: 0, capped: true, stock };
  if (i >= 0) items[i].qty = allowed; else items.push({ productId, qty: allowed });
  save(items);
  return { added: allowed - current, capped: allowed < desired, stock };
}

export function setQty(productId: string, qty: number) {
  const allowed = clampToStock(productId, Math.max(1, qty));
  if (allowed <= 0) { removeFromCart(productId); return; }
  const items = getCart().map(x => x.productId === productId ? { ...x, qty: allowed } : x);
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

/** Garante que o carrinho não tem itens acima do estoque (chamar ao montar páginas). */
export function reconcileCartWithStock(): boolean {
  const items = getCart();
  let changed = false;
  const next: CartItem[] = [];
  for (const it of items) {
    const p = getProduct(it.productId);
    if (!p) { changed = true; continue; }
    if (typeof p.stock === "number") {
      if (p.stock <= 0) { changed = true; continue; }
      if (it.qty > p.stock) { next.push({ ...it, qty: p.stock }); changed = true; continue; }
    }
    next.push(it);
  }
  if (changed) save(next);
  return changed;
}
