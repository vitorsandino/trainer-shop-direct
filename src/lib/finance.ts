export type FinanceStatus = "estoque" | "vendido" | "reservado";

export type FinanceEntry = {
  id: string;
  productId?: string;
  name: string;
  category: string;
  quantity: number;
  cost: number;        // custo unitário
  price: number;       // preço de venda
  feePercent: number;  // taxa marketplace %
  shipping: number;    // frete por unidade
  /** @deprecated removido — mantido só para não quebrar dados antigos */
  packaging?: number;
  /** @deprecated removido — mantido só para não quebrar dados antigos */
  gift?: number;
  notes?: string;
  status: FinanceStatus;
  sold: boolean;       // já vendido (lucro realizado)
  soldAt?: number;     // quando foi vendido (timestamp)
  createdAt: number;
};

const KEY = "pkmn_finance_v1";
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("cloud-sync-key", ((event: Event) => {
    const key = (event as CustomEvent<{ key?: string }>).detail?.key;
    if (key === KEY) listeners.forEach((cb) => cb());
  }) as EventListener);
}

export function getFinance(): FinanceEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
export function saveFinance(list: FinanceEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  listeners.forEach((cb) => cb());
}
export function subscribeFinance(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
export function upsertFinance(e: FinanceEntry) {
  const list = getFinance();
  const i = list.findIndex(x => x.id === e.id);
  // garantir soldAt quando marcado vendido
  if (e.sold && !e.soldAt) e.soldAt = Date.now();
  if (!e.sold) e.soldAt = undefined;
  if (i >= 0) list[i] = e; else list.unshift(e);
  saveFinance(list);
}
export function deleteFinance(id: string) {
  saveFinance(getFinance().filter(e => e.id !== id));
}

export type FinanceCalc = {
  grossUnit: number;
  netUnit: number;
  marginPercent: number;
  invest: number;
  revenue: number;
  totalProfit: number;
};

export function calc(e: Pick<FinanceEntry, "cost" | "price" | "feePercent" | "shipping" | "quantity">): FinanceCalc {
  const fee = (e.price * (e.feePercent || 0)) / 100;
  const extras = (e.shipping || 0);
  const totalCostUnit = e.cost + extras;
  const grossUnit = e.price - e.cost;
  const netUnit = e.price - e.cost - fee - extras;
  const marginPercent = totalCostUnit > 0 ? (netUnit / totalCostUnit) * 100 : 0;
  const invest = totalCostUnit * e.quantity;
  const revenue = e.price * e.quantity;
  const totalProfit = netUnit * e.quantity;
  return { grossUnit, netUnit, marginPercent, invest, revenue, totalProfit };
}

/** Quantos dias entre criação e venda (ou hoje, se ainda em estoque). */
export function daysInStock(e: FinanceEntry): number {
  const end = e.sold && e.soldAt ? e.soldAt : Date.now();
  return Math.max(0, Math.round((end - e.createdAt) / 86400000));
}

export type MonthStats = {
  monthKey: string;       // YYYY-MM
  entradasBruto: number;  // receita das vendas (preço * qtd)
  entradasLiquido: number;// lucro líquido das vendas
  saidas: number;         // investimento dos itens cadastrados no mês
  vendidos: number;       // qtd de itens marcados vendidos no mês
  cadastrados: number;    // qtd de itens cadastrados no mês
  tempoMedioVenda: number;// dias médios entre cadastro e venda dos vendidos no mês
  saldo: number;          // entradasLiquido - saidas
};

function ymd(ts: number) { return new Date(ts).toISOString().slice(0, 7); }

export function monthlyStats(list: FinanceEntry[], monthKey: string): MonthStats {
  let entradasBruto = 0, entradasLiquido = 0, saidas = 0, vendidos = 0, cadastrados = 0;
  let tempoSoma = 0, tempoCount = 0;
  for (const e of list) {
    const c = calc(e);
    if (ymd(e.createdAt) === monthKey) {
      saidas += c.invest;
      cadastrados += e.quantity;
    }
    if (e.sold && e.soldAt && ymd(e.soldAt) === monthKey) {
      entradasBruto += c.revenue;
      entradasLiquido += c.totalProfit;
      vendidos += e.quantity;
      tempoSoma += daysInStock(e);
      tempoCount++;
    }
  }
  return {
    monthKey,
    entradasBruto, entradasLiquido, saidas,
    vendidos, cadastrados,
    tempoMedioVenda: tempoCount ? tempoSoma / tempoCount : 0,
    saldo: entradasLiquido - saidas,
  };
}

/** Lista de meses que tem qualquer movimento (cadastro ou venda), mais recentes primeiro. */
export function availableMonths(list: FinanceEntry[]): string[] {
  const set = new Set<string>();
  for (const e of list) {
    set.add(ymd(e.createdAt));
    if (e.soldAt) set.add(ymd(e.soldAt));
  }
  set.add(ymd(Date.now()));
  return Array.from(set).sort().reverse();
}

export function formatMonth(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function exportCSV(rows: FinanceEntry[]) {
  const headers = ["Produto","Categoria","Qtd","Custo","Venda","Taxa%","Frete","LucroUnit","LucroTotal","Margem%","Status","Vendido","DiasEmEstoque"];
  const lines = [headers.join(";")];
  for (const r of rows) {
    const c = calc(r);
    lines.push([
      JSON.stringify(r.name), r.category, r.quantity,
      r.cost.toFixed(2), r.price.toFixed(2), r.feePercent, r.shipping.toFixed(2),
      c.netUnit.toFixed(2), c.totalProfit.toFixed(2), c.marginPercent.toFixed(1),
      r.status, r.sold ? "Sim" : "Não", daysInStock(r),
    ].join(";"));
  }
  return "\ufeff" + lines.join("\n");
}

export function exportXLS(rows: FinanceEntry[]) {
  const headers = ["Produto","Categoria","Qtd","Custo","Venda","Taxa%","Frete","LucroUnit","LucroTotal","Margem%","Status","Vendido","DiasEmEstoque"];
  const esc = (s: any) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");
  const headerRow = `<tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr>`;
  const body = rows.map(r => {
    const c = calc(r);
    const cells = [r.name, r.category, r.quantity, r.cost.toFixed(2), r.price.toFixed(2), r.feePercent, r.shipping.toFixed(2),
      c.netUnit.toFixed(2), c.totalProfit.toFixed(2), c.marginPercent.toFixed(1), r.status, r.sold?"Sim":"Não", daysInStock(r)];
    return `<tr>${cells.map(v=>`<td>${esc(v)}</td>`).join("")}</tr>`;
  }).join("");
  return `<html><head><meta charset="UTF-8"></head><body><table border="1">${headerRow}${body}</table></body></html>`;
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
