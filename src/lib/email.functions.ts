import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import {
  welcomeEmail,
  resetPasswordEmail,
  orderConfirmationEmail,
  orderStatusEmail,
} from "./email-templates";

let _transporter: nodemailer.Transporter | null = null;
function transporter() {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;
  if (!host || !user || !pass) throw new Error("SMTP não configurado");
  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return _transporter;
}

async function send(to: string, subject: string, html: string) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  const fromName = `Pandex Store <${from}>`;
  await transporter().sendMail({ from: fromName, to, subject, html });
}

// ---------- Welcome ----------
export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email(), name: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { subject, html } = welcomeEmail(data.name);
    await send(data.email, subject, html);
    return { ok: true };
  });

// ---------- Register (cria usuário já confirmado para evitar e-mail do Supabase) ----------
export const registerUserServer = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    email: z.string().email(),
    password: z.string().min(6).max(128),
    name: z.string().min(1).max(120),
    phone: z.string().max(40).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = admin();
    const { data: created, error } = await sb.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // <- não envia confirmação do Supabase
      user_metadata: { name: data.name, phone: data.phone ?? "" },
    });
    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        throw new Error("Este e-mail já está cadastrado");
      }
      throw new Error(error.message || "Não foi possível cadastrar");
    }
    // dispara welcome via SMTP (não bloqueia retorno)
    try {
      const { subject, html } = welcomeEmail(data.name);
      await send(data.email, subject, html);
    } catch (e) {
      console.warn("[email] welcome falhou:", e);
    }
    return { ok: true, userId: created.user?.id };
  });

// ---------- Order confirmation ----------
const orderItemSchema = z.object({
  name: z.string(), qty: z.number().int().positive(), price: z.number().nonnegative(), image: z.string().optional(),
});
const addrSchema = z.object({
  fullName: z.string(), street: z.string(), number: z.string(), complement: z.string().optional(),
  district: z.string(), city: z.string(), state: z.string(), zip: z.string(),
});

export const sendOrderConfirmation = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    email: z.string().email(),
    code: z.string().min(1).max(40),
    userName: z.string().min(1).max(120),
    items: z.array(orderItemSchema).min(1).max(50),
    total: z.number().nonnegative(),
    address: addrSchema,
  }).parse(d))
  .handler(async ({ data }) => {
    const { subject, html } = orderConfirmationEmail({
      code: data.code, userName: data.userName, items: data.items, total: data.total, address: data.address,
    });
    await send(data.email, subject, html);
    return { ok: true };
  });

// ---------- Order status ----------
export const sendOrderStatusUpdate = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    email: z.string().email(),
    code: z.string().min(1).max(40),
    userName: z.string().min(1).max(120),
    status: z.string().min(1).max(40),
    trackingCode: z.string().max(80).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { subject, html } = orderStatusEmail({
      code: data.code, userName: data.userName, status: data.status, trackingCode: data.trackingCode,
    });
    await send(data.email, subject, html);
    return { ok: true };
  });

// ---------- Password reset ----------
function admin() {
  const url =
    process.env.MY_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const key =
    process.env.MY_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Supabase URL ausente no servidor (defina SUPABASE_URL ou MY_SUPABASE_URL)");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente no servidor");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function tokenSecret() {
  return process.env.MY_SUPABASE_SERVICE_ROLE_KEY || process.env.SMTP_PASS || "pandex-fallback-secret";
}

async function makeToken(email: string, userId: string) {
  const exp = Date.now() + 60 * 60 * 1000; // 1h
  const payload = `${userId}.${email}.${exp}`;
  const sig = await hmac(tokenSecret(), payload);
  return btoa(`${payload}.${sig}`).replace(/=+$/, "");
}

async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const decoded = atob(token + "===".slice((token.length + 3) % 4));
    const parts = decoded.split(".");
    if (parts.length !== 4) return null;
    const [userId, email, expStr, sig] = parts;
    const expected = await hmac(tokenSecret(), `${userId}.${email}.${expStr}`);
    if (sig !== expected) return null;
    if (Date.now() > Number(expStr)) return null;
    return { userId, email };
  } catch { return null; }
}

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email(), origin: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    const sb = admin();
    // Procura usuário pelo e-mail
    const { data: list, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error("Falha ao consultar usuário");
    const user = list.users.find(u => (u.email || "").toLowerCase() === data.email.toLowerCase());
    // Por segurança, não revelamos se o e-mail existe
    if (!user) return { ok: true };

    const token = await makeToken(user.email!, user.id);
    const url = `${data.origin.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
    const { subject, html } = resetPasswordEmail(url);
    await send(user.email!, subject, html);
    return { ok: true };
  });

export const resetPassword = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().min(20), newPassword: z.string().min(6).max(128) }).parse(d))
  .handler(async ({ data }) => {
    const v = await verifyToken(data.token);
    if (!v) throw new Error("Link inválido ou expirado");
    const sb = admin();
    const { error } = await sb.auth.admin.updateUserById(v.userId, { password: data.newPassword });
    if (error) throw new Error("Não foi possível redefinir a senha");
    return { ok: true, email: v.email };
  });
