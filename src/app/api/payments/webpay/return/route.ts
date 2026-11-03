import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, orders } from "@/server/db";
import { orderEmail, sendEmail } from "@/server/email";
import { getOrder, releaseOrder } from "@/server/orders";
import { appUrl, webpay } from "@/server/transbank";

/**
 * Webpay vuelve aquí por POST (pago hecho o rechazado) o por GET (el cliente anuló o se agotó el tiempo).
 * Se confirma la transacción con Transbank y el monto se compara con el del pedido guardado.
 */
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

async function handle(params: URLSearchParams) {
  const back = (id: string, token: string, pago: string) => NextResponse.redirect(`${appUrl()}/pedido/${id}?t=${token}&pago=${pago}`, 303);
  const checkout = (q: string) => NextResponse.redirect(`${appUrl()}/checkout?pago=${q}`, 303);

  const tokenWs = params.get("token_ws");
  const aborted = params.get("TBK_TOKEN");
  const buyOrder = params.get("TBK_ORDEN_COMPRA");

  if (!tokenWs) {
    // El cliente anuló el pago o se agotó el tiempo. Esta URL es pública y el número de pedido es corto
    // (AP-12345), así que solo se actúa si TBK_TOKEN es el token que Webpay entregó para ese pedido.
    // Sin esa prueba no se cancela nada ni se revela el enlace del pedido: cualquiera podría
    // recorrer los números para anular compras ajenas y leer sus datos. Los pedidos abandonados
    // se liberan solos (expireStaleOrders).
    if (buyOrder && aborted) {
      const found = await getOrder(buyOrder);
      if (found && found.o.status === "pending_payment" && found.o.webpayToken && same(aborted, found.o.webpayToken)) {
        await releaseOrder(found.o.id, "failed");
        return back(found.o.id, found.o.publicToken, "anulado");
      }
    }
    return checkout("anulado");
  }

  const [row] = await db.select().from(orders).where(eq(orders.webpayToken, tokenWs));
  if (!row) return checkout("error");
  if (row.status === "paid") return back(row.id, row.publicToken, "ok"); // ya se había confirmado

  let result;
  try {
    result = await webpay().commit(tokenWs);
  } catch (e) {
    console.error("Webpay commit falló", e);
    await releaseOrder(row.id, "failed");
    return back(row.id, row.publicToken, "error");
  }

  const approved = result.status === "AUTHORIZED" && result.response_code === 0 && result.buy_order === row.id && result.amount === row.total;
  if (!approved) {
    await releaseOrder(row.id, "failed");
    return back(row.id, row.publicToken, "rechazado");
  }

  await db
    .update(orders)
    .set({ status: "paid", paidAt: Math.floor(Date.now() / 1000), webpayAuthCode: String(result.authorization_code ?? "") })
    .where(eq(orders.id, row.id));

  const found = await getOrder(row.id);
  if (found) {
    const mail = orderEmail({
      id: row.id,
      name: row.address.name,
      items: found.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      total: row.total,
      url: `${appUrl()}/pedido/${row.id}?t=${row.publicToken}`,
    });
    void sendEmail({ to: row.email, ...mail });
  }
  return back(row.id, row.publicToken, "ok");
}

export async function POST(req: Request) {
  const form = await req.formData();
  const params = new URLSearchParams();
  for (const [k, v] of form.entries()) if (typeof v === "string") params.set(k, v);
  return handle(params);
}

export async function GET(req: Request) {
  return handle(new URL(req.url).searchParams);
}
