import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { CATEGORIES } from "@/lib/products";

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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <span className="block h-2 w-2 rounded-full bg-background" />
          </span>
          <span className="hidden sm:inline">PokéTCG <span className="text-secondary">Store</span></span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {CATEGORIES.map(c => (
            <Link
              key={c.value}
              to="/categoria/$slug"
              params={{ slug: c.value }}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-card hover:text-foreground data-[active]:text-secondary"
              data-active={path === `/categoria/${c.value}` ? "" : undefined}
            >
              {c.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submit} className="ml-auto hidden flex-1 max-w-xs md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cards, boxes..."
              className="w-full rounded-full border border-border bg-input/60 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </form>

        <button onClick={() => setOpen(!open)} className="ml-auto rounded-md p-2 md:hidden" aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border md:hidden">
          <div className="container mx-auto space-y-2 px-4 py-3">
            <form onSubmit={submit}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full rounded-full border border-border bg-input/60 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
                />
              </div>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => (
                <Link
                  key={c.value}
                  to="/categoria/$slug"
                  params={{ slug: c.value }}
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-card px-3 py-2 text-sm"
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
