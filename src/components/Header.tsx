import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Menu, X, Instagram, Facebook, Youtube, ShoppingCart, User, ChevronDown, LogOut, Package } from "lucide-react";
import { useState } from "react";
import { WHATSAPP_NUMBER } from "@/lib/products";
import { useAuth, useCartCount } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import logo from "@/assets/pandex-logo.png";

export function Header() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const user = useAuth();
  const count = useCartCount();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate({ to: "/buscar", search: { q: q.trim() } });
  };

  return (
    <header className="sticky top-0 z-50 shadow-sm">
      {/* Top bar */}
      <div className="bg-[var(--topbar)] text-[var(--topbar-foreground)]">
        <div className="container mx-auto flex h-10 items-center justify-between gap-3 px-4 text-xs">
          <span className="hidden sm:inline">🐼 Bem-vindo à Pandex Store — Pokémon TCG no Brasil</span>
          <div className="flex items-center gap-3">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-7 w-7 place-items-center rounded-full bg-white/15 hover:bg-white/25"><Instagram className="h-3.5 w-3.5" /></a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-7 w-7 place-items-center rounded-full bg-white/15 hover:bg-white/25 text-[10px] font-bold">W</a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-7 w-7 place-items-center rounded-full bg-white/15 hover:bg-white/25"><Facebook className="h-3.5 w-3.5" /></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="grid h-7 w-7 place-items-center rounded-full bg-white/15 hover:bg-white/25"><Youtube className="h-3.5 w-3.5" /></a>
            <span className="mx-2 hidden h-4 w-px bg-white/30 sm:inline" />
            {user ? (
              <div className="group relative hidden sm:block">
                <button className="inline-flex items-center gap-1 hover:underline">
                  <User className="h-3.5 w-3.5" /> {user.name.split(" ")[0]} <ChevronDown className="h-3 w-3" />
                </button>
                <div className="invisible absolute right-0 top-full z-50 min-w-[180px] rounded-md border border-border bg-card py-2 text-foreground opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                  <Link to="/conta" className="block px-4 py-2 text-sm hover:bg-muted">Minha conta</Link>
                  <Link to="/conta/pedidos" className="block px-4 py-2 text-sm hover:bg-muted">Meus pedidos</Link>
                  <button onClick={() => { logout(); navigate({ to: "/" }); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted">
                    <LogOut className="h-3.5 w-3.5" /> Sair
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hidden items-center gap-1 hover:underline sm:inline-flex"><User className="h-3.5 w-3.5" /> Entrar</Link>
            )}
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto flex h-20 items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Pandex Store" width={48} height={48} className="h-12 w-12" />
            <div className="leading-tight">
              <span className="block font-display text-xl text-foreground">Pandex</span>
              <span className="block -mt-1 font-display text-sm text-primary">Store</span>
            </div>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            <Link to="/" className="rounded-md px-3 py-2 text-sm font-bold text-secondary" activeOptions={{ exact: true }} activeProps={{ className: "rounded-md px-3 py-2 text-sm font-bold text-secondary" }} inactiveProps={{ className: "rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary" }}>
              Início
            </Link>

            <Link to="/categoria/$slug" params={{ slug: "booster" }} className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary">
              Boosters
            </Link>
            <Link to="/categoria/$slug" params={{ slug: "avulsas" }} className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary">
              Cartas
            </Link>

            <Link to="/contato" className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary">
              Contato
            </Link>
          </nav>

          <form onSubmit={submit} className="ml-auto hidden flex-1 max-w-sm md:block">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full rounded-full border border-border bg-input py-2.5 pl-4 pr-12 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button type="submit" aria-label="Buscar" className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground hover:brightness-110">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          <Link to="/carrinho" aria-label="Carrinho" className="relative hidden h-11 w-11 place-items-center rounded-full bg-secondary text-secondary-foreground shadow md:grid">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{count}</span>
          </Link>

          <button onClick={() => setOpen(!open)} className="ml-auto rounded-md p-2 lg:hidden" aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-b border-border bg-card lg:hidden">
          <div className="container mx-auto space-y-3 px-4 py-3">
            <form onSubmit={submit}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full rounded-full border border-border bg-input py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
                />
              </div>
            </form>
            <Link to="/" onClick={() => setOpen(false)} className="block rounded-md bg-muted px-3 py-2 text-sm font-semibold">Início</Link>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/categoria/$slug" params={{ slug: "booster" }} onClick={() => setOpen(false)} className="rounded-md bg-muted px-3 py-2 text-sm">Boosters</Link>
              <Link to="/categoria/$slug" params={{ slug: "avulsas" }} onClick={() => setOpen(false)} className="rounded-md bg-muted px-3 py-2 text-sm">Cartas</Link>
              <Link to="/contato" onClick={() => setOpen(false)} className="rounded-md bg-muted px-3 py-2 text-sm">Contato</Link>
            </div>
            <Link to="/carrinho" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground">
              <span className="inline-flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Carrinho</span>
              <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">{count}</span>
            </Link>
            {user ? (
              <>
                <Link to="/conta" onClick={() => setOpen(false)} className="block rounded-md border border-border px-3 py-2 text-sm">Minha conta</Link>
                <Link to="/conta/pedidos" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <Package className="h-4 w-4" /> Meus pedidos
                </Link>
                <button onClick={() => { logout(); setOpen(false); navigate({ to: "/" }); }} className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground">
                Entrar / Criar conta
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
