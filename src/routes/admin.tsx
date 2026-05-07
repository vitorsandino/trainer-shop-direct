import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  type Category, type Product, type CategoryDef,
  getProducts, upsertProduct, deleteProduct, formatPrice,
  getCategories, saveCategories, slugify, subscribeCategories,
  getAnalytics, resetAnalytics, productCategories, discountPercent,
  getCollections, saveCollections, subscribeCollections, type CollectionDef,
} from "@/lib/products";
import {
  Trash2, Plus, X, Package, Tag, BarChart3, LogOut, Wallet, Layers,
  Image as ImageIcon, Eye, MousePointerClick, TrendingUp, Pencil,
} from "lucide-react";
import { FinanceTab } from "@/components/FinanceTab";

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "s3n4@123";
const AUTH_KEY = "pkmn_admin_auth";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Tab = "products" | "categories" | "collections" | "analytics" | "finance";

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(AUTH_KEY) === "1") setAuthed(true);
  }, []);

  if (!authed) {
    return (
      <div className="container mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl">
          <h1 className="mb-2 font-display text-2xl">Painel Admin</h1>
          <p className="mb-6 text-sm text-muted-foreground">Acesse com suas credenciais.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (user === ADMIN_USER && pwd === ADMIN_PASSWORD) {
                sessionStorage.setItem(AUTH_KEY, "1"); setAuthed(true);
              } else setErr("Usuário ou senha incorretos");
            }}
            className="space-y-3"
          >
            <input type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="Usuário" autoComplete="username"
              className="w-full rounded-md border border-border bg-input px-4 py-3 outline-none focus:border-primary" />
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Senha" autoComplete="current-password"
              className="w-full rounded-md border border-border bg-input px-4 py-3 outline-none focus:border-primary" />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <button className="w-full rounded-md bg-primary py-3 font-bold text-primary-foreground transition hover:opacity-90">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={() => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); }} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("products");

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: "products", label: "Produtos", icon: Package },
    { id: "categories", label: "Categorias", icon: Tag },
    { id: "collections", label: "Coleções", icon: Layers },
    { id: "analytics", label: "Acessos", icon: BarChart3 },
    { id: "finance", label: "Financeiro", icon: Wallet },
  ];

  return (
    <div className="container mx-auto px-4 py-6 lg:py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl">Painel Admin</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua loja</p>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 self-start rounded-md border border-border px-3 py-2 text-sm hover:bg-card sm:self-auto">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <nav className="flex gap-2 overflow-x-auto rounded-lg border border-border bg-card p-2 lg:flex-col lg:overflow-visible">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition lg:w-full lg:justify-start ${
                tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-background hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {tab === "products" && <ProductsTab />}
          {tab === "categories" && <CategoriesTab />}
          {tab === "collections" && <CollectionsTab />}
          {tab === "analytics" && <AnalyticsTab />}
          {tab === "finance" && <FinanceTab />}
        </div>
      </div>
    </div>
  );
}

