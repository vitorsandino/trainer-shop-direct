import { Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/products";
import logo from "@/assets/pandex-logo.png";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Pandex Store" width={40} height={40} className="h-10 w-10" />
            <span className="font-display text-xl">Pandex Store</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">A loja do panda fofo do Pokémon TCG. Atendimento direto via WhatsApp.</p>
        </div>
        <div className="text-sm">
          <h4 className="mb-3 font-display text-base">Categorias</h4>
          <ul className="space-y-2 text-muted-foreground">
            {CATEGORIES.map(c => (
              <li key={c.value}>
                <Link to="/categoria/$slug" params={{ slug: c.value }} className="hover:text-primary">{c.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="mb-3 font-display text-base">Loja</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Início</Link></li>
            <li><Link to="/buscar" search={{ q: "" }} className="hover:text-primary">Buscar</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="mb-3 font-display text-base">Admin</h4>
          <Link to="/admin" className="text-muted-foreground hover:text-primary">Painel</Link>
        </div>
      </div>
      <p className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Pandex Store. Pokémon e nomes relacionados são marcas registradas dos respectivos donos.
      </p>
    </footer>
  );
}
