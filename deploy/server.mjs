// Servidor de produção: Node HTTP na frente do Miniflare.
// - Endpoints /api/email/* são tratados pelo Node usando nodemailer
//   (Cloudflare Worker não suporta SMTP/TCP).
// - Todo o resto é encaminhado para o Miniflare (SSR + assets).
import { Miniflare, Log, LogLevel } from "miniflare";
import { unstable_getMiniflareWorkerOptions } from "wrangler";
import nodemailer from "nodemailer";
import http from "node:http";
import crypto from "node:crypto";
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
// Mescla envFromFile no process.env para uso direto pelo Node (nodemailer)
for (const [k, v] of Object.entries(envFromFile)) {
  if (process.env[k] == null || process.env[k] === "") process.env[k] = v;
}

const passKeys = [
  "SMTP_HOST","SMTP_PORT","SMTP_USER","SMTP_PASS","SMTP_FROM",
];
const injectedBindings = {};
for (const k of passKeys) {
  const v = process.env[k];
  if (v != null && v !== "") injectedBindings[k] = v;
}

const mf = new Miniflare({
  log: new Log(LogLevel.INFO),
  modules: true,
  scriptPath: main,
  modulesRoot: distServer,
  ...workerOptions,
  bindings: { ...(workerOptions.bindings || {}), ...injectedBindings },
});

await mf.ready;

// ============= Email (nodemailer no Node) =============

let _transporter = null;
function transporter() {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error("SMTP não configurado (defina SMTP_HOST, SMTP_USER, SMTP_PASS)");
  _transporter = nodemailer.createTransport({
    host, port, secure: port === 465, auth: { user, pass },
  });
  return _transporter;
}

async function sendMail(to, subject, html) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter().sendMail({
    from: `Pandex Store <${from}>`,
    to, subject, html,
  });
}

function tokenSecret() {
  return process.env.SMTP_PASS || process.env.SMTP_USER || "pandex-fallback-secret";
}
function makeToken(email) {
  const exp = Date.now() + 60 * 60 * 1000;
  const payload = `${email}.${exp}`;
  const sig = crypto.createHmac("sha256", tokenSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64").replace(/=+$/, "");
}
function verifyToken(token) {
  try {
    const decoded = Buffer.from(token + "===".slice((token.length + 3) % 4), "base64").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length < 3) return null;
    const sig = parts.pop();
    const expStr = parts.pop();
    const email = parts.join(".");
    if (!email || !expStr || !sig) return null;
    const expected = crypto.createHmac("sha256", tokenSecret()).update(`${email}.${expStr}`).digest("hex");
    if (sig !== expected) return null;
    if (Date.now() > Number(expStr)) return null;
    return { email };
  } catch { return null; }
}

// Templates ficam embutidos aqui (versão Node) para não depender do bundle do Worker.
const BRAND = {
  name: "Pandex Store", primary: "#2f9e6b", primaryDark: "#1f6b48",
  bg: "#f7faf7", text: "#1f2a26", muted: "#6b7a72", border: "#dfe7e2",
  site: process.env.PUBLIC_SITE_URL || "https://pandexstore.com.br",
};
function shell(title, body) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(31,107,72,0.12);border:1px solid ${BRAND.border};">
<tr><td style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.primaryDark});padding:28px 32px;text-align:center;">
<div style="font-size:28px;font-weight:800;letter-spacing:1px;color:#fff;">🐼 ${BRAND.name}</div></td></tr>
<tr><td style="padding:32px;">${body}</td></tr>
<tr><td style="background:#f3f7f4;padding:20px 32px;border-top:1px solid ${BRAND.border};text-align:center;color:${BRAND.muted};font-size:12px;">
© ${new Date().getFullYear()} ${BRAND.name}.</td></tr>
</table></td></tr></table></body></html>`;
}
const btn = (href, label) => `<div style="text-align:center;margin:24px 0;"><a href="${href}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:10px;font-size:15px;">${label}</a></div>`;
const fmtBRL = (n) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function tplWelcome(name) {
  const first = (name || "").split(" ")[0] || "amigo(a)";
  return {
    subject: `Bem-vindo(a) à ${BRAND.name}, ${first}! 🐼`,
    html: shell("Bem-vindo", `<h1 style="margin:0 0 16px;font-size:24px;">Olá, ${first}! 🎉</h1>
      <p style="font-size:15px;line-height:1.6;">Sua conta na <strong>${BRAND.name}</strong> foi criada com sucesso.</p>
      ${btn(BRAND.site, "Visitar a loja")}`),
  };
}
function tplReset(url) {
  return {
    subject: `Redefinição de senha — ${BRAND.name}`,
    html: shell("Redefinir senha", `<h1 style="margin:0 0 16px;font-size:24px;">Redefinir sua senha 🔐</h1>
      <p style="font-size:15px;line-height:1.6;">Clique abaixo para criar uma nova senha (válido por 1 hora):</p>
      ${btn(url, "Criar nova senha")}
      <p style="font-size:13px;color:${BRAND.muted};word-break:break-all;">${url}</p>`),
  };
}
function tplOrderConfirm(o) {
  const rows = (o.items || []).map(i => `<tr><td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};"><strong>${i.name}</strong><br><span style="color:${BRAND.muted};font-size:12px;">Qtd: ${i.qty} × ${fmtBRL(i.price)}</span></td><td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};text-align:right;font-weight:600;">${fmtBRL(i.qty * i.price)}</td></tr>`).join("");
  const a = o.address || {};
  return {
    subject: `Pedido confirmado #${o.code} — ${BRAND.name}`,
    html: shell("Pedido confirmado", `<h1 style="margin:0 0 16px;font-size:24px;">Obrigado pela compra! 🎁</h1>
      <p>Recebemos seu pedido <strong>#${o.code}</strong>.</p>
      <table width="100%" cellpadding="0" cellspacing="0">${rows}
      <tr><td style="padding:14px 0;font-weight:700;">Total</td><td style="padding:14px 0;text-align:right;font-weight:800;color:${BRAND.primary};">${fmtBRL(o.total)}</td></tr></table>
      <div style="margin-top:18px;font-size:14px;line-height:1.6;"><strong>Entrega:</strong><br>${a.fullName || ""}<br>${a.street || ""}, ${a.number || ""}${a.complement ? " — " + a.complement : ""}<br>${a.district || ""} — ${a.city || ""}/${a.state || ""}<br>CEP ${a.zip || ""}</div>`),
  };
}
function tplOrderStatus(o) {
  const labels = {
    pago: "Pagamento confirmado ✅", preparacao: "Pedido em preparação 📦",
    enviado: "Pedido enviado 🚚", entregue: "Pedido entregue 🎉",
    cancelado: "Pedido cancelado", pendente: "Pedido recebido",
  };
  const title = labels[o.status] || `Status atualizado: ${o.status}`;
  const tracking = o.trackingCode
    ? `<div style="background:${BRAND.bg};border-radius:12px;padding:16px;margin:18px 0;text-align:center;"><div style="color:${BRAND.muted};font-size:12px;">Código de rastreio</div><div style="font-family:monospace;font-size:18px;font-weight:700;margin-top:6px;">${o.trackingCode}</div></div>` : "";
  return {
    subject: `${title} — Pedido #${o.code}`,
    html: shell("Status do pedido", `<h1 style="margin:0 0 16px;font-size:24px;">${title}</h1>
      <p>Olá, ${(o.userName || "").split(" ")[0] || ""}!</p>
      <p>Pedido: <strong>#${o.code}</strong></p>${tracking}`),
  };
}

