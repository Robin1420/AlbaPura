import { randomBytes, randomInt } from "node:crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { shippingCost, type ShippingMethod } from "@/checkout";
import { changes } from "./http";
import { db, orderEvents, orderItems, orders, products, type Address, type OrderStatus } from "./db";

type Batch = Parameters<typeof db.batch>[0];
/** Aplica varias escrituras de golpe (D1 las ejecuta como una sola transacción). */
const run = (q: unknown[]) => db.batch(q as unknown as Batch) as unknown as Promise<unknown[]>;

export const GIFT_PRICE = 8;

export type NewOrderInput = {
  email: string;
  items: { slug: string; qty: number }[];
  gift: boolean;
  shippingMethod: ShippingMethod;
  payment: "culqi" | "transfer";
  address: Address;
};

export class OrderError extends Error {
  constructor(message: string, public status = 409) {
    super(message);
  }
}

const PENDING_MINUTES = 45;

/** Libera el stock de pedidos con tarjeta que nunca se pagaron (el cliente cerró el checkout de pago). */
export async function expireStaleOrders() {
  const cutoff = Math.floor(Date.now() / 1000) - PENDING_MINUTES * 60;
  const stale = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.status, "pending_payment"), sql`${orders.createdAt} < ${cutoff}`))
    .limit(50);
  for (const o of stale) await releaseOrder(o.id, "failed");
  return stale.length;
}

/**
 * Crea el pedido con precios y stock del servidor (nunca los del navegador) y reserva el stock
 * dentro de una transacción. Si algo falla, no queda nada a medias.
 */
export async function createOrder(input: NewOrderInput, userId: string | null) {
  await expireStaleOrders();
  const slugs = [...new Set(input.items.map((i) => i.slug))];
  const rows = await db.select().from(products).where(inArray(products.slug, slugs));
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  const lines = input.items.map((i) => {
    const p = bySlug.get(i.slug);
    if (!p || !p.active) throw new OrderError("Uno de los productos ya no está disponible.", 409);
    if (p.comingSoon) throw new OrderError(`“${p.name}” todavía no está a la venta. Quítalo del carrito para continuar.`, 409);
    return { p, qty: i.qty };
  });

  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const shipping = shippingCost(input.shippingMethod);
  const gift = input.gift ? GIFT_PRICE : 0;
  const total = subtotal + shipping + gift;
  const publicToken = randomBytes(18).toString("base64url");
  const status: OrderStatus = input.payment === "transfer" ? "awaiting_transfer" : "pending_payment";

  for (let attempt = 0; attempt < 5; attempt++) {
    const id = `AP-${randomInt(10000, 99999)}`;
    try {
      // D1 no tiene transacciones interactivas: todo va en un lote que se aplica entero o no se aplica.
      const results = await run([
        db.insert(orders).values({
          id,
          publicToken,
          userId,
          email: input.email,
          status,
          shippingMethod: input.shippingMethod,
          payment: input.payment,
          subtotal,
          shipping,
          gift,
          total,
          address: input.address,
        }),
        db.insert(orderItems).values(lines.map((l) => ({ orderId: id, slug: l.p.slug, name: l.p.name, meta: l.p.meta, qty: l.qty, price: l.p.price }))),
        ...lines.map((l) =>
          db
            .update(products)
            .set({ stock: sql`${products.stock} - ${l.qty}` })
            .where(and(eq(products.slug, l.p.slug), gte(products.stock, l.qty))),
        ),
      ]);
      // Si algún producto no tenía stock su UPDATE no cambió nada: se deshace lo que sí se aplicó.
      const failed = lines.findIndex((_, i) => changes(results[2 + i]) === 0);
      if (failed >= 0) {
        await run([
          ...lines.flatMap((l, i) => (changes(results[2 + i]) > 0 ? [db.update(products).set({ stock: sql`${products.stock} + ${l.qty}` }).where(eq(products.slug, l.p.slug))] : [])),
          db.delete(orders).where(eq(orders.id, id)),
        ]);
        throw new OrderError(`No hay stock suficiente de ${lines[failed].p.name}.`, 409);
      }
      return { id, publicToken, total, status, lines: lines.map((l) => ({ name: l.p.name, qty: l.qty, price: l.p.price })) };
    } catch (e) {
      if (e instanceof OrderError) throw e;
      if (String(e).includes("UNIQUE") && attempt < 4) continue; // número de pedido repetido
      throw e;
    }
  }
  throw new OrderError("No pudimos crear el pedido. Inténtalo de nuevo.", 500);
}

/** Devuelve el stock reservado cuando el pago falla o se anula. */
export async function releaseOrder(orderId: string, status: OrderStatus) {
  const [o] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId));
  if (!o || o.status === "cancelled" || o.status === "failed" || o.status === "paid") return;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  await run([
    ...items.map((i) => db.update(products).set({ stock: sql`${products.stock} + ${i.qty}` }).where(eq(products.slug, i.slug))),
    db.update(orders).set({ status }).where(and(eq(orders.id, orderId), eq(orders.status, o.status))),
  ]);
}

export const statusLabel: Record<OrderStatus, string> = {
  pending_payment: "Pendiente de pago",
  awaiting_transfer: "Esperando transferencia",
  paid: "Preparando",
  preparing: "Preparando",
  shipped: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
  failed: "Pago rechazado",
};

/** Etiquetas del panel de administración: aquí "paid" y "preparing" son pasos distintos. */
export const adminLabel: Record<OrderStatus, string> = { ...statusLabel, paid: "Pagado", preparing: "Preparando" };

export async function getOrder(id: string) {
  const [o] = await db.select().from(orders).where(eq(orders.id, id));
  if (!o) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { o, items };
}

/** Vista pública del pedido (sin el token ni datos del pago). */
export function serializeOrder(o: typeof orders.$inferSelect, items: (typeof orderItems.$inferSelect)[]) {
  return {
    id: o.id,
    date: new Date(o.createdAt * 1000).toISOString(),
    items: items.map((i) => ({ slug: i.slug, name: i.name, meta: i.meta, qty: i.qty, price: i.price })),
    subtotal: o.subtotal,
    shipping: o.shipping,
    gift: o.gift,
    total: o.total,
    shippingMethod: o.shippingMethod,
    payment: o.payment,
    email: o.email,
    address: o.address,
    status: o.status,
    statusLabel: statusLabel[o.status],
  };
}

/** Estados a los que puede pasar un pedido desde el panel de administración. */
export const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["cancelled"],
  awaiting_transfer: ["paid", "cancelled"],
  paid: ["preparing", "shipped", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  failed: [],
};

export async function logEvent(orderId: string, actor: string, action: string) {
  await db.insert(orderEvents).values({ orderId, actor, action });
}

/** Anula un pedido y devuelve el stock reservado. Si ya estaba pagado, el reembolso es manual. */
export async function cancelOrder(orderId: string) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  await run([
    ...items.map((i) => db.update(products).set({ stock: sql`${products.stock} + ${i.qty}` }).where(eq(products.slug, i.slug))),
    db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId)),
  ]);
}
