import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, X, Download, FileSpreadsheet, DollarSign, TrendingUp, Package, Percent, Wallet, Target, Clock, ArrowDown, ArrowUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import {
  type FinanceEntry, type FinanceStatus,
  getFinance, upsertFinance, deleteFinance, calc, exportCSV, exportXLS, downloadFile, subscribeFinance,
  daysInStock, monthlyStats, availableMonths, formatMonth,
} from "@/lib/finance";
import { getProducts, getCategories, formatPrice, type CategoryDef } from "@/lib/products";

export function FinanceTab() {
  const [list, setList] = useState<FinanceEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceEntry | null>(null);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "vendidos" | "estoque" | "prejuizo">("");
  const [sort, setSort] = useState<"recent" | "lucro" | "margem" | "invest">("recent");

  const cats = useGetCats();
  const refresh = () => setList(getFinance());
  useEffect(() => {
    refresh();
    return subscribeFinance(refresh);
  }, []);

  const filtered = useMemo(() => {
    let arr = list.filter(e => e.name.toLowerCase().includes(q.toLowerCase()));
    if (catFilter) arr = arr.filter(e => e.category === catFilter);
    if (statusFilter === "vendidos") arr = arr.filter(e => e.sold || e.status === "vendido");
    if (statusFilter === "estoque") arr = arr.filter(e => e.status === "estoque" && !e.sold);
    if (statusFilter === "prejuizo") arr = arr.filter(e => calc(e).netUnit < 0);
    if (sort === "lucro") arr = [...arr].sort((a, b) => calc(b).totalProfit - calc(a).totalProfit);
    if (sort === "margem") arr = [...arr].sort((a, b) => calc(b).marginPercent - calc(a).marginPercent);
    if (sort === "invest") arr = [...arr].sort((a, b) => calc(b).invest - calc(a).invest);
    return arr;
  }, [list, q, catFilter, statusFilter, sort]);

  const totals = useMemo(() => {
    let invest = 0, revenue = 0, gross = 0, net = 0, qty = 0, marginSum = 0, marginCount = 0, realized = 0;
    for (const e of list) {
      const c = calc(e);
      invest += c.invest; revenue += c.revenue;
      gross += c.grossUnit * e.quantity;
      net += c.totalProfit;
      qty += e.quantity;
      if (e.cost > 0) { marginSum += c.marginPercent; marginCount++; }
      if (e.sold) realized += c.totalProfit;
    }
    return { invest, revenue, gross, net, qty, avgMargin: marginCount ? marginSum / marginCount : 0, realized };
  }, [list]);

  const monthOptions = useMemo(() => availableMonths(list), [list]);
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  useEffect(() => {
    if (monthOptions.length && !monthOptions.includes(month)) setMonth(monthOptions[0]);
  }, [monthOptions, month]);
  const mStats = useMemo(() => monthlyStats(list, month), [list, month]);

  const handleNew = () => {
    setEditing({
      id: crypto.randomUUID(),
      name: "", category: cats[0]?.value ?? "",
      quantity: 1, cost: 0, price: 0, feePercent: 0, shipping: 0,
      notes: "", status: "estoque", sold: false, createdAt: Date.now(),
    });
    setOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Dashboard */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat icon={Wallet} label="Investido" value={formatPrice(totals.invest)} color="text-primary" />
        <Stat icon={Target} label="Venda estimada" value={formatPrice(totals.revenue)} color="text-secondary" />
        <Stat icon={TrendingUp} label="Lucro bruto" value={formatPrice(totals.gross)} color="text-accent" />
        <Stat icon={DollarSign} label="Lucro líquido" value={formatPrice(totals.net)} color={totals.net >= 0 ? "text-emerald-500" : "text-destructive"} />
        <Stat icon={Percent} label="Margem média" value={`${totals.avgMargin.toFixed(1)}%`} color="text-primary" />
        <Stat icon={Package} label="Itens em estoque" value={totals.qty.toString()} color="text-secondary" />
      </div>

      {/* Painel mensal */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-lg">Resumo mensal</h3>
            <p className="text-xs text-muted-foreground">Acompanhe entradas, saídas e tempo de venda mês a mês</p>
          </div>
          <select value={month} onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-border bg-input px-3 py-2 text-sm font-semibold capitalize">
            {monthOptions.map(m => <option key={m} value={m} className="capitalize">{formatMonth(m)}</option>)}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Stat icon={ArrowUp} label="Entrou (receita)" value={formatPrice(mStats.entradasBruto)} color="text-emerald-500" />
          <Stat icon={ArrowDown} label="Saiu (investido)" value={formatPrice(mStats.saidas)} color="text-destructive" />
          <Stat icon={DollarSign} label="Lucro líquido do mês" value={formatPrice(mStats.entradasLiquido)} color={mStats.entradasLiquido >= 0 ? "text-emerald-500" : "text-destructive"} />
          <Stat icon={TrendingUp} label="Saldo (lucro − invest.)" value={formatPrice(mStats.saldo)} color={mStats.saldo >= 0 ? "text-emerald-500" : "text-destructive"} />
          <Stat icon={Package} label="Itens vendidos" value={mStats.vendidos.toString()} color="text-secondary" />
          <Stat icon={Clock} label="Tempo médio até vender" value={mStats.tempoMedioVenda > 0 ? `${mStats.tempoMedioVenda.toFixed(1)} d` : "—"} color="text-primary" />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto..."
          className="min-w-[180px] flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary" />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="rounded-md border border-border bg-input px-2 py-2 text-sm">
          <option value="">Todas categorias</option>
          {cats.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="rounded-md border border-border bg-input px-2 py-2 text-sm">
          <option value="">Todos</option>
          <option value="estoque">Em estoque</option>
          <option value="vendidos">Vendidos</option>
          <option value="prejuizo">Apenas prejuízo</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-md border border-border bg-input px-2 py-2 text-sm">
          <option value="recent">Mais recentes</option>
          <option value="lucro">Maior lucro</option>
          <option value="margem">Maior margem</option>
          <option value="invest">Maior investimento</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={() => downloadFile("financeiro.csv", exportCSV(filtered), "text/csv")}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs hover:bg-background">
            <Download className="h-3 w-3" /> CSV
          </button>
          <button onClick={() => downloadFile("financeiro.xls", exportXLS(filtered), "application/vnd.ms-excel")}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs hover:bg-background">
            <FileSpreadsheet className="h-3 w-3" /> Excel
          </button>
          <button onClick={handleNew} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Novo registro
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/50">
              <tr className="text-left">
                <th className="p-3">Produto</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Qtd</th>
                <th className="p-3">Custo</th>
                <th className="p-3">Venda</th>
                <th className="p-3">Taxa</th>
                <th className="p-3">Frete</th>
                <th className="p-3">Lucro un.</th>
                <th className="p-3">Lucro total</th>
                <th className="p-3">Margem</th>
                <th className="p-3">Tempo</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const c = calc(e);
                const badge = c.netUnit < 0 ? "bg-destructive/20 text-destructive"
                  : c.marginPercent >= 30 ? "bg-emerald-500/20 text-emerald-500"
                  : "bg-yellow-500/20 text-yellow-600";
                return (
                  <tr key={e.id} className="border-t border-border hover:bg-background/40">
                    <td className="p-3 font-medium">{e.name}</td>
                    <td className="p-3 text-muted-foreground">{cats.find(c => c.value === e.category)?.label ?? e.category}</td>
                    <td className="p-3">{e.quantity}</td>
                    <td className="p-3">{formatPrice(e.cost)}</td>
                    <td className="p-3">{formatPrice(e.price)}</td>
                    <td className="p-3">{e.feePercent}%</td>
                    <td className="p-3">{formatPrice(e.shipping)}</td>
                    <td className={`p-3 font-semibold ${c.netUnit < 0 ? "text-destructive" : "text-emerald-500"}`}>{formatPrice(c.netUnit)}</td>
                    <td className={`p-3 font-bold ${c.totalProfit < 0 ? "text-destructive" : "text-emerald-500"}`}>{formatPrice(c.totalProfit)}</td>
                    <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs font-bold ${badge}`}>{c.marginPercent.toFixed(1)}%</span></td>
                    <td className="p-3 text-xs text-muted-foreground">{daysInStock(e)}d {e.sold ? "(vendeu)" : ""}</td>
                    <td className="p-3"><StatusBadge entry={e} /></td>
                    <td className="space-x-1 p-3 text-right">
                      <button onClick={() => { setEditing(e); setOpen(true); }} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-secondary hover:bg-secondary/10">
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button onClick={() => { if (confirm(`Excluir "${e.name}"?`)) { deleteFinance(e.id); refresh(); } }} className="inline-flex rounded p-1.5 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={13} className="p-10 text-center text-muted-foreground">Nenhum registro financeiro</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FinanceCharts list={list} cats={cats} />

      {open && editing && (
        <FinanceForm entry={editing} cats={cats} onClose={() => setOpen(false)}
          onSave={(e) => { upsertFinance(e); refresh(); setOpen(false); }} />
      )}
    </div>
  );
}

function StatusBadge({ entry }: { entry: FinanceEntry }) {
  if (entry.sold || entry.status === "vendido") return <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-500">Vendido</span>;
  if (entry.status === "reservado") return <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-semibold text-yellow-600">Reservado</span>;
  return <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">Em estoque</span>;
}

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className={`font-display text-xl ${color}`}>{value}</p>
    </div>
  );
}

function useGetCats() {
  const [c, setC] = useState<CategoryDef[]>(() => (typeof window !== "undefined" ? getCategories() : []));
  useEffect(() => { setC(getCategories()); }, []);
  return c;
}

/* ============== CHARTS ============== */
const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

function FinanceCharts({ list, cats }: { list: FinanceEntry[]; cats: CategoryDef[] }) {
  const byDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of list) {
      if (!e.sold) continue;
      const day = new Date(e.createdAt).toISOString().slice(5, 10);
      map[day] = (map[day] || 0) + calc(e).totalProfit;
    }
    return Object.entries(map).map(([day, lucro]) => ({ day, lucro: +lucro.toFixed(2) }));
  }, [list]);

  const byCat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of list) map[e.category] = (map[e.category] || 0) + calc(e).invest;
    return Object.entries(map).map(([k, v]) => ({ name: cats.find(c => c.value === k)?.label ?? k, value: +v.toFixed(2) }));
  }, [list, cats]);

  const top = useMemo(() => [...list].sort((a, b) => calc(b).totalProfit - calc(a).totalProfit).slice(0, 5)
    .map(e => ({ name: e.name.slice(0, 18), lucro: +calc(e).totalProfit.toFixed(2) })), [list]);

  const lowMargin = useMemo(() => [...list].sort((a, b) => calc(a).marginPercent - calc(b).marginPercent).slice(0, 5)
    .map(e => ({ name: e.name.slice(0, 18), margem: +calc(e).marginPercent.toFixed(1) })), [list]);

  if (list.length === 0) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Lucro realizado por dia">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={byDay}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} />
            <Tooltip /><Line type="monotone" dataKey="lucro" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Investimento por categoria">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={byCat} dataKey="value" nameKey="name" outerRadius={80} label>
              {byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip /><Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Top 5 mais lucrativos">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={top}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" fontSize={10} /><YAxis fontSize={11} />
            <Tooltip /><Bar dataKey="lucro" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Menor margem (atenção)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={lowMargin}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" fontSize={10} /><YAxis fontSize={11} />
            <Tooltip /><Bar dataKey="margem" fill="hsl(var(--destructive))" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 font-display">{title}</h3>
      {children}
    </div>
  );
}

/* ============== FORM ============== */
function FinanceForm({ entry, cats, onClose, onSave }: { entry: FinanceEntry; cats: CategoryDef[]; onClose: () => void; onSave: (e: FinanceEntry) => void }) {
  const [data, setData] = useState<FinanceEntry>(entry);
  const products = useMemo(() => getProducts(), []);
  const c = calc(data);

  const set = <K extends keyof FinanceEntry>(k: K, v: FinanceEntry[K]) => setData(d => ({ ...d, [k]: v }));

  const linkProduct = (id: string) => {
    const p = products.find(x => x.id === id);
    if (!p) { set("productId", undefined); return; }
    setData(d => ({
      ...d, productId: p.id, name: p.name, category: p.category,
      price: p.price, quantity: p.stock ?? d.quantity,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">{entry.name ? "Editar" : "Novo"} registro financeiro</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-background"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(data); }} className="space-y-4">
          <label className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
            <input type="checkbox" checked={!!data.expenseOnly} onChange={(e) => {
              const v = e.target.checked;
              setData(d => ({ ...d, expenseOnly: v, price: v ? 0 : d.price, feePercent: v ? 0 : d.feePercent, sold: v ? false : d.sold, status: v ? "estoque" : d.status }));
            }} />
            <span className="text-sm font-semibold">💸 Apenas saída (frete, embalagem, brinde) — conta como investimento</span>
          </label>

          {!data.expenseOnly && products.length > 0 && (
            <F label="Vincular a produto cadastrado (opcional)">
              <select value={data.productId ?? ""} onChange={(e) => linkProduct(e.target.value)} className="finput">
                <option value="">— Nenhum (manual) —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </F>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <F label={data.expenseOnly ? "Descrição da saída" : "Nome do produto"}>
              <input required value={data.name} onChange={(e) => set("name", e.target.value)} className="finput" placeholder={data.expenseOnly ? "Ex: Frete Correios, Embalagens, Brinde..." : ""} />
            </F>
            {data.expenseOnly ? (
              <F label="Tipo de saída">
                <select value={data.expenseKind ?? "frete"} onChange={(e) => set("expenseKind", e.target.value)} className="finput">
                  <option value="frete">Frete</option>
                  <option value="embalagem">Embalagem</option>
                  <option value="brinde">Brinde</option>
                  <option value="material">Material/Insumo</option>
                  <option value="outro">Outro</option>
                </select>
              </F>
            ) : (
              <F label="Categoria">
                <select value={data.category} onChange={(e) => set("category", e.target.value)} className="finput">
                  {cats.map(cc => <option key={cc.value} value={cc.value}>{cc.label}</option>)}
                </select>
              </F>
            )}
          </div>
          {data.expenseOnly ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Quantidade"><input type="number" min="1" value={data.quantity} onChange={(e) => set("quantity", +e.target.value || 0)} className="finput" /></F>
              <F label="Valor unitário (R$)"><input type="number" step="0.01" value={data.cost} onChange={(e) => set("cost", +e.target.value || 0)} className="finput" /></F>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <F label="Quantidade"><input type="number" min="1" value={data.quantity} onChange={(e) => set("quantity", +e.target.value || 0)} className="finput" /></F>
                <F label="Custo unitário (R$)"><input type="number" step="0.01" value={data.cost} onChange={(e) => set("cost", +e.target.value || 0)} className="finput" /></F>
                <F label="Preço de venda (R$)"><input type="number" step="0.01" value={data.price} onChange={(e) => set("price", +e.target.value || 0)} className="finput" /></F>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <F label="Taxa marketplace (%)"><input type="number" step="0.1" value={data.feePercent} onChange={(e) => set("feePercent", +e.target.value || 0)} className="finput" /></F>
                <F label="Frete por unidade (R$)"><input type="number" step="0.01" value={data.shipping} onChange={(e) => set("shipping", +e.target.value || 0)} className="finput" /></F>
                <F label="Status">
                  <select value={data.status} onChange={(e) => set("status", e.target.value as FinanceStatus)} className="finput">
                    <option value="estoque">Em estoque</option>
                    <option value="vendido">Vendido</option>
                    <option value="reservado">Reservado</option>
                  </select>
                </F>
              </div>
            </>
          )}
          <F label="Observações"><textarea rows={2} value={data.notes ?? ""} onChange={(e) => set("notes", e.target.value)} className="finput" /></F>
          {!data.expenseOnly && (
            <label className="flex items-center gap-2 rounded-lg border border-border bg-background/40 p-3">
              <input type="checkbox" checked={data.sold} onChange={(e) => set("sold", e.target.checked)} />
              <span className="text-sm font-semibold">✅ Já vendido (considerar lucro realizado)</span>
            </label>
          )}

          {/* Resumo em tempo real */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-background/40 p-4 sm:grid-cols-3">
            <Mini label="Lucro bruto un." value={formatPrice(c.grossUnit)} />
            <Mini label="Lucro líquido un." value={formatPrice(c.netUnit)} positive={c.netUnit >= 0} />
            <Mini label="Margem" value={`${c.marginPercent.toFixed(1)}%`} positive={c.marginPercent >= 0} />
            <Mini label="Investimento" value={formatPrice(c.invest)} />
            <Mini label="Retorno estimado" value={formatPrice(c.revenue)} />
            <Mini label="Lucro total" value={formatPrice(c.totalProfit)} positive={c.totalProfit >= 0} />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-md border border-border py-3">Cancelar</button>
            <button type="submit" className="flex-1 rounded-md bg-primary py-3 font-bold text-primary-foreground hover:opacity-90">Salvar</button>
          </div>
        </form>
        <style>{`.finput{width:100%;border-radius:0.375rem;border:1px solid var(--border);background:var(--input);padding:0.5rem 0.75rem;outline:none;color:var(--foreground)}.finput:focus{border-color:var(--primary)}`}</style>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium">{label}</span>{children}</label>;
}
function Mini({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`font-bold ${positive === undefined ? "" : positive ? "text-emerald-500" : "text-destructive"}`}>{value}</p>
    </div>
  );
}
