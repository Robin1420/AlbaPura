import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { culqiQrEnabled, getCulqiOrder } from "@/server/culqi";
import { clientIp, fail, json, parseBody, rateLimit, sameOrigin } from "@/server/http";
import { getOrder } from "@/server/orders";
import { markPaid } from "@/server/payments";

const schema = z.object({ orderId: z.string().regex(/^AP-\d{5}$/), token: z.string().min(10).max(80) });
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * La página del checkout la consulta mientras el cliente paga con el QR: pregunta a Culqi el estado real de
 * la orden y, si ya está pagada y el monto coincide, marca el pedido como pagado.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  if (!culqiQrEnabled()) return fail("El pago con QR no está disponible.", 503);
  if (!rateLimit(`sync:${clientIp(req)}`, 400, 15 * 60_000)) return fail("Demasiadas consultas. Espera un momento.", 429);
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;

  const found = await getOrder(body.data.orderId);
  if (!found || !same(body.data.token, found.o.publicToken)) return fail("Pedido no encontrado.", 404);
  const { o } = found;
  if (o.status === "paid") return json({ status: "paid", id: o.id, token: o.publicToken });
  if (o.status !== "pending_payment") return json({ status: "closed" });
  if (!o.culqiOrder) return json({ status: "pending" });

  const c = await getCulqiOrder(o.culqiOrder);
  if (!c) return json({ status: "pending" });
  if (c.state === "expired") return json({ status: "expired" });
  if (c.paid && c.amount === o.total * 100 && (!c.orderNumber || c.orderNumber === o.id)) {
    await markPaid(o.id, { ref: o.culqiOrder, auth: "QR billetera", actor: "Culqi", note: `Pago aprobado con QR de billetera móvil: ${o.culqiOrder}` });
    return json({ status: "paid", id: o.id, token: o.publicToken });
  }
  return json({ status: "pending" });
}
