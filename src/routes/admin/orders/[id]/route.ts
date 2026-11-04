import type { RouteCtx } from "@/shims/route";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { db, orderEvents, orders } from "@/server/db";
import { orderEmail, sendEmail } from "@/server/email";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { adminLabel as statusLabel, cancelOrder, getOrder, logEvent, serializeOrder, transitions } from "@/server/orders";
import { appUrl } from "@/server/site";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function detail(id: string) {
  const found = await getOrder(id);
  if (!found) return null;
  const events = await db.select().from(orderEvents).where(eq(orderEvents.orderId, id));
  return {
    order: { ...serializeOrder(found.o, found.items), statusLabel: statusLabel[found.o.status] },
    trackingCode: found.o.trackingCode,
    paidAt: found.o.paidAt ? new Date(found.o.paidAt * 1000).toISOString() : null,
    paymentAuth: found.o.paymentAuth,
    paymentRef: found.o.paymentRef,
    allowed: transitions[found.o.status].map((s) => ({ status: s, label: statusLabel[s] })),
    events: events.map((e) => ({ actor: e.actor, action: e.action, at: new Date(e.createdAt * 1000).toISOString() })).reverse(),
  };
}

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const d = await detail((await ctx.params).id);
  return d ? json(d) : fail("Pedido no encontrado.", 404);
}

const patch = z.object({
  status: z.enum(["paid", "preparing", "shipped", "delivered", "cancelled"]).optional(),
  trackingCode: z.string().trim().max(80).optional(),
});

export async function PATCH(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, patch);
  if (!body.ok) return body.res;
  const { id } = await ctx.params;
  const found = await getOrder(id);
  if (!found) return fail("Pedido no encontrado.", 404);
  const { o } = found;
  const actor = auth.user.email;

  if (body.data.trackingCode !== undefined && body.data.trackingCode !== (o.trackingCode ?? "")) {
    await db.update(orders).set({ trackingCode: body.data.trackingCode || null }).where(eq(orders.id, id));
    await logEvent(id, actor, `Código de seguimiento: ${body.data.trackingCode || "(vacío)"}`);
  }

  const next = body.data.status;
  if (next) {
    if (!transitions[o.status].includes(next)) return fail(`No se puede pasar de “${statusLabel[o.status]}” a “${statusLabel[next]}”.`, 409);
    const now = Math.floor(Date.now() / 1000);
    if (next === "cancelled") await cancelOrder(id);
    else if (next === "paid") await db.update(orders).set({ status: "paid", paidAt: now }).where(eq(orders.id, id));
    else if (next === "shipped") await db.update(orders).set({ status: "shipped", shippedAt: now }).where(eq(orders.id, id));
    else await db.update(orders).set({ status: next }).where(eq(orders.id, id));
    const refund = next === "cancelled" && (o.status === "paid" || o.status === "preparing");
    await logEvent(id, actor, `Estado: ${statusLabel[o.status]} → ${statusLabel[next]}${refund ? " (reembolso pendiente)" : ""}`);

    const link = `${appUrl()}/pedido/${id}?t=${o.publicToken}`;
    const name = o.address.name;
    if (next === "paid") {
      const mail = orderEmail({ id, name, items: found.items, total: o.total, url: link });
      void sendEmail({ to: o.email, ...mail });
    }
    if (next === "shipped") {
      const code = body.data.trackingCode ?? o.trackingCode;
      void sendEmail({
        to: o.email,
        subject: `Tu pedido ${id} va en camino`,
        text: `Hola ${name},\n\nTu pedido ${id} ya salió.${code ? ` Código de seguimiento: ${code}.` : ""}\n\nSíguelo aquí: ${link}\n\nAlba Pura`,
        html: `<p>Hola ${esc(name)}, tu pedido <b>${id}</b> ya salió.${code ? ` Código de seguimiento: <b>${esc(code)}</b>.` : ""}</p><p><a href="${link}">Sigue tu pedido</a></p>`,
      });
    }
  }
  return json(await detail(id));
}
