import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

type Item = {
  title: string;
  subtitle: string;
  badge?: string;
  gradient: string;
  search: string;
};

const ITEMS: Item[] = [
  {
    title: "Mega Evolução 1",
    subtitle: "Coleção clássica",
    gradient: "from-fuchsia-600 via-purple-700 to-indigo-900",
    search: "Mega Evolução 1",
  },
  {
    title: "Mega Evolução 2",
    subtitle: "Continuação épica",
    gradient: "from-emerald-500 via-teal-700 to-slate-900",
    search: "Mega Evolução 2",
  },
  {
    title: "Mega Evolução 3",
    subtitle: "Edição rara",
    gradient: "from-amber-400 via-orange-600 to-rose-900",
    search: "Mega Evolução 3",
  },
  {
    title: "Caos Ascendente",
    subtitle: "Volume 4",
    badge: "LANÇAMENTO",
    gradient: "from-red-600 via-rose-800 to-black",
    search: "Caos Ascendente",
  },
  {
    title: "GEM Pack China — Volume 5",
    subtitle: "Importado",
    badge: "IMPORTADO",
    gradient: "from-yellow-400 via-amber-600 to-red-800",
    search: "GEM Pack Volume 5",
  },
  {
    title: "Badge",
    subtitle: "Coleção exclusiva",
    gradient: "from-sky-500 via-blue-700 to-indigo-900",
    search: "Badge",
  },
];

export function CollectionsShowcase() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-secondary">Coleções em destaque</p>
          <h2 className="font-display text-2xl md:text-3xl">Mega Evolução, Caos Ascendente & mais</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {ITEMS.map((it) => (
          <Link
            key={it.title}
            to="/buscar"
            search={{ q: it.search }}
            className={`group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${it.gradient} transition hover:-translate-y-1 hover:border-secondary hover:shadow-[var(--shadow-glow)]`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
            <div className="absolute inset-0 bg-black/30 transition group-hover:bg-black/10" />

            {it.badge && (
              <span className="absolute left-3 top-3 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground shadow">
                {it.badge}
              </span>
            )}

            <Sparkles className="absolute right-4 top-4 h-5 w-5 text-white/70" />

            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-[10px] uppercase tracking-widest text-white/80">{it.subtitle}</p>
              <h3 className="mt-1 font-display text-base text-white drop-shadow-lg sm:text-lg md:text-xl">
                {it.title}
              </h3>
              <span className="mt-2 inline-block text-xs text-white/90 underline-offset-4 group-hover:underline">
                Ver produtos →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
