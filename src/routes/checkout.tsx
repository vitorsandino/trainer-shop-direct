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
      clearCart();
      // mensagem WhatsApp
      const msg = encodeURIComponent(
        `Olá! Acabei de fazer um pedido na Pandex.\n` +
        `Pedido: ${order.code}\nNome: ${user.name}\nTotal: ${formatPrice(order.total)}\n` +
        data.lines.map(l => `• ${l.qty}x ${l.product.name}`).join("\n")
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
            <Input label="CEP" value={addr.zip} onChange={v => setAddr({ ...addr, zip: v })} required />
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
          <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {busy ? "Processando..." : "Confirmar pedido"}
          </button>
          <p className="text-center text-xs text-muted-foreground">Você será redirecionado para o WhatsApp para combinar pagamento.</p>
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
