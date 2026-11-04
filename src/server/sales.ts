import { randomInt } from "node:crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { changes } from "./http";
import { db, products, saleItems, sales, stockMovements } from "./db";
import { stockEntry, unitCosts } from "./stock";

type Batch = Parameters<typeof db.batch>[0];
const run = (q: unknown[]) => db.batch(q as unknown as Batch) as unknown as Promise<unknown[]>;

export const channels = ["whatsapp", "instagram", "facebook", "tiktok", "tienda", "feria", "b2b", "otro"] as const;
export const payments = ["efectivo", "yape", "plin", "transferencia", "tarjeta", "credito", "otro"] as const;

const opt = (max: number) => z.string().trim().max(max).nullable().optional();

export const saleInput = z
  .object({
    channel: z.enum(channels),
    channelNote: opt(120),
    customerName: z.string().trim().min(2, "Escribe el nombre del cliente.").max(100),
    customerPhone: opt(30),
    customerEmail: opt(120),
    customerDoc: opt(20),
    customerCompany: opt(120),
    payment: z.enum(payments),
    paid: z.boolean().default(true),
    soldAt: z.number().int().positive().optional(),
    discount: z.number().min(0).max(1e7).default(0),
    shipping: z.number().min(0).max(1e7).default(0),
    fee: z.number().min(0).max(1e7).default(0),
    notes: opt(400),
    items: z
      .array(z.object({ slug: z.string().min(1).max(120), qty: z.number().int().min(1).max(100000), price: z.number().min(0).max(1e7).optional() }))
      .min(1, "Agrega al menos un producto.")
      .max(50),
  })
  .refine((d) => d.channel !== "b2b" || !!d.customerCompany?.trim(), { message: "Escribe la empresa del cliente B2B.", path: ["customerCompany"] });

export class SaleError extends Error {
  constructor(message: string, public status = 409) {
    super(message);
  }
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Registra una venta hecha fuera de la web: descuenta el stock, guarda el costo de cada producto y calcula la utilidad. */
export async function createSale(input: z.infer<typeof saleInput>, actor: string) {
  const merged = new Map<string, { qty: number; price?: number }>();
  for (const i of input.items) {
    const prev = merged.get(i.slug);
    merged.set(i.slug, { qty: (prev?.qty ?? 0) + i.qty, price: i.price ?? prev?.price });
  }
  const slugs = [...merged.keys()];
  const rows = await db.select().from(products).where(inArray(products.slug, slugs));
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const costs = await unitCosts(slugs);

  const lines = slugs.map((slug) => {
    const p = bySlug.get(slug);
    if (!p) throw new SaleError("Uno de los productos ya no existe.", 404);
    const m = merged.get(slug)!;
    return { p, qty: m.qty, price: m.price ?? p.price, unitCost: costs.get(slug) ?? null };
  });

  const subtotal = r2(lines.reduce((t, l) => t + l.price * l.qty, 0));
  if (input.discount > subtotal) throw new SaleError("El descuento no puede ser mayor que la venta.", 422);
  const revenue = subtotal - input.discount;
  const total = r2(revenue + input.shipping);
  const costComplete = lines.every((l) => l.unitCost != null);
  const costTotal = r2(lines.reduce((t, l) => t + (l.unitCost ?? 0) * l.qty, 0));
  const profit = r2(revenue - costTotal - input.fee);
  const now = Math.floor(Date.now() / 1000);
  const soldAt = input.soldAt ?? now;

  for (let attempt = 0; attempt < 5; attempt++) {
    const id = `VT-${randomInt(10000, 99999)}`;
    try {
      const results = await run([
        db.insert(sales).values({
          id,
          channel: input.channel,
          channelNote: input.channelNote || null,
          customerName: input.customerName,
          customerPhone: input.customerPhone || null,
          customerEmail: input.customerEmail || null,
          customerDoc: input.customerDoc || null,
          customerCompany: input.customerCompany || null,
          payment: input.payment,
          paid: input.paid,
          paidAt: input.paid ? soldAt : null,
          subtotal,
          discount: input.discount,
          shipping: input.shipping,
          total,
          costTotal,
          costComplete,
          fee: input.fee,
          profit,
          notes: input.notes || null,
          soldAt,
          createdBy: actor,
        }),
        db.insert(saleItems).values(lines.map((l) => ({ saleId: id, productSlug: l.p.slug, name: l.p.name, qty: l.qty, price: l.price, unitCost: l.unitCost }))),
        ...lines.map((l) => db.update(products).set({ stock: sql`${products.stock} - ${l.qty}` }).where(and(eq(products.slug, l.p.slug), gte(products.stock, l.qty)))),
        ...lines.map((l) => stockEntry(l.p.slug, "sale_manual", -l.qty, { ref: id, note: `Venta manual ${id}`, actor })),
      ]);
      const failed = lines.findIndex((_, i) => changes(results[2 + i]) === 0);
      if (failed >= 0) {
        await run([
          ...lines.flatMap((l, i) => (changes(results[2 + i]) > 0 ? [db.update(products).set({ stock: sql`${products.stock} + ${l.qty}` }).where(eq(products.slug, l.p.slug))] : [])),
          db.delete(stockMovements).where(eq(stockMovements.ref, id)),
          db.delete(sales).where(eq(sales.id, id)),
        ]);
        throw new SaleError(`No hay stock suficiente de ${lines[failed].p.name} (hay ${lines[failed].p.stock}).`, 409);
      }
      return { id, total, profit, costComplete };
    } catch (e) {
      if (e instanceof SaleError) throw e;
      if (String(e).includes("UNIQUE") && attempt < 4) continue;
      throw e;
    }
  }
  throw new SaleError("No pudimos registrar la venta. Inténtalo de nuevo.", 500);
}

/** Anula la venta y devuelve las unidades al stock. */
export async function cancelSale(id: string, actor: string) {
  const [s] = await db.select().from(sales).where(eq(sales.id, id));
  if (!s) throw new SaleError("Venta no encontrada.", 404);
  if (s.status === "cancelled") throw new SaleError("Esta venta ya está anulada.", 409);
  const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
  const now = Math.floor(Date.now() / 1000);
  const res = await run([
    db.update(sales).set({ status: "cancelled", cancelledAt: now }).where(and(eq(sales.id, id), eq(sales.status, "completed"))),
    ...items.map((i) => db.update(products).set({ stock: sql`${products.stock} + ${i.qty}` }).where(eq(products.slug, i.productSlug))),
    ...items.map((i) => stockEntry(i.productSlug, "return", i.qty, { ref: id, note: `Venta ${id} anulada`, actor })),
  ]);
  if (changes(res[0]) === 0) throw new SaleError("Esta venta ya está anulada.", 409);
}

export async function markSalePaid(id: string) {
  const now = Math.floor(Date.now() / 1000);
  const r = await db.update(sales).set({ paid: true, paidAt: now }).where(and(eq(sales.id, id), eq(sales.status, "completed"), eq(sales.paid, false)));
  if (changes(r) === 0) throw new SaleError("La venta no existe, está anulada o ya estaba cobrada.", 409);
}
