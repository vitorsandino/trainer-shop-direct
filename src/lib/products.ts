export type Category = string;

export type CategoryDef = { value: string; label: string };

const DEFAULT_CATEGORIES: CategoryDef[] = [
  { value: "booster", label: "Booster" },
  { value: "box", label: "Box" },
  { value: "colecoes", label: "Coleções" },
  { value: "avulsas", label: "Cards Avulsas" },
];

const CAT_KEY = "pkmn_categories_v1";

export function getCategories(): CategoryDef[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  const raw = localStorage.getItem(CAT_KEY);
  if (!raw) {
    localStorage.setItem(CAT_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  }
  try { return JSON.parse(raw); } catch { return DEFAULT_CATEGORIES; }
}

export function saveCategories(list: CategoryDef[]) {
  localStorage.setItem(CAT_KEY, JSON.stringify(list));
}

// Backwards compatibility for components that import CATEGORIES directly
export const CATEGORIES: CategoryDef[] =
  typeof window !== "undefined" ? getCategories() : DEFAULT_CATEGORIES;

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

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

export const WHATSAPP_NUMBER = "5511999999999";
export function whatsappLink(productName: string) {
  const msg = encodeURIComponent(`Olá! Tenho interesse no produto: ${productName}`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

export function formatPrice(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ---- Analytics (local) ----
const ANALYTICS_KEY = "pkmn_analytics_v1";
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
