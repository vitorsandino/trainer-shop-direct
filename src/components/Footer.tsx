import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, ExternalLink } from "lucide-react";
import { CATEGORIES, WHATSAPP_NUMBER } from "@/lib/products";
import logoH from "@/assets/pandex-logo-horizontal.png";

const MYPCARDS_URL = "https://mypcards.com/pandextcg";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary text-foreground">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <img src={logoH} alt="Pandex Store" className="h-14 w-auto object-contain" />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Catálogo premium de Pokémon TCG. Boosters, ETBs, coleções e cards originais lacrados. Atendimento humano direto no WhatsApp.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              className="grid h-10 w-10 place-items-center rounded-full border border-border transition hover:border-[var(--whatsapp)] hover:text-[var(--whatsapp)]">
              <MessageCircle className="h-4 w-4" />
            </a>
            <a href="https://instagram.com/pandex.store" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              className="grid h-10 w-10 place-items-center rounded-full border border-border transition hover:border-[var(--highlight)] hover:text-[var(--highlight)]">
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="text-sm">
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Categorias</h4>
          <ul className="space-y-2.5">
            {CATEGORIES.map(c => (
              <li key={c.value}>
                <Link to="/categoria/$slug" params={{ slug: c.value }} className="text-foreground/80 transition hover:text-[var(--highlight)]">{c.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-sm">
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Loja</h4>
          <ul className="space-y-2.5">
            <li><Link to="/" className="text-foreground/80 transition hover:text-[var(--highlight)]">Início</Link></li>
            <li><Link to="/buscar" search={{ q: "" }} className="text-foreground/80 transition hover:text-[var(--highlight)]">Buscar</Link></li>
            <li><Link to="/contato" className="text-foreground/80 transition hover:text-[var(--highlight)]">Contato</Link></li>
            <li><Link to="/conta" className="text-foreground/80 transition hover:text-[var(--highlight)]">Minha conta</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Atendimento</h4>
          <p className="text-muted-foreground">WhatsApp</p>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
            className="font-display text-lg text-foreground transition hover:text-[var(--whatsapp)]">
            +55 19 99610-8105
          </a>
          <p className="mt-3 text-xs text-muted-foreground">Seg–Sex 9h–18h · Sáb 9h–13h</p>
          <a href="https://instagram.com/pandex.store" target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--highlight)] hover:underline">
            <Instagram className="h-4 w-4" /> @pandex.store
          </a>
        </div>
      </div>

      <div className="border-t border-border">
        <p className="container mx-auto px-4 py-5 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Pandex Store. Pokémon e nomes relacionados são marcas registradas dos respectivos donos.
        </p>
      </div>
    </footer>
  );
}
