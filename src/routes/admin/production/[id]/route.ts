import { eq } from "drizzle-orm";
import type { RouteCtx } from "@/shims/route";
import { requireAdmin } from "@/server/auth";
import { batchAction } from "@/server/costing-input";
import { db, productionBatchItems, productionBatches, supplies } from "@/server/db";
import { changes, fail, json, parseBody, sameOrigin } from "@/server/http";
import { completeBatch, ProductionError } from "@/server/production";

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { id } = await ctx.params;
  const [batch] = await db.select().from(productionBatches).where(eq(productionBatches.id, id));
  if (!batch) return fail("Lote no encontrado.", 404);
  const items = await db
    .select({ supplyId: productionBatchItems.supplyId, name: supplies.name, unit: supplies.unit, qty: productionBatchItems.qty, unitCost: productionBatchItems.unitCost })
    .from(productionBatchItems)
    .innerJoin(supplies, eq(supplies.id, productionBatchItems.supplyId))
    .where(eq(productionBatchItems.batchId, id));
  return json({ batch, items });
}

/** Termina el lote (descuenta insumos y suma stock del producto) o lo cancela. */
export async function PATCH(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { id } = await ctx.params;
  const body = await parseBody(req, batchAction);
  if (!body.ok) return body.res;
  try {
    if (body.data.action === "complete") return json(await completeBatch(id, auth.user.email, body.data.force));
    const r = await db.update(productionBatches).set({ status: "cancelled", finishedAt: Math.floor(Date.now() / 1000) }).where(eq(productionBatches.id, id));
    if (changes(r) === 0) return fail("Lote no encontrado.", 404);
    return json({ id, status: "cancelled" });
  } catch (e) {
    if (e instanceof ProductionError) return json({ error: e.message, shortages: e.details ?? null }, e.status);
    throw e;
  }
}

/** Solo se borran lotes que no se llegaron a producir (planificados o cancelados). */
export async function DELETE(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { id } = await ctx.params;
  const [batch] = await db.select().from(productionBatches).where(eq(productionBatches.id, id));
  if (!batch) return fail("Lote no encontrado.", 404);
  if (batch.status === "done") return fail("Un lote terminado no se puede borrar: ya descontó insumos y sumó stock.", 409);
  await db.delete(productionBatches).where(eq(productionBatches.id, id));
  return json({ ok: true });
}
