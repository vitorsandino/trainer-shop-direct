import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Menu, X, Instagram, User, ChevronDown, LogOut, Package, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, WHATSAPP_NUMBER, getProducts, subscribeProducts, type Product } from "@/lib/products";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import logoH from "@/assets/pandex-logo-horizontal.png";

export function Header() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const user = useAuth();

  useEffect(() => {
    const refresh = () => setProducts(getProducts());
    refresh();
    return subscribeProducts(refresh);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term))
      .slice(0, 6);
  }, [q, products]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      setFocused(false);
      navigate({ to: "/buscar", search: { q: q.trim() } });
    }
  };

  const navLink = "rounded-full px-3.5 py-1.5 text-sm font-medium text-foreground/70 transition hover:text-foreground hover:bg-secondary";
  const navLinkActive = "rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground";

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-[var(--topbar)] text-[var(--topbar-foreground)]">
        <div className="container mx-auto flex h-8 items-center justify-between gap-3 px-4 text-[11px]">
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--whatsapp)] shadow-[0_0_8px_var(--whatsapp)]" />
            Atendimento via WhatsApp · Produtos originais · Postagem rápida
          </span>
          <div className="flex items-center gap-1">
            <a href="https://instagram.com/pandex.store" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-6 w-6 place-items-center rounded-full transition hover:bg-white/10"><Instagram className="h-3.5 w-3.5" /></a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-6 w-6 place-items-center rounded-full transition hover:bg-white/10"><MessageCircle className="h-3.5 w-3.5" /></a>
            {user ? (
              <div className="group relative ml-2 hidden sm:block">
                <button className="inline-flex items-center gap-1 hover:text-[var(--highlight)]">
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
              <Link to="/login" className="ml-2 hidden items-center gap-1 hover:text-[var(--highlight)] sm:inline-flex"><User className="h-3.5 w-3.5" /> Entrar</Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center gap-4 px-4 md:h-24">
          <Link to="/" aria-label="Pandex Store" className="flex items-center transition-transform hover:scale-105">
            <img src={logoH} alt="Pandex Store" className="h-14 w-auto object-contain md:h-20" />
          </Link>

          <nav className="ml-2 hidden items-center gap-1 lg:flex">
            <Link to="/" className={path === "/" ? navLinkActive : navLink}>Início</Link>
            {CATEGORIES.slice(0, 4).map(c => (
              <Link key={c.value} to="/categoria/$slug" params={{ slug: c.value }}
                className={path.includes(`/categoria/${c.value}`) ? navLinkActive : navLink}>
                {c.label}
              </Link>
            ))}
            <Link to="/contato" className={path === "/contato" ? navLinkActive : navLink}>Contato</Link>
          </nav>

          <div ref={wrapRef} className="relative ml-auto hidden flex-1 max-w-md md:block">
            <form onSubmit={submit}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => setFocused(true)}
                  placeholder="Buscar boosters, ETBs, coleções..."
                  className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </form>
            {focused && q.trim() && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-pop)]">
                {suggestions.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum resultado para "{q}"</p>
                ) : (
                  <>
                    {suggestions.map(p => (
                      <Link
                        key={p.id}
                        to="/produto/$id"
                        params={{ id: p.id }}
                        onClick={() => { setFocused(false); setQ(""); }}
                        className="flex items-center gap-3 border-b border-border/50 px-3 py-2.5 last:border-0 hover:bg-muted"
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                          {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-contain" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-[var(--highlight)]">{p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                        </div>
                      </Link>
                    ))}
                    <button onClick={submit} className="block w-full bg-muted px-4 py-2.5 text-center text-xs font-semibold text-foreground hover:bg-secondary">
                      Ver todos os resultados →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

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
                  className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
                />
              </div>
            </form>
            <Link to="/" onClick={() => setOpen(false)} className="block rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground">Início</Link>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => (
                <Link key={c.value} to="/categoria/$slug" params={{ slug: c.value }} onClick={() => setOpen(false)} className="rounded-full bg-background px-4 py-2 text-center text-sm font-semibold border border-border">
                  {c.label}
                </Link>
              ))}
              <Link to="/contato" onClick={() => setOpen(false)} className="col-span-2 rounded-full bg-background px-4 py-2 text-center text-sm font-semibold border border-border">Contato</Link>
            </div>
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
              <Link to="/login" onClick={() => setOpen(false)} className="block rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground">
                Entrar / Criar conta
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
