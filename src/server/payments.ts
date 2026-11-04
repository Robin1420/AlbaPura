import { and, eq } from "drizzle-orm";
import { db, orders } from "@/server/db";
import { orderEmail, sendEmail } from "@/server/email";
import { changes } from "@/server/http";
import { getOrder, logEvent } from "@/server/orders";
import { appUrl } from "@/server/site";

/**
 * Marca un pedido como pagado una sola vez (tarjeta, Yape o QR) y avisa al cliente.
 * Devuelve false si el pedido ya no estaba pendiente (otro pago o aviso llegó antes).
 */
export async function markPaid(orderId: string, how: { ref: string; auth: string | null; actor: string; note: string }) {
  const r = await db
    .update(orders)
    .set({ status: "paid", paidAt: Math.floor(Date.now() / 1000), paymentRef: how.ref, paymentAuth: how.auth })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending_payment")));
  if (changes(r) === 0) return false;
  await logEvent(orderId, how.actor, how.note);

  const found = await getOrder(orderId);
  if (found) {
    const { o } = found;
    const mail = orderEmail({
      id: o.id,
      name: o.address.name,
      items: found.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      total: o.total,
      url: `${appUrl()}/pedido/${o.id}?t=${o.publicToken}`,
    });
    void sendEmail({ to: o.email, ...mail });
  }
  return true;
}
