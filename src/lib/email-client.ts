// Cliente leve que chama os endpoints de e-mail no Node (deploy/server.mjs).
// O Cloudflare Worker NÃO suporta SMTP/TCP, então o envio acontece fora do Worker.

async function post<T = any>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error((data as any)?.error || `Falha (${res.status})`);
  return data as T;
}

export function sendWelcomeEmail(input: { email: string; name: string }) {
  return post("/api/email/welcome", input);
}

export type OrderEmailItem = { name: string; qty: number; price: number; image?: string };
export type OrderEmailAddress = {
  fullName: string; street: string; number: string; complement?: string;
  district: string; city: string; state: string; zip: string;
};

export function sendOrderConfirmation(input: {
  email: string; code: string; userName: string;
  items: OrderEmailItem[]; total: number; address: OrderEmailAddress;
}) {
  return post("/api/email/order-confirmation", input);
}

export function sendOrderStatusUpdate(input: {
  email: string; code: string; userName: string; status: string; trackingCode?: string;
}) {
  return post("/api/email/order-status", input);
}

export function requestPasswordReset(input: { email: string; origin: string }) {
  return post("/api/email/request-reset", input);
}

export function verifyPasswordResetToken(input: { token: string }) {
  return post<{ ok: true; email: string }>("/api/email/verify-reset", input);
}
