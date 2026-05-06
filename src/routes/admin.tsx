import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CATEGORIES, type Category, type Product, getProducts, upsertProduct, deleteProduct, formatPrice } from "@/lib/products";
import { Trash2, Plus, X } from "lucide-react";

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "admin";
const AUTH_KEY = "pkmn_admin_auth";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

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
      <div className="container mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4">
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
          <button className="w-full rounded-md bg-primary py-3 font-bold text-primary-foreground">Entrar</button>
        </form>
      </div>
    );
  }

  return <AdminDashboard onLogout={() => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); }} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = () => setProducts(getProducts());
  useEffect(() => refresh(), []);

  const handleNew = () => {
    setEditing({
      id: crypto.randomUUID(),
      name: "", category: "booster", price: 0, description: "",
      images: [], stock: 0, featured: false, createdAt: Date.now(),
    });
    setOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl">Admin · Produtos</h1>
        <div className="flex gap-2">
          <button onClick={handleNew} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Novo produto
          </button>
          <button onClick={onLogout} className="rounded-md border border-border px-4 py-2 text-sm">Sair</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card">
            <tr className="text-left">
              <th className="p-3">Produto</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Preço</th>
              <th className="p-3">Estoque</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-t border-border hover:bg-card/50">
                <td className="flex items-center gap-3 p-3">
                  {p.images[0] && <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-cover" />}
                  <span className="line-clamp-1">{p.name}</span>
                </td>
                <td className="p-3 capitalize text-muted-foreground">{p.category}</td>
                <td className="p-3">{formatPrice(p.price)}</td>
                <td className="p-3">{p.stock ?? "-"}</td>
                <td className="space-x-2 p-3 text-right">
                  <button onClick={() => { setEditing(p); setOpen(true); }} className="text-secondary hover:underline">Editar</button>
                  <button onClick={() => { if (confirm("Excluir?")) { deleteProduct(p.id); refresh(); } }} className="text-destructive">
                    <Trash2 className="inline h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum produto</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && editing && (
        <ProductForm
          product={editing}
          onClose={() => setOpen(false)}
          onSave={(p) => { upsertProduct(p); refresh(); setOpen(false); }}
        />
      )}
    </div>
  );
}

function ProductForm({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (p: Product) => void }) {
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
          width = Math.round(width * r);
          height = Math.round(height * r);
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
        try { arr.push(await compress(file)); }
        catch (err) { console.error("upload", file.name, err); }
      }
      setData(d => ({ ...d, images: [...d.images, ...arr] }));
    } finally {
      setUploading(false);
    }
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
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">{product.name ? "Editar" : "Novo"} produto</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSave(data); }}
          className="space-y-4"
        >
          <Field label="Nome">
            <input required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoria">
              <select value={data.category} onChange={(e) => setData({ ...data, category: e.target.value as Category })} className="input">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Preço (R$)">
              <input required type="number" step="0.01" value={data.price} onChange={(e) => setData({ ...data, price: parseFloat(e.target.value) || 0 })} className="input" />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea required rows={4} value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
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
          <Field label="Imagens (você pode enviar várias — a primeira é a capa)">
            <input type="file" accept="image/*" multiple onChange={(e) => upload(e.target.files)} className="input" disabled={uploading} />
            {uploading && <p className="mt-2 text-xs text-muted-foreground">Processando imagens...</p>}
            {data.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.images.map((src, i) => (
                  <div key={i} className="group relative h-24 w-24">
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
            <button type="submit" className="flex-1 rounded-md bg-primary py-3 font-bold text-primary-foreground">Salvar</button>
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
