export type Category = string;

export type CategoryDef = { value: string; label: string };

const DEFAULT_CATEGORIES: CategoryDef[] = [
  { value: "booster", label: "Booster" },
  { value: "box", label: "Box" },
  { value: "colecoes", label: "Coleções" },
  { value: "avulsas", label: "Cards Avulsas" },
];

const CAT_KEY = "pkmn_categories_v1";
const PRODUCTS_KEY = "pkmn_products_v2";
const COLLECTIONS_KEY = "pkmn_collections_v1";
const ANALYTICS_KEY = "pkmn_analytics_v1";

export function getCategories(): CategoryDef[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  const raw = localStorage.getItem(CAT_KEY);
  if (!raw) return DEFAULT_CATEGORIES; // não semeia — evita sobrescrever a nuvem
  try { return JSON.parse(raw); } catch { return DEFAULT_CATEGORIES; }
}

const catListeners = new Set<() => void>();
export function subscribeCategories(cb: () => void) {
  catListeners.add(cb);
  return () => {
    catListeners.delete(cb);
  };
}
if (typeof window !== "undefined") {
  window.addEventListener("cloud-sync-key", ((event: Event) => {
    const key = (event as CustomEvent<{ key?: string }>).detail?.key;
    if (key === CAT_KEY) catListeners.forEach((cb) => cb());
    if (key === COLLECTIONS_KEY) collListeners.forEach((cb) => cb());
    if (key === PRODUCTS_KEY) productListeners.forEach((cb) => cb());
    if (key === ANALYTICS_KEY) analyticsListeners.forEach((cb) => cb());
  }) as EventListener);
}
export function saveCategories(list: CategoryDef[]) {
  localStorage.setItem(CAT_KEY, JSON.stringify(list));
  catListeners.forEach(cb => cb());
}

// Backwards compatibility — getter-style array (re-reads each access)
export const CATEGORIES: CategoryDef[] = new Proxy([] as CategoryDef[], {
  get(_t, prop) {
    const list = typeof window !== "undefined" ? getCategories() : DEFAULT_CATEGORIES;
    // @ts-ignore
    return list[prop];
  },
}) as unknown as CategoryDef[];

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export type Product = {
  id: string;
  name: string;
  category: Category; // legacy — categoria principal (compat)
  categories?: Category[]; // múltiplas categorias
  collection?: string; // slug da coleção (ex: "escarlate-violeta")
  price: number;
  originalPrice?: number; // preço "de" (antes do desconto)
  description: string;
  images: string[];
  stock?: number;
  featured?: boolean;
  banner?: boolean;
  bannerSubtitle?: string;
  bannerBadge?: string;
  createdAt: number;
};

// ---- Coleções (TCG sets) ----
export type CollectionDef = { value: string; label: string };

const COLL_KEY = "pkmn_collections_v1";
const DEFAULT_COLLECTIONS: CollectionDef[] = [
  { value: "escarlate-violeta", label: "Escarlate & Violeta" },
  { value: "151", label: "151" },
  { value: "paldea-evolved", label: "Paldea Evoluída" },
];

export function getCollections(): CollectionDef[] {
  if (typeof window === "undefined") return DEFAULT_COLLECTIONS;
  const raw = localStorage.getItem(COLL_KEY);
  if (!raw) return DEFAULT_COLLECTIONS; // não semeia
  try { return JSON.parse(raw); } catch { return DEFAULT_COLLECTIONS; }
}
const collListeners = new Set<() => void>();
export function subscribeCollections(cb: () => void) {
  collListeners.add(cb);
  return () => {
    collListeners.delete(cb);
  };
}
export function saveCollections(list: CollectionDef[]) {
  localStorage.setItem(COLL_KEY, JSON.stringify(list));
  collListeners.forEach(cb => cb());
}

/** Retorna todas as categorias do produto (compat com category singular). */
export function productCategories(p: Product): Category[] {
  if (p.categories && p.categories.length > 0) return p.categories;
  return p.category ? [p.category] : [];
}

/** Retorna o % de desconto se houver originalPrice válido, senão null. */
export function discountPercent(p: Pick<Product, "price" | "originalPrice">): number | null {
  if (!p.originalPrice || p.originalPrice <= p.price) return null;
  return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
}

const KEY = PRODUCTS_KEY;
const productListeners = new Set<() => void>();

export function subscribeProducts(cb: () => void) {
  productListeners.add(cb);
  return () => {
    productListeners.delete(cb);
  };
}

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
  productListeners.forEach((cb) => cb());
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

export const WHATSAPP_NUMBER = "5519987601686";
export function whatsappLink(productName: string) {
  const msg = encodeURIComponent(`Olá! Tenho interesse no produto: ${productName}`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

export function formatPrice(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ---- Analytics (local) ----
type AnalyticsData = {
  visits: number;
  pageViews: Record<string, number>;
  productViews: Record<string, number>;
  productClicks: Record<string, number>;
  daily: Record<string, number>; // YYYY-MM-DD -> visits
  firstVisit: number;
};

function defaultAnalytics(): AnalyticsData {
  return { visits: 0, pageViews: {}, productViews: {}, productClicks: {}, daily: {}, firstVisit: Date.now() };
}

export function getAnalytics(): AnalyticsData {
  if (typeof window === "undefined") return defaultAnalytics();
  const raw = localStorage.getItem(ANALYTICS_KEY);
  if (!raw) { const d = defaultAnalytics(); localStorage.setItem(ANALYTICS_KEY, JSON.stringify(d)); return d; }
  try { return { ...defaultAnalytics(), ...JSON.parse(raw) }; } catch { return defaultAnalytics(); }
}

function saveAnalytics(d: AnalyticsData) {
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(d));
  analyticsListeners.forEach((cb) => cb());
}

const analyticsListeners = new Set<() => void>();
export function subscribeAnalytics(cb: () => void) {
  analyticsListeners.add(cb);
  return () => {
    analyticsListeners.delete(cb);
  };
}

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  const d = getAnalytics();
  d.visits += 1;
  d.pageViews[path] = (d.pageViews[path] || 0) + 1;
  const day = new Date().toISOString().slice(0, 10);
  d.daily[day] = (d.daily[day] || 0) + 1;
  saveAnalytics(d);
}

export function trackProductView(id: string) {
  const d = getAnalytics();
  d.productViews[id] = (d.productViews[id] || 0) + 1;
  saveAnalytics(d);
}

export function trackProductClick(id: string) {
  const d = getAnalytics();
  d.productClicks[id] = (d.productClicks[id] || 0) + 1;
  saveAnalytics(d);
}

export function resetAnalytics() {
  saveAnalytics(defaultAnalytics());
}
