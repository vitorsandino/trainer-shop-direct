// Templates HTML com identidade Pandex (verde bambu + dourado)
const BRAND = {
  name: "Pandex Store",
  primary: "#2f9e6b",
  primaryDark: "#1f6b48",
  gold: "#e0a92b",
  bg: "#f7faf7",
  text: "#1f2a26",
  muted: "#6b7a72",
  border: "#dfe7e2",
  site: "https://pandexstore.com.br",
};

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(31,107,72,0.12);border:1px solid ${BRAND.border};">
        <tr><td style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.primaryDark});padding:28px 32px;text-align:center;">
          <div style="font-size:28px;font-weight:800;letter-spacing:1px;color:#fff;">🐼 ${BRAND.name}</div>
          <div style="color:#d8f0e3;font-size:13px;margin-top:4px;">Sua loja de produtos exclusivos</div>
        </td></tr>
        <tr><td style="padding:32px;">${bodyHtml}</td></tr>
        <tr><td style="background:#f3f7f4;padding:20px 32px;border-top:1px solid ${BRAND.border};text-align:center;color:${BRAND.muted};font-size:12px;">
          <div>© ${new Date().getFullYear()} ${BRAND.name}. Todos os direitos reservados.</div>
          <div style="margin-top:6px;"><a href="${BRAND.site}" style="color:${BRAND.primary};text-decoration:none;">pandexstore.com.br</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:10px;font-size:15px;">${label}</a>`;

const h1 = (txt: string) => `<h1 style="margin:0 0 16px;font-size:24px;color:${BRAND.text};">${txt}</h1>`;
const p = (txt: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${BRAND.text};">${txt}</p>`;
const muted = (txt: string) => `<p style="margin:18px 0 0;font-size:12px;color:${BRAND.muted};line-height:1.5;">${txt}</p>`;

export function welcomeEmail(name: string) {
  return {
    subject: `Bem-vindo(a) à ${BRAND.name}, ${name.split(" ")[0]}! 🐼`,
    html: shell("Bem-vindo", `
      ${h1(`Olá, ${name.split(" ")[0]}! Seja muito bem-vindo(a) 🎉`)}
      ${p(`Sua conta na <strong>${BRAND.name}</strong> foi criada com sucesso. Agora você pode acompanhar pedidos, salvar endereços e aproveitar nossas novidades.`)}
      ${p(`Que tal começar explorando nossa loja?`)}
      <div style="text-align:center;margin:24px 0;">${button(BRAND.site, "Visitar a loja")}</div>
      ${muted(`Se você não criou esta conta, pode ignorar este e-mail com segurança.`)}
    `),
  };
}

export function resetPasswordEmail(resetUrl: string) {
  return {
    subject: `Redefinição de senha — ${BRAND.name}`,
    html: shell("Redefinir senha", `
      ${h1("Redefinir sua senha 🔐")}
      ${p("Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha (válido por 1 hora):")}
      <div style="text-align:center;margin:24px 0;">${button(resetUrl, "Criar nova senha")}</div>
      ${p(`Ou copie e cole este link no navegador:<br><span style="color:${BRAND.muted};font-size:13px;word-break:break-all;">${resetUrl}</span>`)}
      ${muted("Se você não solicitou a redefinição, ignore este e-mail. Sua senha continuará a mesma.")}
    `),
  };
}

type OrderItemTpl = { name: string; qty: number; price: number; image?: string };
type OrderAddrTpl = { fullName: string; street: string; number: string; complement?: string; district: string; city: string; state: string; zip: string };

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function orderConfirmationEmail(o: { code: string; userName: string; items: OrderItemTpl[]; total: number; address: OrderAddrTpl; }) {
  const rows = o.items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};">
        <strong style="font-size:14px;">${i.name}</strong><br>
        <span style="color:${BRAND.muted};font-size:12px;">Qtd: ${i.qty} × ${fmt(i.price)}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};text-align:right;font-weight:600;">${fmt(i.qty * i.price)}</td>
    </tr>`).join("");

  return {
    subject: `Pedido confirmado #${o.code} — ${BRAND.name}`,
    html: shell("Pedido confirmado", `
      ${h1(`Obrigado pela compra, ${o.userName.split(" ")[0]}! 🎁`)}
      ${p(`Recebemos seu pedido <strong>#${o.code}</strong> e ele já está em análise. Em breve entraremos em contato para confirmar o pagamento e iniciar a separação.`)}
      <div style="background:${BRAND.bg};border-radius:12px;padding:18px 20px;margin:20px 0;">
        <div style="font-weight:700;font-size:13px;color:${BRAND.primaryDark};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Itens do pedido</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
          <tr><td style="padding:14px 0 0;font-size:16px;font-weight:700;">Total</td>
              <td style="padding:14px 0 0;text-align:right;font-size:18px;font-weight:800;color:${BRAND.primary};">${fmt(o.total)}</td></tr>
        </table>
      </div>
      <div style="background:${BRAND.bg};border-radius:12px;padding:18px 20px;margin:0 0 20px;">
        <div style="font-weight:700;font-size:13px;color:${BRAND.primaryDark};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Endereço de entrega</div>
        <div style="font-size:14px;line-height:1.6;">
          ${o.address.fullName}<br>
          ${o.address.street}, ${o.address.number}${o.address.complement ? ` — ${o.address.complement}` : ""}<br>
          ${o.address.district} — ${o.address.city}/${o.address.state}<br>
          CEP ${o.address.zip}
        </div>
      </div>
      ${muted("Você pode acompanhar seu pedido a qualquer momento na sua conta.")}
    `),
  };
}

export function orderStatusEmail(o: { code: string; userName: string; status: string; trackingCode?: string }) {
  const labels: Record<string, { title: string; msg: string }> = {
    pago: { title: "Pagamento confirmado ✅", msg: "Seu pagamento foi confirmado e seu pedido entrou na fila de preparação." },
    preparacao: { title: "Pedido em preparação 📦", msg: "Estamos separando os itens com todo carinho — em breve seu pedido será enviado." },
    enviado: { title: "Pedido enviado 🚚", msg: "Seu pedido saiu para entrega! Em breve chegará no endereço informado." },
    entregue: { title: "Pedido entregue 🎉", msg: "Seu pedido foi entregue. Esperamos que ame seus produtos!" },
    cancelado: { title: "Pedido cancelado", msg: "Seu pedido foi cancelado. Se tiver dúvidas, entre em contato com a gente." },
    pendente: { title: "Pedido recebido", msg: "Seu pedido está pendente de pagamento." },
  };
  const info = labels[o.status] ?? { title: `Status atualizado: ${o.status}`, msg: "" };
  const tracking = o.trackingCode
    ? `<div style="background:${BRAND.bg};border-radius:12px;padding:16px;margin:18px 0;text-align:center;">
        <div style="color:${BRAND.muted};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Código de rastreio</div>
        <div style="font-family:monospace;font-size:18px;font-weight:700;color:${BRAND.primaryDark};margin-top:6px;">${o.trackingCode}</div>
      </div>` : "";

  return {
    subject: `${info.title} — Pedido #${o.code}`,
    html: shell("Status do pedido", `
      ${h1(info.title)}
      ${p(`Olá, ${o.userName.split(" ")[0]}! ${info.msg}`)}
      ${p(`Pedido: <strong>#${o.code}</strong>`)}
      ${tracking}
      ${muted("Acompanhe seu pedido a qualquer momento na sua conta.")}
    `),
  };
}
