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
  notes?: string;
  status: FinanceStatus;
  sold: boolean;       // já vendido (lucro realizado)
  createdAt: number;
};

const KEY = "pkmn_finance_v1";

export function getFinance(): FinanceEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
export function saveFinance(list: FinanceEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}
export function upsertFinance(e: FinanceEntry) {
  const list = getFinance();
  const i = list.findIndex(x => x.id === e.id);
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
  const grossUnit = e.price - e.cost;
  const netUnit = e.price - e.cost - fee - (e.shipping || 0);
  const marginPercent = e.cost > 0 ? (netUnit / e.cost) * 100 : 0;
  const invest = e.cost * e.quantity;
  const revenue = e.price * e.quantity;
  const totalProfit = netUnit * e.quantity;
  return { grossUnit, netUnit, marginPercent, invest, revenue, totalProfit };
}

export function exportCSV(rows: FinanceEntry[]) {
  const headers = ["Produto","Categoria","Qtd","Custo","Venda","Taxa%","Frete","LucroUnit","LucroTotal","Margem%","Status","Vendido"];
  const lines = [headers.join(";")];
  for (const r of rows) {
    const c = calc(r);
    lines.push([
      JSON.stringify(r.name), r.category, r.quantity,
      r.cost.toFixed(2), r.price.toFixed(2), r.feePercent, r.shipping.toFixed(2),
      c.netUnit.toFixed(2), c.totalProfit.toFixed(2), c.marginPercent.toFixed(1),
      r.status, r.sold ? "Sim" : "Não",
    ].join(";"));
  }
  return "\ufeff" + lines.join("\n");
}

export function exportXLS(rows: FinanceEntry[]) {
  // SpreadsheetML simples — abre no Excel
  const headers = ["Produto","Categoria","Qtd","Custo","Venda","Taxa%","Frete","LucroUnit","LucroTotal","Margem%","Status","Vendido"];
  const esc = (s: any) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");
  const headerRow = `<tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr>`;
  const body = rows.map(r => {
    const c = calc(r);
    const cells = [r.name, r.category, r.quantity, r.cost.toFixed(2), r.price.toFixed(2), r.feePercent, r.shipping.toFixed(2),
      c.netUnit.toFixed(2), c.totalProfit.toFixed(2), c.marginPercent.toFixed(1), r.status, r.sold?"Sim":"Não"];
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
