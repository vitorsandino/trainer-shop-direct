import { CATEGORIES, type Category, type Product, productCategories, getCollections, subscribeCollections, type CollectionDef } from "@/lib/products";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type FilterState = {
  sort: "recent" | "asc" | "desc" | "name";
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  categories: Category[];
  collections: string[];
};

export const defaultFilters: FilterState = {
  sort: "recent",
  minPrice: "",
  maxPrice: "",
  inStock: false,
  categories: [],
  collections: [],
};

const PRICE_RANGES: { label: string; min: string; max: string }[] = [
  { label: "Até R$50", min: "", max: "50" },
  { label: "R$50–150", min: "50", max: "150" },
  { label: "R$150–300", min: "150", max: "300" },
  { label: "R$300–500", min: "300", max: "500" },
  { label: "Acima R$500", min: "500", max: "" },
];

export function applyFilters(products: Product[], f: FilterState, opts?: { lockedCategory?: Category }) {
  const min = f.minPrice ? parseFloat(f.minPrice) : -Infinity;
  const max = f.maxPrice ? parseFloat(f.maxPrice) : Infinity;
  return products
    .filter(p => (opts?.lockedCategory ? productCategories(p).includes(opts.lockedCategory) : true))
    .filter(p => (f.categories.length ? productCategories(p).some(c => f.categories.includes(c)) : true))
    .filter(p => (f.collections.length ? (p.collection ? f.collections.includes(p.collection) : false) : true))
    .filter(p => p.price >= min && p.price <= max)
    .filter(p => (f.inStock ? (p.stock ?? 0) > 0 : true))
    .sort((a, b) => {
      switch (f.sort) {
        case "asc": return a.price - b.price;
        case "desc": return b.price - a.price;
        case "name": return a.name.localeCompare(b.name);
        default: return b.createdAt - a.createdAt;
      }
    });
}

type Props = {
  value: FilterState;
  onChange: (f: FilterState) => void;
  showCategories?: boolean;
  total: number;
};

export function ProductFilters({ value, onChange, showCategories, total }: Props) {
  const [openMobile, setOpenMobile] = useState(false);
  const [collections, setCollections] = useState<CollectionDef[]>([]);
  useEffect(() => {
    setCollections(getCollections());
    const unsub = subscribeCollections(() => setCollections(getCollections()));
    return () => { unsub(); };
  }, []);
  const activeCount = useMemo(() => {
    let n = 0;
    if (value.minPrice) n++;
    if (value.maxPrice) n++;
    if (value.inStock) n++;
    n += value.categories.length;
    n += value.collections.length;
    return n;
  }, [value]);

  const toggleCat = (c: Category) => {
    onChange({
      ...value,
      categories: value.categories.includes(c)
        ? value.categories.filter(x => x !== c)
        : [...value.categories, c],
    });
  };
  const toggleColl = (c: string) => {
    onChange({
      ...value,
      collections: value.collections.includes(c)
        ? value.collections.filter(x => x !== c)
        : [...value.collections, c],
    });
  };

  const reset = () => onChange(defaultFilters);

  const Body = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-secondary">Ordenar</h3>
        <select
          value={value.sort}
          onChange={(e) => onChange({ ...value, sort: e.target.value as FilterState["sort"] })}
          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
        >
          <option value="recent">Mais recentes</option>
          <option value="asc">Menor preço</option>
          <option value="desc">Maior preço</option>
          <option value="name">Nome (A-Z)</option>
        </select>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-secondary">Preço (R$)</h3>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {PRICE_RANGES.map(r => {
            const active = value.minPrice === r.min && value.maxPrice === r.max;
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => onChange({ ...value, minPrice: r.min, maxPrice: r.max })}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${active ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-secondary"}`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number" placeholder="Min" value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number" placeholder="Max" value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox" checked={value.inStock}
            onChange={(e) => onChange({ ...value, inStock: e.target.checked })}
          />
          Apenas em estoque
        </label>
      </div>

      {showCategories && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-secondary">Categorias</h3>
          <div className="space-y-1.5">
            {CATEGORIES.map(c => (
              <label key={c.value} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.categories.includes(c.value)}
                  onChange={() => toggleCat(c.value)}
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {collections.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-secondary">Coleção</h3>
          <div className="space-y-1.5">
            {collections.map(c => (
              <label key={c.value} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.collections.includes(c.value)}
                  onChange={() => toggleColl(c.value)}
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {activeCount > 0 && (
        <button onClick={reset} className="w-full rounded-md border border-border py-2 text-sm hover:bg-card">
          Limpar filtros ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <p className="text-sm text-muted-foreground">{total} produto(s)</p>
        <button
          onClick={() => setOpenMobile(true)}
          className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filtros {activeCount > 0 && `(${activeCount})`}
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden h-fit rounded-lg border border-border bg-card p-5 lg:sticky lg:top-20 lg:block">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg">Filtros</h2>
          <span className="text-xs text-muted-foreground">{total} itens</span>
        </div>
        {Body}
      </aside>

      {/* Mobile drawer */}
      {openMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden" onClick={() => setOpenMobile(false)}>
          <div className="ml-auto h-full w-80 max-w-full overflow-y-auto bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg">Filtros</h2>
              <button onClick={() => setOpenMobile(false)}><X className="h-5 w-5" /></button>
            </div>
            {Body}
          </div>
        </div>
      )}
    </>
  );
}
