// Serve o build Cloudflare Worker em Node usando Miniflare
import { Miniflare } from "miniflare";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

const scriptPath = resolve(root, "dist/server/worker-entry.js");
// fallback: locate the actual hashed worker-entry if vite emitted one
let script;
try {
  script = readFileSync(scriptPath, "utf8");
} catch {
  const fs = await import("node:fs");
  const dir = resolve(root, "dist/server/assets");
  const entry = fs.readdirSync(dir).find((f) => f.startsWith("worker-entry"));
  if (!entry) throw new Error("worker-entry not found in dist/server/assets");
  script = readFileSync(resolve(dir, entry), "utf8");
}

const mf = new Miniflare({
  modules: true,
  script,
  scriptPath: resolve(root, "dist/server/worker-entry.js"),
  compatibilityDate: "2025-09-24",
  compatibilityFlags: ["nodejs_compat"],
  // serve static client assets
  sitePath: resolve(root, "dist/client"),
});

const server = createServer(async (req, res) => {
  try {
    const url = `http://${req.headers.host}${req.url}`;
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
      else if (v) headers.set(k, v);
    }
    const body =
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await new Promise((r) => {
            const chunks = [];
            req.on("data", (c) => chunks.push(c));
            req.on("end", () => r(Buffer.concat(chunks)));
          });
    const response = await mf.dispatchFetch(url, {
      method: req.method,
      headers,
      body,
    });
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(port, host, () => {
  console.log(`Server on http://${host}:${port}`);
});
