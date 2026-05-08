import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Menu, X, Instagram, ShoppingCart, User, ChevronDown, LogOut, Package, MessageCircle } from "lucide-react";
import { useState } from "react";
import { WHATSAPP_NUMBER } from "@/lib/products";
import { useAuth, useCartCount } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import logoH from "@/assets/pandex-logo-horizontal.png";

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

  const navLink = "relative rounded-full px-4 py-2 text-sm font-semibold text-foreground/70 transition hover:text-foreground";
  const navLinkActive = "relative rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-sm";

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar — preto absoluto */}
      <div className="bg-[var(--topbar)] text-[var(--topbar-foreground)]">
        <div className="container mx-auto flex h-9 items-center justify-between gap-3 px-4 text-[11px] tracking-wide">
          <span className="hidden sm:inline">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--neon)] align-middle shadow-[0_0_8px_var(--neon)]" />
            Frete rápido · Originais lacrados · Atendimento humano
          </span>
          <div className="flex items-center gap-2">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-6 w-6 place-items-center rounded-full transition hover:bg-white/15"><Instagram className="h-3.5 w-3.5" /></a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-6 w-6 place-items-center rounded-full transition hover:bg-white/15"><MessageCircle className="h-3.5 w-3.5" /></a>
            <span className="mx-2 hidden h-3.5 w-px bg-white/25 sm:inline" />
            {user ? (
              <div className="group relative hidden sm:block">
                <button className="inline-flex items-center gap-1 hover:text-[var(--neon)]">
                  <User className="h-3.5 w-3.5" /> {user.name.split(" ")[0]} <ChevronDown className="h-3 w-3" />
                </button>
                <div className="invisible absolute right-0 top-full z-50 min-w-[200px] rounded-xl border border-border bg-card py-2 text-foreground opacity-0 shadow-[var(--shadow-pop)] transition group-hover:visible group-hover:opacity-100">
                  <Link to="/conta" className="block px-4 py-2 text-sm hover:bg-muted">Minha conta</Link>
                  <Link to="/conta/pedidos" className="block px-4 py-2 text-sm hover:bg-muted">Meus pedidos</Link>
                  <button onClick={() => { logout(); navigate({ to: "/" }); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted">
                    <LogOut className="h-3.5 w-3.5" /> Sair
                  </button>
                </div>
              </div>
            ) : user === null ? (
              <Link to="/login" className="hidden items-center gap-1 hover:text-[var(--neon)] sm:inline-flex"><User className="h-3.5 w-3.5" /> Entrar</Link>
            ) : (
              <span className="hidden text-[11px] text-white/70 sm:inline">…</span>
            )}
          </div>
        </div>
      </div>

      {/* Main bar — branco minimal */}
      <div className="border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="container mx-auto flex h-24 items-center gap-4 px-4">
          <Link to="/" aria-label="Pandex Store" className="flex items-center transition-transform hover:scale-105">
            <img src={logoH} alt="Pandex Store" className="h-16 md:h-20 w-auto object-contain" />
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            <Link to="/" className={path === "/" ? navLinkActive : navLink}>Início</Link>
            <Link to="/categoria/$slug" params={{ slug: "booster" }} className={path.includes("/categoria/booster") ? navLinkActive : navLink}>Boosters</Link>
            <Link to="/categoria/$slug" params={{ slug: "avulsas" }} className={path.includes("/categoria/avulsas") ? navLinkActive : navLink}>Cartas</Link>
            <Link to="/contato" className={path === "/contato" ? navLinkActive : navLink}>Contato</Link>
          </nav>

          <form onSubmit={submit} className="ml-auto hidden flex-1 max-w-sm md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full rounded-full border border-border bg-secondary py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-foreground focus:bg-card focus:ring-2 focus:ring-foreground/10"
              />
            </div>
          </form>

          <Link to="/carrinho" aria-label="Carrinho" className="relative hidden h-11 w-11 place-items-center rounded-full bg-foreground text-background shadow-md transition hover:scale-105 md:grid">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--neon)] text-[10px] font-bold text-foreground ring-2 ring-card">{count}</span>
            )}
          </Link>

          <button onClick={() => setOpen(!open)} className="ml-auto rounded-full p-2 lg:hidden" aria-label="Menu">
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
                  className="w-full rounded-full border border-border bg-secondary py-2 pl-9 pr-4 text-sm outline-none focus:border-foreground"
                />
              </div>
            </form>
            <Link to="/" onClick={() => setOpen(false)} className="block rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">Início</Link>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/categoria/$slug" params={{ slug: "booster" }} onClick={() => setOpen(false)} className="rounded-full bg-secondary px-4 py-2 text-center text-sm font-semibold">Boosters</Link>
              <Link to="/categoria/$slug" params={{ slug: "avulsas" }} onClick={() => setOpen(false)} className="rounded-full bg-secondary px-4 py-2 text-center text-sm font-semibold">Cartas</Link>
              <Link to="/contato" onClick={() => setOpen(false)} className="col-span-2 rounded-full bg-secondary px-4 py-2 text-center text-sm font-semibold">Contato</Link>
            </div>
            <Link to="/carrinho" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
              <span className="inline-flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Carrinho</span>
              <span className="rounded-full bg-[var(--neon)] px-2 text-xs text-foreground">{count}</span>
            </Link>
            {user ? (
              <>
                <Link to="/conta" onClick={() => setOpen(false)} className="block rounded-full border border-border px-4 py-2 text-sm">Minha conta</Link>
                <Link to="/conta/pedidos" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm">
                  <Package className="h-4 w-4" /> Meus pedidos
                </Link>
                <button onClick={() => { logout(); setOpen(false); navigate({ to: "/" }); }} className="flex w-full items-center gap-2 rounded-full border border-border px-4 py-2 text-sm">
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </>
            ) : user === null ? (
              <Link to="/login" onClick={() => setOpen(false)} className="block rounded-full bg-foreground px-4 py-2 text-center text-sm font-semibold text-background">
                Entrar / Criar conta
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
