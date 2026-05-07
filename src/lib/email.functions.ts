import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import nodemailer from "nodemailer";
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

export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email(), name: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { subject, html } = welcomeEmail(data.name);
    await send(data.email, subject, html);
    return { ok: true };
  });

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

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function tokenSecret() {
  return process.env.SMTP_PASS || process.env.SMTP_USER || "pandex-fallback-secret";
}

async function makeToken(email: string) {
  const exp = Date.now() + 60 * 60 * 1000;
  const payload = `${email}.${exp}`;
  const sig = await hmac(tokenSecret(), payload);
  return btoa(`${payload}.${sig}`).replace(/=+$/, "");
}

async function verifyToken(token: string): Promise<{ email: string } | null> {
  try {
    const decoded = atob(token + "===".slice((token.length + 3) % 4));
    const parts = decoded.split(".");
    if (parts.length < 3) return null;
    const sig = parts.pop();
    const expStr = parts.pop();
    const email = parts.join(".");
    if (!sig || !expStr || !email) return null;
    const expected = await hmac(tokenSecret(), `${email}.${expStr}`);
    if (sig !== expected) return null;
    if (Date.now() > Number(expStr)) return null;
    return { email };
  } catch {
    return null;
  }
}

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email(), origin: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    const token = await makeToken(data.email.toLowerCase());
    const url = `${data.origin.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
    const { subject, html } = resetPasswordEmail(url);
    await send(data.email, subject, html);
    return { ok: true };
  });

export const resetPassword = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().min(20) }).parse(d))
  .handler(async ({ data }) => {
    const verified = await verifyToken(data.token);
    if (!verified) throw new Error("Link inválido ou expirado");
    return { ok: true, email: verified.email };
  });
