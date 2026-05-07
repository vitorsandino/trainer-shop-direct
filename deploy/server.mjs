// Serves the Cloudflare Worker build on Node via Miniflare (workerd).
import { Miniflare, Response as MFResponse } from "miniflare";
import { createServer } from "node:http";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { resolve, dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

// locate the built worker entry
const assetsDir = resolve(root, "dist/server/assets");
const entryFile = readdirSync(assetsDir).find((f) => f.startsWith("worker-entry") && f.endsWith(".js"));
if (!entryFile) throw new Error("worker-entry not found in dist/server/assets");
const scriptPath = join(assetsDir, entryFile);

const clientDir = resolve(root, "dist/client");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function tryServeStatic(pathname) {
  if (!pathname || pathname === "/") return null;
  const safe = pathname.replace(/\.\./g, "");
  const filePath = join(clientDir, safe);
  if (!existsSync(filePath)) return null;
  const st = statSync(filePath);
  if (!st.isFile()) return null;
  const data = readFileSync(filePath);
  const type = mimeTypes[extname(filePath)] || "application/octet-stream";
  return new MFResponse(data, {
    status: 200,
    headers: {
      "content-type": type,
      "cache-control": pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600",
    },
  });
}

const mf = new Miniflare({
  modules: true,
  scriptPath,
  modulesRoot: root,
  modulesRules: [
    { type: "ESModule", include: ["**/*.js", "**/*.mjs"], fallthrough: true },
  ],
  compatibilityDate: "2025-09-24",
  compatibilityFlags: ["nodejs_compat"],
});

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // 1) try static client asset first
    const staticResp = tryServeStatic(url.pathname);
    let response;
    if (staticResp) {
      response = staticResp;
    } else {
      // 2) forward to worker for SSR / server functions
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
        else if (v) headers.set(k, String(v));
      }
      const body =
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : await new Promise((r) => {
              const chunks = [];
              req.on("data", (c) => chunks.push(c));
              req.on("end", () => r(Buffer.concat(chunks)));
            });
      response = await mf.dispatchFetch(url.toString(), {
        method: req.method,
        headers,
        body,
        redirect: "manual",
      });
    }

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
  console.log(`Server listening on http://${host}:${port}`);
});

const shutdown = async () => {
  await mf.dispose();
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
