import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { db, products, stockMovements } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { logManualAdjust, unitCosts } from "@/server/stock";

/** Inventario de producto terminado: unidades, costo por unidad y últimos movimientos. */
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const slug = new URL(req.url).searchParams.get("product");
  const rows = await db.select({ slug: products.slug, name: products.name, stock: products.stock, price: products.price }).from(products).orderBy(products.name);
  const costs = await unitCosts(rows.map((r) => r.slug));
  const mq = db
    .select({ m: stockMovements, name: products.name })
    .from(stockMovements)
    .innerJoin(products, eq(products.slug, stockMovements.productSlug));
  const movements = await (slug ? mq.where(eq(stockMovements.productSlug, slug)) : mq).orderBy(desc(stockMovements.createdAt), desc(stockMovements.id)).limit(150);
  return json({
    products: rows.map((r) => {
      const unitCost = costs.get(r.slug) ?? null;
      return { ...r, unitCost, value: unitCost == null ? null : Math.round(Math.max(0, r.stock) * unitCost * 100) / 100 };
    }),
    movements: movements.map((x) => ({ ...x.m, productName: x.name })),
  });
}

/** Corrige el stock a mano: queda como aumento o reducción (nunca como producción). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, z.object({ slug: z.string().min(1), stock: z.number().int().min(0).max(1e7), note: z.string().trim().max(200).nullable().optional() }));
  if (!body.ok) return body.res;
  const [p] = await db.select({ stock: products.stock }).from(products).where(eq(products.slug, body.data.slug));
  if (!p) return fail("Producto no encontrado.", 404);
  await db.update(products).set({ stock: body.data.stock }).where(eq(products.slug, body.data.slug));
  await logManualAdjust(body.data.slug, p.stock, body.data.stock, auth.user.email, body.data.note || "Ajuste manual");
  return json({ ok: true });
}
