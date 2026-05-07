import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { updateProfile } from "@/lib/auth";

export const Route = createFileRoute("/conta/")({
  component: ProfilePage,
});

function ProfilePage() {
  const user = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saved, setSaved] = useState(false);
  if (!user) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 font-display text-xl">Meu perfil</h2>
      <form onSubmit={(e) => { e.preventDefault(); updateProfile({ name, phone }); setSaved(true); setTimeout(() => setSaved(false), 1500); }}
        className="space-y-3 max-w-md">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Nome</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-border bg-input px-3 py-2" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">E-mail</span>
          <input value={user.email} disabled className="w-full rounded-md border border-border bg-muted px-3 py-2 text-muted-foreground" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Celular</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border border-border bg-input px-3 py-2" />
        </label>
        <button className="rounded-md bg-primary px-6 py-2.5 font-semibold text-primary-foreground hover:opacity-90">Salvar</button>
        {saved && <span className="ml-3 text-sm text-primary">✓ Salvo</span>}
      </form>
    </div>
  );
}
