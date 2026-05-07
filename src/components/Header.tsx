import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Menu, X, Instagram, Facebook, Youtube, ShoppingCart, User, ChevronDown } from "lucide-react";
import { useState } from "react";
import { CATEGORIES, WHATSAPP_NUMBER, getCategories } from "@/lib/products";
import logo from "@/assets/pandex-logo.png";

export function Header() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

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
            <a href="#" className="hidden items-center gap-1 hover:underline sm:inline-flex"><User className="h-3.5 w-3.5" /> Login</a>
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

            <div className="group relative">
              <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary">
                Sobre <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <div className="invisible absolute left-0 top-full z-50 min-w-[180px] rounded-md border border-border bg-card py-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                <a href="#sobre" className="block px-4 py-2 text-sm hover:bg-muted">A loja</a>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm hover:bg-muted">Atendimento</a>
              </div>
            </div>

            <Link to="/categoria/$slug" params={{ slug: "booster" }} className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary">
              Boosters
            </Link>
            <Link to="/categoria/$slug" params={{ slug: "avulsas" }} className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary">
              Cartas
            </Link>

            <div className="group relative">
              <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary">
                Produtos <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <div className="invisible absolute left-0 top-full z-50 min-w-[200px] rounded-md border border-border bg-card py-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                {getCategories().map(c => (
                  <Link key={c.value} to="/categoria/$slug" params={{ slug: c.value }} className="block px-4 py-2 text-sm hover:bg-muted">
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>

            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary">
              Contato
            </a>
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

          <button aria-label="Carrinho" className="relative hidden h-11 w-11 place-items-center rounded-full bg-secondary text-secondary-foreground shadow md:grid">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">0</span>
          </button>

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
              {CATEGORIES.map(c => (
                <Link
                  key={c.value}
                  to="/categoria/$slug"
                  params={{ slug: c.value }}
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-muted px-3 py-2 text-sm"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
