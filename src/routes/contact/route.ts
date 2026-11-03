import { z } from "zod";
import { db, contactMessages } from "@/server/db";
import { sendEmail } from "@/server/email";
import { clientIp, fail, json, parseBody, rateLimit, sameOrigin } from "@/server/http";

const schema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  email: z.string().trim().toLowerCase().email("Escribe un correo válido.").max(200),
  subject: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().min(10, "Cuéntanos un poco más (mínimo 10 caracteres).").max(4000),
});

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  if (!rateLimit(`contact:${clientIp(req)}`, 5, 60 * 60_000)) return fail("Ya recibimos varios mensajes tuyos. Inténtalo más tarde.", 429);
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  const m = body.data;

  await db.insert(contactMessages).values({ name: m.name, email: m.email, subject: m.subject || null, message: m.message });
  const to = process.env.CONTACT_TO;
  if (to) void sendEmail({
    to,
    subject: `Contacto web: ${m.subject || "sin asunto"}`,
    text: `${m.name} <${m.email}>\n\n${m.message}`,
    html: `<p><b>${esc(m.name)}</b> &lt;${esc(m.email)}&gt;</p><p>${esc(m.message).replace(/\n/g, "<br>")}</p>`,
    replyTo: m.email,
  });
  return json({ ok: true }, 201);
}