/* ============================== PRODUCTS ============================== */

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const refresh = () => setProducts(getProducts());
  useEffect(() => { refresh(); }, []);

  const cats = useGetCategories();

  const handleNew = () => {
    setEditing({
      id: crypto.randomUUID(),
      name: "", category: cats[0]?.value ?? "booster", categories: cats[0] ? [cats[0].value] : [],
      price: 0, originalPrice: undefined, description: "",
      images: [], stock: 0, featured: false, banner: false, bannerSubtitle: "", bannerBadge: "", createdAt: Date.now(),
    });
    setOpen(true);
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar produto..."
          className="w-full max-w-sm rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button onClick={handleNew} className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/50">
              <tr className="text-left">
                <th className="p-3 font-semibold">Produto</th>
                <th className="p-3 font-semibold">Categoria</th>
                <th className="p-3 font-semibold">Preço</th>
                <th className="p-3 font-semibold">Estoque</th>
                <th className="p-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t border-border transition hover:bg-background/40">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.images[0]
                        ? <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
                        : <div className="grid h-10 w-10 place-items-center rounded bg-background text-muted-foreground"><ImageIcon className="h-4 w-4" /></div>}
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium">{p.name || "(sem nome)"}</p>
                        <div className="flex gap-1 text-[10px] text-muted-foreground">
                          {p.featured && <span className="rounded bg-secondary/20 px-1 text-secondary">Destaque</span>}
                          {p.banner && <span className="rounded bg-primary/20 px-1 text-primary">Banner</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    <div className="flex flex-wrap gap-1">
                      {productCategories(p).map(v => (
                        <span key={v} className="rounded bg-background px-1.5 py-0.5 text-[10px]">{cats.find(c => c.value === v)?.label ?? v}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 font-semibold">
                    {p.originalPrice && p.originalPrice > p.price ? (
                      <div className="leading-tight">
                        <div className="text-[10px] text-muted-foreground line-through">{formatPrice(p.originalPrice)}</div>
                        <div className="text-primary">{formatPrice(p.price)} <span className="text-[10px] font-bold text-destructive">-{discountPercent(p)}%</span></div>
                      </div>
                    ) : formatPrice(p.price)}
                  </td>
                  <td className="p-3">{p.stock ?? "-"}</td>
                  <td className="space-x-1 p-3 text-right">
                    <button onClick={() => { setEditing(p); setOpen(true); }} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-secondary hover:bg-secondary/10">
                      <Pencil className="h-3 w-3" /> Editar
                    </button>
                    <button onClick={() => { if (confirm(`Excluir "${p.name}"?`)) { deleteProduct(p.id); refresh(); } }} className="inline-flex items-center rounded p-1.5 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">
                  {q ? "Nenhum produto encontrado" : "Nenhum produto cadastrado. Clique em 'Novo produto' para começar."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && editing && (
        <ProductForm
          product={editing}
          categories={cats}
          onClose={() => setOpen(false)}
          onSave={(p) => { upsertProduct(p); refresh(); setOpen(false); }}
        />
      )}
    </div>
  );
}

/* ============================== CATEGORIES ============================== */

function useGetCategories() {
  const [cats, setCats] = useState<CategoryDef[]>(() => (typeof window !== "undefined" ? getCategories() : []));
  useEffect(() => {
    const unsub = subscribeCategories(() => setCats(getCategories()));
    return () => { unsub; };
  }, []);
  return cats;
}

function CategoriesTab() {
  const cats = useGetCategories();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const add = () => {
    const label = name.trim();
    if (!label) return;
    const value = slugify(label);
    if (cats.some(c => c.value === value)) { alert("Categoria já existe"); return; }
    saveCategories([...cats, { value, label }]);
    setName("");
  };

  const remove = (value: string) => {
    if (!confirm("Excluir esta categoria? Os produtos não serão removidos, mas ficarão sem categoria visível.")) return;
    saveCategories(cats.filter(c => c.value !== value));
  };

  const startEdit = (c: CategoryDef) => { setEditingId(c.value); setEditName(c.label); };
  const saveEdit = () => {
    if (!editingId) return;
    saveCategories(cats.map(c => c.value === editingId ? { ...c, label: editName.trim() || c.label } : c));
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 font-display text-lg">Nova categoria</h2>
        <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex gap-2">
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Coleção Mega Evolução"
            className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-display text-lg">Categorias ({cats.length})</h2>
        </div>
        <ul className="divide-y divide-border">
          {cats.map(c => (
            <li key={c.value} className="flex items-center gap-3 p-4">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {editingId === c.value ? (
                <>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded border border-border bg-input px-2 py-1 text-sm" autoFocus />
                  <button onClick={saveEdit} className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Salvar</button>
                  <button onClick={() => setEditingId(null)} className="rounded border border-border px-3 py-1 text-xs">Cancelar</button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">slug: {c.value}</p>
                  </div>
                  <button onClick={() => startEdit(c)} className="rounded p-1.5 text-secondary hover:bg-secondary/10"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(c.value)} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </>
              )}
            </li>
          ))}
          {cats.length === 0 && <li className="p-8 text-center text-muted-foreground">Nenhuma categoria</li>}
        </ul>
      </div>
    </div>
  );
}

/* ============================== COLLECTIONS ============================== */

function useGetCollections() {
  const [list, setList] = useState<CollectionDef[]>(() => (typeof window !== "undefined" ? getCollections() : []));
  useEffect(() => {
    const unsub = subscribeCollections(() => setList(getCollections()));
    return () => { unsub; };
  }, []);
  return list;
}

function CollectionsTab() {
  const items = useGetCollections();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const add = () => {
    const label = name.trim();
    if (!label) return;
    const value = slugify(label);
    if (items.some(c => c.value === value)) { alert("Coleção já existe"); return; }
    saveCollections([...items, { value, label }]);
    setName("");
  };
  const remove = (value: string) => {
    if (!confirm("Excluir esta coleção? Os produtos não serão removidos.")) return;
    saveCollections(items.filter(c => c.value !== value));
  };
  const startEdit = (c: CollectionDef) => { setEditingId(c.value); setEditName(c.label); };
  const saveEdit = () => {
    if (!editingId) return;
    saveCollections(items.map(c => c.value === editingId ? { ...c, label: editName.trim() || c.label } : c));
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 font-display text-lg">Nova coleção</h2>
        <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex gap-2">
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Escarlate & Violeta — 151"
            className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </form>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-display text-lg">Coleções ({items.length})</h2>
        </div>
        <ul className="divide-y divide-border">
          {items.map(c => (
            <li key={c.value} className="flex items-center gap-3 p-4">
              <Layers className="h-4 w-4 text-muted-foreground" />
              {editingId === c.value ? (
                <>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded border border-border bg-input px-2 py-1 text-sm" autoFocus />
                  <button onClick={saveEdit} className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Salvar</button>
                  <button onClick={() => setEditingId(null)} className="rounded border border-border px-3 py-1 text-xs">Cancelar</button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">slug: {c.value}</p>
                  </div>
                  <button onClick={() => startEdit(c)} className="rounded p-1.5 text-secondary hover:bg-secondary/10"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(c.value)} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </>
              )}
            </li>
          ))}
          {items.length === 0 && <li className="p-8 text-center text-muted-foreground">Nenhuma coleção</li>}
        </ul>
      </div>
    </div>
  );
}

