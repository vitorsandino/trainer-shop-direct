export type Category = "booster" | "box" | "colecoes" | "avulsas";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "booster", label: "Booster" },
  { value: "box", label: "Box" },
  { value: "colecoes", label: "Coleções" },
  { value: "avulsas", label: "Cards Avulsas" },
];

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  description: string;
  images: string[];
  stock?: number;
  featured?: boolean;
  banner?: boolean;
  bannerSubtitle?: string;
  bannerBadge?: string;
  createdAt: number;
};

const KEY = "pkmn_products_v2";

const seed: Product[] = [];

export function getProducts(): Product[] {
  if (typeof window === "undefined") return seed;
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }
  try { return JSON.parse(raw); } catch { return seed; }
}

export function saveProducts(list: Product[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function upsertProduct(p: Product) {
  const list = getProducts();
  const i = list.findIndex(x => x.id === p.id);
  if (i >= 0) list[i] = p; else list.unshift(p);
  saveProducts(list);
}

export function deleteProduct(id: string) {
  saveProducts(getProducts().filter(p => p.id !== id));
}

export function getProduct(id: string) {
  return getProducts().find(p => p.id === id);
}

export const WHATSAPP_NUMBER = "5511999999999"; // TODO: substitua pelo seu número
export function whatsappLink(productName: string) {
  const msg = encodeURIComponent(`Olá! Tenho interesse no produto: ${productName}`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

export function formatPrice(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
