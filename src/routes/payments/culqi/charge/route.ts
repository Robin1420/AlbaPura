import { timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { createCharge, culqiConfigured } from "@/server/culqi";
import { db, orders } from "@/server/db";
import { orderEmail, sendEmail } from "@/server/email";
import { changes, clientIp, fail, json, parseBody, rateLimit, sameOrigin } from "@/server/http";
import { getOrder, logEvent } from "@/server/orders";
import { appUrl } from "@/server/site";

const schema = z.object({
  orderId: z.string().regex(/^AP-\d{5}$/),
  /** Token público del pedido (el de la dirección de confirmación): prueba que el pedido es de quien paga. */
  token: z.string().min(10).max(80),
  /** Token de Culqi creado en el navegador con la tarjeta o el código de Yape. */
  tokenId: z.string().regex(/^[a-z]{3}_(test|live)_[A-Za-z0-9]+$/, "Pago no válido."),
});

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * Cobra un pedido con el token de Culqi. El monto y el correo salen del pedido guardado: lo único
 * que decide el navegador es qué tarjeta o Yape usa. Un pedido solo se cobra una vez.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  if (!culqiConfigured()) return fail("El pago con tarjeta o Yape todavía no está disponible.", 503);
  if (!rateLimit(`charge:${clientIp(req)}`, 15, 15 * 60_000)) return fail("Demasiados intentos de pago. Espera unos minutos.", 429);
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  const { orderId, token, tokenId } = body.data;

  const found = await getOrder(orderId);
  // Mismo mensaje si el pedido no existe o el token no coincide: no se puede explorar números de pedido
  if (!found || !same(token, found.o.publicToken) || found.o.payment !== "culqi") return fail("Pedido no encontrado.", 404);
  const { o } = found;

  if (o.status === "paid") return json({ ok: true, id: o.id, token: o.publicToken });
  if (o.status !== "pending_payment") return fail("Este pedido ya no admite pago. Vuelve a hacerlo desde la tienda.", 409);

  // Se "reserva" el cobro antes de llamar a Culqi: si llegan dos clics seguidos, solo uno pasa
  const claim = await db.update(orders).set({ paymentRef: "cobrando" }).where(and(eq(orders.id, o.id), eq(orders.status, "pending_payment"), isNull(orders.paymentRef)));
  if (changes(claim) === 0) return fail("Tu pago ya se está procesando. Espera unos segundos y revisa tu pedido.", 409);

  const charge = await createCharge({ tokenId, amountSoles: o.total, email: o.email, orderId: o.id });
  if (!charge.ok) {
    await db.update(orders).set({ paymentRef: null }).where(eq(orders.id, o.id));
    return fail(charge.message, charge.reason === "error" ? 502 : 402);
  }

  await db.update(orders).set({ status: "paid", paidAt: Math.floor(Date.now() / 1000), paymentRef: charge.id, paymentAuth: charge.reference || null }).where(eq(orders.id, o.id));
  await logEvent(o.id, "Culqi", `Pago aprobado (${charge.live ? "real" : "prueba"}): ${charge.id}`);

  const mail = orderEmail({
    id: o.id,
    name: o.address.name,
    items: found.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
    total: o.total,
    url: `${appUrl()}/pedido/${o.id}?t=${o.publicToken}`,
  });
  void sendEmail({ to: o.email, ...mail });
  return json({ ok: true, id: o.id, token: o.publicToken });
}