async function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}
function jsonRes(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function handleEmail(req, res, route) {
  try {
    const body = await readJson(req);
    if (route === "welcome") {
      const { email, name } = body;
      if (!email || !name) return jsonRes(res, 400, { error: "email e name obrigatórios" });
      const t = tplWelcome(name);
      await sendMail(email, t.subject, t.html);
      return jsonRes(res, 200, { ok: true });
    }
    if (route === "order-confirmation") {
      const { email } = body;
      if (!email) return jsonRes(res, 400, { error: "email obrigatório" });
      const t = tplOrderConfirm(body);
      await sendMail(email, t.subject, t.html);
      return jsonRes(res, 200, { ok: true });
    }
    if (route === "order-status") {
      const { email } = body;
      if (!email) return jsonRes(res, 400, { error: "email obrigatório" });
      const t = tplOrderStatus(body);
      await sendMail(email, t.subject, t.html);
      return jsonRes(res, 200, { ok: true });
    }
    if (route === "request-reset") {
      const { email, origin } = body;
      if (!email || !origin) return jsonRes(res, 400, { error: "email e origin obrigatórios" });
      const token = makeToken(String(email).toLowerCase());
      const url = `${String(origin).replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
      const t = tplReset(url);
      await sendMail(email, t.subject, t.html);
      return jsonRes(res, 200, { ok: true });
    }
    if (route === "verify-reset") {
      const { token } = body;
      if (!token) return jsonRes(res, 400, { error: "token obrigatório" });
      const v = verifyToken(token);
      if (!v) return jsonRes(res, 400, { error: "Link inválido ou expirado" });
      return jsonRes(res, 200, { ok: true, email: v.email });
    }
    return jsonRes(res, 404, { error: "rota desconhecida" });
  } catch (e) {
    console.error("[email]", route, e);
    return jsonRes(res, 500, { error: e?.message || "Erro ao enviar e-mail" });
  }
}

// ============= HTTP server (Node na frente, Miniflare atrás) =============

const nodeServer = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || HOST}`);

    // Endpoints de e-mail tratados pelo Node
    if (url.pathname.startsWith("/api/email/") && req.method === "POST") {
      const route = url.pathname.replace("/api/email/", "");
      return handleEmail(req, res, route);
    }

    // Repasse para Miniflare
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach(vv => headers.append(k, vv));
      else if (v != null) headers.set(k, String(v));
    }
    const init = { method: req.method, headers };
    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", c => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
      init.duplex = "half";
    }
    const mfRes = await mf.dispatchFetch(url.toString(), init);
    res.writeHead(mfRes.status, Object.fromEntries(mfRes.headers));
    if (mfRes.body) {
      const reader = mfRes.body.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    }
    res.end();
  } catch (e) {
    console.error("[server]", e);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

nodeServer.listen(PORT, HOST, () => {
  console.log(`✅ Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`   • E-mail (Node):  /api/email/*`);
  console.log(`   • SSR/Assets:     proxied → Miniflare`);
});

const shutdown = async () => {
  console.log("Encerrando…");
  await mf.dispose();
  nodeServer.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
