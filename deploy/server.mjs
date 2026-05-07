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

const mf = new Miniflare({
  log: new Log(LogLevel.INFO),
  host: HOST,
  port: PORT,
  scriptPath: main,
  modulesRoot: distServer,
  ...workerOptions,
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
