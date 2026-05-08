import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { clearCart, getCartLines, reconcileCartWithStock } from "@/lib/cart";
import { createOrder, type OrderAddress } from "@/lib/orders";
import { formatPrice, WHATSAPP_NUMBER, getProducts, saveProducts } from "@/lib/products";
import { getFinance, saveFinance } from "@/lib/finance";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuth();
  const [data, setData] = useState(() => getCartLines());
  const [busy, setBusy] = useState(false);

  useEffect(() => { reconcileCartWithStock(); setData(getCartLines()); }, []);

  const [addr, setAddr] = useState<OrderAddress>({
    fullName: "", phone: "", zip: "", street: "", number: "", complement: "",
    district: "", city: "", state: "", notes: "",
  });
  useEffect(() => {
    if (user) setAddr(a => ({ ...a, fullName: a.fullName || user.name, phone: a.phone || (user.phone ?? "") }));
  }, [user]);

  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  const lookupCep = async (rawZip: string) => {
    const cep = rawZip.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true); setCepError("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const j = await res.json();
      if (j.erro) { setCepError("CEP não encontrado"); return; }
      setAddr(a => ({
        ...a,
        zip: cep.replace(/(\d{5})(\d{3})/, "$1-$2"),
        street: j.logradouro || a.street,
        district: j.bairro || a.district,
        city: j.localidade || a.city,
        state: j.uf || a.state,
        complement: j.complemento || a.complement,
      }));
    } catch { setCepError("Falha ao buscar CEP"); }
    finally { setCepLoading(false); }
  };

  const onZipChange = (v: string) => {
    const masked = v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{0,3})/, (_, a, b) => b ? `${a}-${b}` : a);
    setAddr(a => ({ ...a, zip: masked }));
    if (masked.replace(/\D/g, "").length === 8) void lookupCep(masked);
  };

  if (user === undefined) {
    return <div className="container mx-auto px-4 py-16 text-center text-sm text-muted-foreground">Carregando sua sessão...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl">Entre na sua conta para continuar</h1>
        <p className="mt-2 text-sm text-muted-foreground">Você precisa estar logado para finalizar a compra.</p>
        <Link to="/login" search={{ redirect: "/checkout" }} className="mt-6 inline-block rounded-md bg-primary px-6 py-3 font-bold text-primary-foreground">
          Entrar / Criar conta
        </Link>
      </div>
    );
  }

  if (data.lines.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl">Carrinho vazio</h1>
        <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-6 py-3 font-bold text-primary-foreground">Ver produtos</Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // valida estoque novamente antes de criar
      const fresh = getProducts();
      for (const l of data.lines) {
        const p = fresh.find(x => x.id === l.product.id);
        if (!p) { alert(`Produto "${l.product.name}" não está mais disponível.`); setBusy(false); return; }
        if (typeof p.stock === "number" && l.qty > p.stock) {
          alert(`Estoque de "${p.name}" mudou. Disponível: ${p.stock}.`);
          reconcileCartWithStock();
          setData(getCartLines());
          setBusy(false);
          return;
        }
      }

      const order = createOrder({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        items: data.lines.map(l => ({
          productId: l.product.id, name: l.product.name, price: l.product.price, qty: l.qty, image: l.product.images[0],
        })),
        total: data.total,
        address: addr,
      });

      // decrementa estoque dos produtos
      const updated = fresh.map(p => {
        const line = data.lines.find(l => l.product.id === p.id);
        if (!line || typeof p.stock !== "number") return p;
        return { ...p, stock: Math.max(0, p.stock - line.qty) };
      });
      saveProducts(updated);

      // marca registros financeiros vinculados como vendidos (proporcional)
      const fin = getFinance();
      const now = Date.now();
      let finChanged = false;
      const nextFin = fin.map(f => {
        if (!f.productId) return f;
        const line = data.lines.find(l => l.product.id === f.productId);
        if (!line) return f;
        if (f.sold) return f;
        finChanged = true;
        return { ...f, sold: true, soldAt: now, status: "vendido" as const };
      });
      if (finChanged) saveFinance(nextFin);

      // dispara e-mail de confirmação (não bloqueia)
      void import("@/lib/email.functions").then(m =>
        m.sendOrderConfirmation({ data: {
          email: user.email,
          code: order.code,
          userName: user.name,
          items: order.items.map(i => ({ name: i.name, qty: i.qty, price: i.price, image: i.image })),
          total: order.total,
          address: {
            fullName: addr.fullName, street: addr.street, number: addr.number, complement: addr.complement,
            district: addr.district, city: addr.city, state: addr.state, zip: addr.zip,
          },
        }}).catch(err => console.warn("[email] confirm:", err))
      );

      clearCart();
      const itensTxt = data.lines.map(l => `• ${l.qty}x ${l.product.name} — ${formatPrice(l.product.price * l.qty)}`).join("\n");
      const enderecoTxt =
        `${addr.street}, ${addr.number}${addr.complement ? ` — ${addr.complement}` : ""}\n` +
        `${addr.district} — ${addr.city}/${addr.state}\nCEP ${addr.zip}`;
      const msg = encodeURIComponent(
        `🐼 *Novo pedido Pandex Store*\n` +
        `\n*Pedido:* ${order.code}` +
        `\n*Cliente:* ${user.name}` +
        `\n*Telefone:* ${addr.phone}` +
        `\n*E-mail:* ${user.email}` +
        `\n\n*Itens:*\n${itensTxt}` +
        `\n\n*Total:* ${formatPrice(order.total)}` +
        `\n\n*Entrega:*\n${enderecoTxt}` +
        (addr.notes ? `\n\n*Obs.:* ${addr.notes}` : "") +
        `\n\nGostaria de combinar o pagamento, por favor.`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
      navigate({ to: "/conta/pedidos/$id", params: { id: order.id } });
    } finally { setBusy(false); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 font-display text-2xl md:text-3xl">Finalizar compra</h1>
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg">Endereço de entrega</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Nome completo" value={addr.fullName} onChange={v => setAddr({ ...addr, fullName: v })} required />
            <Input label="Celular / WhatsApp" value={addr.phone} onChange={v => setAddr({ ...addr, phone: v })} required />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">CEP {cepLoading && <span className="text-xs text-muted-foreground">(buscando...)</span>}</span>
              <input value={addr.zip} onChange={(e) => onZipChange(e.target.value)} required inputMode="numeric" placeholder="00000-000"
                className="w-full rounded-md border border-border bg-input px-3 py-2 outline-none focus:border-primary" />
              {cepError && <span className="mt-1 block text-xs text-destructive">{cepError}</span>}
            </label>
            <Input label="Rua" value={addr.street} onChange={v => setAddr({ ...addr, street: v })} required />
            <Input label="Número" value={addr.number} onChange={v => setAddr({ ...addr, number: v })} required />
            <Input label="Complemento" value={addr.complement ?? ""} onChange={v => setAddr({ ...addr, complement: v })} />
            <Input label="Bairro" value={addr.district} onChange={v => setAddr({ ...addr, district: v })} required />
            <Input label="Cidade" value={addr.city} onChange={v => setAddr({ ...addr, city: v })} required />
            <Input label="Estado (UF)" value={addr.state} onChange={v => setAddr({ ...addr, state: v })} required />
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Observações (opcional)</span>
            <textarea value={addr.notes ?? ""} onChange={(e) => setAddr({ ...addr, notes: e.target.value })} rows={3}
              className="w-full rounded-md border border-border bg-input px-3 py-2 outline-none focus:border-primary" />
          </label>
        </div>
        <aside className="h-fit space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg">Resumo</h2>
          <ul className="space-y-2 text-sm">
            {data.lines.map(l => (
              <li key={l.product.id} className="flex justify-between gap-2">
                <span className="line-clamp-1">{l.qty}x {l.product.name}</span>
                <span className="shrink-0 font-semibold">{formatPrice(l.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-3 font-display text-xl">
            <span>Total</span><span className="text-primary">{formatPrice(data.total)}</span>
          </div>
          <button disabled={busy} className="w-full rounded-md bg-[var(--whatsapp)] py-3 font-bold text-[var(--whatsapp-foreground)] hover:brightness-110 disabled:opacity-60">
            {busy ? "Processando..." : "Enviar pedido pelo WhatsApp"}
          </button>
          <p className="text-center text-xs text-muted-foreground">Seu pedido será registrado na sua conta e enviado para nosso WhatsApp para combinar o pagamento.</p>
        </aside>
      </form>
    </div>
  );
}

function Input({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full rounded-md border border-border bg-input px-3 py-2 outline-none focus:border-primary" />
    </label>
  );
}
