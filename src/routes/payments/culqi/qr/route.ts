import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { culqiConfigured, culqiQr } from "@/server/culqi";
import { clientIp, fail, json, parseBody, rateLimit, sameOrigin } from "@/server/http";
import { getOrder } from "@/server/orders";

const schema = z.object({ orderId: z.string().regex(/^AP-\d{5}$/), token: z.string().min(10).max(80) });
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Genera (o recupera) el QR de pago de billeteras móviles del pedido. Se paga escaneándolo con Yape, Plin, etc. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  if (!culqiConfigured()) return fail("El pago en línea no está disponible.", 503);
  if (!rateLimit(`qr:${clientIp(req)}`, 30, 15 * 60_000)) return fail("Demasiados intentos. Espera unos minutos.", 429);
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;

  const found = await getOrder(body.data.orderId);
  if (!found || !same(body.data.token, found.o.publicToken)) return fail("Pedido no encontrado.", 404);
  const { o } = found;
  if (o.status !== "pending_payment") return fail("Este pedido ya no admite pago.", 409);
  if (!o.culqiOrder) return fail("El pago con QR no está disponible para este pedido. Paga con tarjeta o Yape.", 409);

  const q = await culqiQr(o.culqiOrder);
  if (!q) return fail("No pudimos conectar con el servicio de pagos. Inténtalo de nuevo.", 502);
  if ("error" in q) return fail(q.error, 409);
  return json({ qr: q.qr, code: q.code, expiresAt: q.expiresAt, total: o.total });
}
