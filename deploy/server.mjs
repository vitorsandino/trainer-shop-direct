// Servidor de produção: inicia o runtime a partir da configuração gerada no build,
// preservando a ordem correta entre SSR e assets.
import { Miniflare, Log, LogLevel } from "miniflare";
import { unstable_getMiniflareWorkerOptions } from "wrangler";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distServer = path.join(root, "dist", "server");
const wranglerJson = path.join(distServer, "wrangler.json");

if (!fs.existsSync(wranglerJson)) {
  console.error("ERRO: não encontrei", wranglerJson, "— rode `bun run build` antes.");
  process.exit(1);
}

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";

const { main, workerOptions } = await unstable_getMiniflareWorkerOptions(wranglerJson);

// Carrega .env (se existir) e injeta no Worker como bindings de env
const envFile = path.join(root, ".env");
const envFromFile = {};
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    envFromFile[m[1]] = v;
  }
}
const passKeys = [
  "SMTP_HOST","SMTP_PORT","SMTP_USER","SMTP_PASS","SMTP_FROM",
  "MY_SUPABASE_URL","MY_SUPABASE_ANON_KEY","MY_SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_URL","VITE_SUPABASE_PUBLISHABLE_KEY","VITE_SUPABASE_ANON_KEY",
];
const injectedBindings = {};
for (const k of passKeys) {
  const v = process.env[k] ?? envFromFile[k];
  if (v != null && v !== "") injectedBindings[k] = v;
}

const mf = new Miniflare({
  log: new Log(LogLevel.INFO),
  host: HOST,
  port: PORT,
  modules: true,
  scriptPath: main,
  modulesRoot: distServer,
  ...workerOptions,
  bindings: { ...(workerOptions.bindings || {}), ...injectedBindings },
});

await mf.ready;
console.log(`✅ Worker rodando em http://${HOST}:${PORT}`);

const shutdown = async () => {
  console.log("Encerrando…");
  await mf.dispose();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
