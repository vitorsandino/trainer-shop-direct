import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import { LogOut, Package, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/conta")({
  component: AccountLayout,
});

function AccountLayout() {
  const user = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user === null) navigate({ to: "/login", search: { redirect: "/conta" } }); }, [user, navigate]);
  if (user === undefined) return <div className="container mx-auto px-4 py-16 text-center text-sm text-muted-foreground">Carregando conta...</div>;
  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Minha conta</h1>
          <p className="text-sm text-muted-foreground">Olá, {user.name}</p>
        </div>
        <button onClick={() => { logout(); navigate({ to: "/" }); }}
          className="flex items-center gap-2 self-start rounded-md border border-border px-3 py-2 text-sm hover:bg-card">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto rounded-lg border border-border bg-card p-2 lg:flex-col">
          <Link to="/conta" activeOptions={{ exact: true }}
            activeProps={{ className: "flex flex-shrink-0 items-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground" }}
            inactiveProps={{ className: "flex flex-shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-background" }}>
            <UserIcon className="h-4 w-4" /> Perfil
          </Link>
          <Link to="/conta/pedidos"
            activeProps={{ className: "flex flex-shrink-0 items-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground" }}
            inactiveProps={{ className: "flex flex-shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-background" }}>
            <Package className="h-4 w-4" /> Pedidos
          </Link>
        </nav>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