/* ============================== ANALYTICS ============================== */

function AnalyticsTab() {
  const [data, setData] = useState(() => getAnalytics());
  const products = useMemo(() => getProducts(), []);

  const refresh = () => setData(getAnalytics());

  const topPages = Object.entries(data.pageViews).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topProducts = Object.entries(data.productViews).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topClicks = Object.entries(data.productClicks).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const last7 = useMemo(() => {
    const days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ day: key.slice(5), count: data.daily[key] || 0 });
    }
    return days;
  }, [data]);
  const maxDay = Math.max(1, ...last7.map(d => d.count));

  const productName = (id: string) => products.find(p => p.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Eye} label="Visitas totais" value={data.visits} color="text-primary" />
        <StatCard icon={TrendingUp} label="Páginas únicas" value={Object.keys(data.pageViews).length} color="text-secondary" />
        <StatCard icon={Package} label="Produtos vistos" value={Object.keys(data.productViews).length} color="text-accent" />
        <StatCard icon={MousePointerClick} label="Cliques (WhatsApp)" value={Object.values(data.productClicks).reduce((a, b) => a + b, 0)} color="text-primary" />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-lg">Visitas (últimos 7 dias)</h3>
        <div className="flex h-40 items-end justify-between gap-2">
          {last7.map(d => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-semibold">{d.count}</span>
              <div className="w-full rounded-t bg-primary/80 transition" style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: 2 }} />
              <span className="text-[10px] text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RankList title="Páginas mais acessadas" items={topPages.map(([k, v]) => ({ name: k, count: v }))} />
        <RankList title="Produtos mais vistos" items={topProducts.map(([k, v]) => ({ name: productName(k), count: v }))} />
        <RankList title="Mais clicados (compra)" items={topClicks.map(([k, v]) => ({ name: productName(k), count: v }))} />
      </div>

      <div className="flex justify-between rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        <span>Os dados são coletados localmente neste navegador (sem servidor).</span>
        <div className="flex gap-2">
          <button onClick={refresh} className="rounded border border-border px-3 py-1 text-xs">Atualizar</button>
          <button onClick={() => { if (confirm("Zerar estatísticas?")) { resetAnalytics(); refresh(); } }} className="rounded border border-destructive px-3 py-1 text-xs text-destructive">Zerar</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Eye; label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="font-display text-2xl">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function RankList({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 font-display">{title}</h3>
      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">Sem dados ainda</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-sm">
              <span className="line-clamp-1 text-muted-foreground">{i + 1}. {it.name}</span>
              <span className="rounded bg-background px-2 py-0.5 text-xs font-semibold">{it.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============================== PRODUCT FORM ============================== */

function ProductForm({ product, categories, onClose, onSave }: { product: Product; categories: CategoryDef[]; onClose: () => void; onSave: (p: Product) => void }) {
  const [data, setData] = useState<Product>(product);
  const [uploading, setUploading] = useState(false);

  const compress = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const r = Math.min(MAX / width, MAX / height);
          width = Math.round(width * r); height = Math.round(height * r);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const arr: string[] = [];
      for (const file of Array.from(files)) {
        try { arr.push(await compress(file)); } catch (err) { console.error("upload", file.name, err); }
      }
      setData(d => ({ ...d, images: [...d.images, ...arr] }));
    } finally { setUploading(false); }
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= data.images.length) return;
    const imgs = [...data.images];
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    setData({ ...data, images: imgs });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">{product.name ? "Editar" : "Novo"} produto</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-background"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(data); }} className="space-y-4">
          <Field label="Nome">
            <input required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="input" />
          </Field>
          <Field label="Categorias (selecione uma ou mais)">
            <div className="flex flex-wrap gap-2 rounded-md border border-border bg-input p-2">
              {categories.map(c => {
                const selected = (data.categories ?? [data.category]).includes(c.value);
                return (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => {
                      const cur = data.categories ?? (data.category ? [data.category] : []);
                      const next = cur.includes(c.value) ? cur.filter(x => x !== c.value) : [...cur, c.value];
                      setData({ ...data, categories: next, category: (next[0] ?? c.value) as Category });
                    }}
                    className={`rounded-full border px-3 py-1 text-xs transition ${selected ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-secondary"}`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Preço (R$)">
              <input required type="number" step="0.01" value={data.price} onChange={(e) => setData({ ...data, price: parseFloat(e.target.value) || 0 })} className="input" />
            </Field>
            <Field label='Preço "DE" — antes do desconto (opcional)'>
              <input type="number" step="0.01" value={data.originalPrice ?? ""} onChange={(e) => setData({ ...data, originalPrice: e.target.value ? parseFloat(e.target.value) : undefined })} className="input" placeholder="Ex: 400,00" />
            </Field>
          </div>
          {data.originalPrice && data.originalPrice > data.price && (
            <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Promoção: </span>
              <span className="line-through">{formatPrice(data.originalPrice)}</span>{" "}
              → <span className="font-bold text-primary">{formatPrice(data.price)}</span>{" "}
              <span className="ml-1 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                -{discountPercent(data)}%
              </span>
            </div>
          )}
          <Field label="Descrição">
            <textarea required rows={4} value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} className="input" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Estoque (opcional)">
              <input type="number" value={data.stock ?? 0} onChange={(e) => setData({ ...data, stock: parseInt(e.target.value) || 0 })} className="input" />
            </Field>
            <Field label="Destaque na home">
              <label className="mt-2 flex items-center gap-2">
                <input type="checkbox" checked={!!data.featured} onChange={(e) => setData({ ...data, featured: e.target.checked })} />
                <span className="text-sm">Mostrar em destaque</span>
              </label>
            </Field>
          </div>
          <div className="space-y-3 rounded-lg border border-border bg-background/40 p-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!data.banner} onChange={(e) => setData({ ...data, banner: e.target.checked })} />
              <span className="text-sm font-semibold">📢 Exibir no banner da tela inicial</span>
            </label>
            {data.banner && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Subtítulo do banner">
                  <input value={data.bannerSubtitle ?? ""} onChange={(e) => setData({ ...data, bannerSubtitle: e.target.value })} className="input" />
                </Field>
                <Field label="Selo (ex: LANÇAMENTO)">
                  <input value={data.bannerBadge ?? ""} onChange={(e) => setData({ ...data, bannerBadge: e.target.value })} className="input" />
                </Field>
              </div>
            )}
          </div>
          <Field label="Imagens (a primeira é a capa)">
            <input type="file" accept="image/*" multiple onChange={(e) => upload(e.target.files)} className="input" disabled={uploading} />
            {uploading && <p className="mt-2 text-xs text-muted-foreground">Processando imagens...</p>}
            {data.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {data.images.map((src, i) => (
                  <div key={i} className="group relative aspect-square">
                    <img src={src} alt="" className="h-full w-full rounded object-cover" />
                    {i === 0 && <span className="absolute left-1 top-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-secondary-foreground">CAPA</span>}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 px-1 py-0.5 opacity-0 transition group-hover:opacity-100">
                      <button type="button" onClick={() => move(i, -1)} className="text-xs text-white disabled:opacity-30" disabled={i === 0}>◀</button>
                      <button type="button" onClick={() => move(i, 1)} className="text-xs text-white disabled:opacity-30" disabled={i === data.images.length - 1}>▶</button>
                    </div>
                    <button type="button" onClick={() => setData({ ...data, images: data.images.filter((_, j) => j !== i) })}
                      className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-destructive text-xs text-destructive-foreground">×</button>
                  </div>
                ))}
              </div>
            )}
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-md border border-border py-3">Cancelar</button>
            <button type="submit" className="flex-1 rounded-md bg-primary py-3 font-bold text-primary-foreground hover:opacity-90">Salvar</button>
          </div>
        </form>
        <style>{`.input{width:100%;border-radius:0.375rem;border:1px solid var(--border);background:var(--input);padding:0.625rem 0.75rem;outline:none;color:var(--foreground)}.input:focus{border-color:var(--primary)}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
