// Servidor de produção: roda o Worker (dist/server) + assets estáticos (dist/client)
// usando Miniflare 4. Escuta em 127.0.0.1:PORT atrás do Nginx.
import { Miniflare, Log, LogLevel } from "miniflare";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distServer = path.join(root, "dist", "server");
const distClient = path.join(root, "dist", "client");
const wranglerJson = path.join(distServer, "wrangler.json");

if (!fs.existsSync(wranglerJson)) {
  console.error("ERRO: não encontrei", wranglerJson, "— rode `bun run build` antes.");
  process.exit(1);
}

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";

const mf = new Miniflare({
  log: new Log(LogLevel.INFO),
  host: HOST,
  port: PORT,
  modules: true,
  scriptPath: path.join(distServer, "index.js"),
  modulesRoot: distServer,
  modulesRules: [
    { type: "ESModule", include: ["**/*.js", "**/*.mjs"], fallthrough: true },
  ],
  compatibilityDate: "2025-09-24",
  compatibilityFlags: ["nodejs_compat"],
  assets: {
    directory: distClient,
  },
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
