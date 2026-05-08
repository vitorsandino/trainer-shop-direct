import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle } from "lucide-react";
import { CATEGORIES, WHATSAPP_NUMBER } from "@/lib/products";
import logoH from "@/assets/pandex-logo-horizontal.png";

export function Footer() {
  return (
    <footer className="mt-20 bg-foreground text-background">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <img src={logoH} alt="Pandex Store" className="h-12 w-auto brightness-0 invert" />
          <p className="mt-4 max-w-xs text-sm text-white/60">
            Loja geek moderna — Pokémon TCG, colecionáveis e cultura geek com personalidade. Atendimento direto no WhatsApp.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition hover:border-[var(--neon)] hover:text-[var(--neon)]">
              <MessageCircle className="h-4 w-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition hover:border-[var(--neon)] hover:text-[var(--neon)]">
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="text-sm">
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Categorias</h4>
          <ul className="space-y-2.5 text-white/80">
            {CATEGORIES.map(c => (
              <li key={c.value}>
                <Link to="/categoria/$slug" params={{ slug: c.value }} className="transition hover:text-[var(--neon)]">{c.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-sm">
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Loja</h4>
          <ul className="space-y-2.5 text-white/80">
            <li><Link to="/" className="transition hover:text-[var(--neon)]">Início</Link></li>
            <li><Link to="/buscar" search={{ q: "" }} className="transition hover:text-[var(--neon)]">Buscar</Link></li>
            <li><Link to="/contato" className="transition hover:text-[var(--neon)]">Contato</Link></li>
            <li><Link to="/conta" className="transition hover:text-[var(--neon)]">Minha conta</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Atendimento</h4>
          <p className="text-white/70">WhatsApp</p>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
            className="font-display text-lg text-white transition hover:text-[var(--neon)]">
            +55 19 99610-8105
          </a>
          <p className="mt-3 text-xs text-white/50">Seg–Sex 9h–18h · Sáb 9h–13h</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="container mx-auto px-4 py-5 text-center text-[11px] tracking-wide text-white/40">
          © {new Date().getFullYear()} Pandex Store. Pokémon e nomes relacionados são marcas registradas dos respectivos donos.
        </p>
      </div>
    </footer>
  );
}
