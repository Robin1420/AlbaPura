
import { background } from "@/shims/context";

type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string };

/** Envía con Resend si hay RESEND_API_KEY. Sin clave imprime el correo en la consola (desarrollo). */
export function sendEmail(mail: Mail) {
  return background(deliver(mail));
}

async function deliver(mail: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[correo no enviado: falta RESEND_API_KEY]\nPara: ${mail.to}\nAsunto: ${mail.subject}\n${mail.text}\n`);
    return { sent: false as const };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Alba Pura <onboarding@resend.dev>",
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      reply_to: mail.replyTo,
    }),
  });
  if (!res.ok) {
    console.error("Resend respondió", res.status, await res.text());
    return { sent: false as const };
  }
  return { sent: true as const };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const money = (n: number) => "S/ " + n.toLocaleString("es-PE");

export function orderEmail(o: {
  id: string;
  name: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  url: string;
  transferInfo?: string;
}) {
  const lines = o.items.map((i) => `${i.name} × ${i.qty}: ${money(i.price * i.qty)}`);
  const text = [
    `Hola ${o.name},`,
    "",
    o.transferInfo ? `Recibimos tu pedido ${o.id}. Para confirmarlo, transfiere ${money(o.total)} a:\n${o.transferInfo}\n` : `Recibimos tu pago. Tu pedido ${o.id} ya está en preparación.`,
    "",
    ...lines,
    `Total: ${money(o.total)}`,
    "",
    `Sigue tu pedido: ${o.url}`,
    "",
    "Alba Pura",
  ].join("\n");
  const html = `<div style="font-family:Georgia,serif;max-width:560px;color:#08180f">
<h1 style="font-family:Arial,sans-serif;font-size:28px;margin:0 0 12px">${o.transferInfo ? "Recibimos tu pedido" : "Gracias por tu compra"}</h1>
<p>Hola ${esc(o.name)}, ${o.transferInfo ? `para confirmar el pedido <b>${o.id}</b> transfiere <b>${money(o.total)}</b> a:<br>${esc(o.transferInfo)}` : `tu pedido <b>${o.id}</b> ya está en preparación.`}</p>
<ul>${o.items.map((i) => `<li>${esc(i.name)} × ${i.qty}: ${money(i.price * i.qty)}</li>`).join("")}</ul>
<p><b>Total: ${money(o.total)}</b></p>
<p><a href="${o.url}">Sigue tu pedido</a></p></div>`;
  return { subject: o.transferInfo ? `Pedido ${o.id}: datos para tu transferencia` : `Pedido ${o.id} confirmado`, html, text };
}
