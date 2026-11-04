import { eq } from "drizzle-orm";
import { culqiQrEnabled, getCulqiOrder } from "@/server/culqi";
import { db, orders } from "@/server/db";
import { markPaid } from "@/server/payments";

/**
 * Aviso automático (webhook) de Culqi, evento `order.status.changed`. Culqi no publica una firma verificable,
 * así que NO se confía en lo que dice el aviso: solo se toma de él el id de la orden y se le pregunta
 * a Culqi su estado real. Así un aviso falso no puede marcar un pedido como pagado.
 * Responde siempre 200 para que Culqi no reintente sin fin.
 */
export async function POST(req: Request) {
  const ok = () => Response.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  if (!culqiQrEnabled()) return ok();

  const raw = (await req.text().catch(() => "")).slice(0, 20_000);
  const id = /ord_(?:test|live)_[A-Za-z0-9]+/.exec(raw)?.[0];
  if (!id) return ok();

  const [o] = await db.select().from(orders).where(eq(orders.culqiOrder, id));
  if (!o || o.status !== "pending_payment") return ok();

  const c = await getCulqiOrder(id);
  if (c?.paid && c.amount === o.total * 100 && (!c.orderNumber || c.orderNumber === o.id)) {
    await markPaid(o.id, { ref: id, auth: "QR billetera", actor: "Culqi (aviso)", note: `Pago confirmado por aviso de Culqi: ${id}` });
  }
  return ok();
}
