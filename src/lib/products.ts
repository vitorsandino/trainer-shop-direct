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
  createdAt: number;
};

const KEY = "pkmn_products_v1";

const seed: Product[] = [
  {
    id: "p1",
    name: "Booster Escarlate & Violeta - 151",
    category: "booster",
    price: 34.9,
    description: "Pacote com 10 cards aleatórios da coleção 151. Reviva os Pokémon originais de Kanto.",
    images: ["https://images.unsplash.com/photo-1647892750571-b29162a23eef?w=800"],
    stock: 50,
    featured: true,
    createdAt: Date.now(),
  },
  {
    id: "p2",
    name: "Elite Trainer Box - Paldea Evolved",
    category: "box",
    price: 349.9,
    description: "Box completa com 9 boosters, dados, contadores e acessórios oficiais.",
    images: ["https://images.unsplash.com/photo-1628968434441-d9c61d7a35dd?w=800"],
    stock: 12,
    featured: true,
    createdAt: Date.now(),
  },
  {
    id: "p3",
    name: "Coleção Especial Charizard ex",
    category: "colecoes",
    price: 219.9,
    description: "Coleção com card promo Charizard ex, 4 boosters e moeda oficial.",
    images: ["https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=800"],
    stock: 8,
    featured: true,
    createdAt: Date.now(),
  },
  {
    id: "p4",
    name: "Pikachu VMAX Rainbow",
    category: "avulsas",
    price: 489.0,
    description: "Card avulso ultra raro Pikachu VMAX em arte secreta rainbow. Estado: NM.",
    images: ["https://images.unsplash.com/photo-1542779283-429940ce8336?w=800"],
    stock: 1,
    featured: true,
    createdAt: Date.now(),
  },
];

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
