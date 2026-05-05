import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card/40">
      <div className="container mx-auto grid gap-6 px-4 py-10 md:grid-cols-3">
        <div>
          <h3 className="font-display text-lg">PokéTCG Store</h3>
          <p className="mt-2 text-sm text-muted-foreground">Sua vitrine de Pokémon TCG. Pedidos finalizados via WhatsApp.</p>
        </div>
        <div className="text-sm">
          <h4 className="mb-2 font-semibold">Categorias</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link to="/categoria/$slug" params={{ slug: "booster" }}>Booster</Link></li>
            <li><Link to="/categoria/$slug" params={{ slug: "box" }}>Box</Link></li>
            <li><Link to="/categoria/$slug" params={{ slug: "colecoes" }}>Coleções</Link></li>
            <li><Link to="/categoria/$slug" params={{ slug: "avulsas" }}>Cards Avulsas</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="mb-2 font-semibold">Admin</h4>
          <Link to="/admin" className="text-muted-foreground hover:text-secondary">Painel de produtos</Link>
        </div>
      </div>
      <p className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PokéTCG Store. Pokémon e nomes relacionados são marcas registradas.
      </p>
    </footer>
  );
}
