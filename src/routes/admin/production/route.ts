import { desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { batchInput } from "@/server/costing-input";
import { db, productionBatches, products } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { completeBatch, nextBatchId, ProductionError, quote } from "@/server/production";

export async function GET() {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const rows = await db
    .select({ batch: productionBatches, productName: products.name })
    .from(productionBatches)
    .innerJoin(products, eq(products.slug, productionBatches.productSlug))
    .orderBy(desc(productionBatches.createdAt), desc(productionBatches.id))
    .limit(100);
  const since = Math.floor(Date.now() / 1000) - 30 * 86400;
  const [month] = await db
    .select({ units: sql<number>`coalesce(sum(${productionBatches.qty}), 0)`, cost: sql<number>`coalesce(sum(${productionBatches.costTotal}), 0)`, n: sql<number>`count(*)` })
    .from(productionBatches)
    .where(sql`${productionBatches.status} = 'done' and ${productionBatches.finishedAt} >= ${since}`);
  const [planned] = await db.select({ n: sql<number>`count(*)` }).from(productionBatches).where(eq(productionBatches.status, "planned"));
  return json({
    batches: rows.map((r) => ({ ...r.batch, productName: r.productName })),
    summary: { monthUnits: month?.units ?? 0, monthCost: Math.round((month?.cost ?? 0) * 100) / 100, monthBatches: month?.n ?? 0, planned: planned?.n ?? 0 },
  });
}

/** Crea un lote (planificado) y, si se pide, lo termina de una vez. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, batchInput);
  if (!body.ok) return body.res;
  const d = body.data;
  const [p] = await db.select({ slug: products.slug }).from(products).where(eq(products.slug, d.productSlug));
  if (!p) return fail("Producto no encontrado.", 404);

  try {
    await quote(d.productSlug, d.qty); // valida que tenga receta antes de crear el lote
    let id = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      id = await nextBatchId();
      try {
        await db.insert(productionBatches).values({ id, productSlug: d.productSlug, qty: d.qty, status: "planned", notes: d.notes ?? null, expiresAt: d.expiresAt ?? null, createdBy: auth.user.email });
        break;
      } catch (e) {
        if (!String(e).includes("UNIQUE") || attempt === 4) throw e;
      }
    }
    let done = null;
    if (d.produceNow) {
      try {
        done = await completeBatch(id, auth.user.email, d.force);
      } catch (e) {
        await db.delete(productionBatches).where(eq(productionBatches.id, id)); // no se deja un lote a medias
        throw e;
      }
    }
    return json({ id, produced: Boolean(done), ...(done ?? {}) }, 201);
  } catch (e) {
    if (e instanceof ProductionError) return json({ error: e.message, shortages: e.details ?? null }, e.status);
    throw e;
  }
}
