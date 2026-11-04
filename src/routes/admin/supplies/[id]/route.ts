import { desc, eq } from "drizzle-orm";
import type { RouteCtx } from "@/shims/route";
import { requireAdmin } from "@/server/auth";
import { supplyInput } from "@/server/costing-input";
import { db, productionBatchItems, products, recipeItems, supplies, supplyMovements } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";

const patch = supplyInput.omit({ unit: true, initialStock: true, initialTotalCost: true });

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { id } = await ctx.params;
  const [supply] = await db.select().from(supplies).where(eq(supplies.id, id));
  if (!supply) return fail("Insumo no encontrado.", 404);
  const movements = await db.select().from(supplyMovements).where(eq(supplyMovements.supplyId, id)).orderBy(desc(supplyMovements.createdAt), desc(supplyMovements.id)).limit(100);
  const usedIn = await db.select({ slug: products.slug, name: products.name }).from(recipeItems).innerJoin(products, eq(products.slug, recipeItems.productSlug)).where(eq(recipeItems.supplyId, id));
  return json({ supply, movements, usedIn });
}

export async function PUT(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { id } = await ctx.params;
  const body = await parseBody(req, patch);
  if (!body.ok) return body.res;
  const d = body.data;
  const [cur] = await db.select().from(supplies).where(eq(supplies.id, id));
  if (!cur) return fail("Insumo no encontrado.", 404);
  await db.update(supplies).set({ name: d.name, kind: d.kind, minStock: d.minStock, supplier: d.supplier ?? null, notes: d.notes ?? null, active: d.active, unitCost: d.unitCost ?? cur.unitCost }).where(eq(supplies.id, id));
  return json({ id });
}

/** Solo se borra un insumo que ninguna receta ni lote usa; si no, se desactiva. */
export async function DELETE(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { id } = await ctx.params;
  const used = await db.select({ name: products.name }).from(recipeItems).innerJoin(products, eq(products.slug, recipeItems.productSlug)).where(eq(recipeItems.supplyId, id)).limit(1);
  if (used.length) return fail(`Este insumo está en la receta de “${used[0].name}”. Quítalo de ahí o desactívalo.`, 409);
  const batch = await db.select({ id: productionBatchItems.id }).from(productionBatchItems).where(eq(productionBatchItems.supplyId, id)).limit(1);
  if (batch.length) return fail("Este insumo ya se usó en lotes de producción. Desactívalo en lugar de borrarlo.", 409);
  await db.delete(supplies).where(eq(supplies.id, id));
  return json({ ok: true });
}
