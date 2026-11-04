import { and, eq, sql } from "drizzle-orm";
import { loadSettings, type CostSettings } from "./costing";
import { db, productionBatchItems, productionBatches, products, recipeItems, recipes, supplies, supplyMovements } from "./db";

type Run = Parameters<typeof db.batch>[0];
const run = (q: unknown[]) => db.batch(q as unknown as Run);

export type Need = { supplyId: string; name: string; unit: string; need: number; stock: number; short: number; unitCost: number; cost: number };

export class ProductionError extends Error {
  constructor(message: string, public status = 409, public details?: unknown) {
    super(message);
  }
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Qué insumos hacen falta para producir `qty` unidades y cuánto cuesta. Incluye la merma de la receta. */
export async function quote(productSlug: string, qty: number, s?: CostSettings) {
  const settings = s ?? (await loadSettings());
  const [recipe] = await db.select().from(recipes).where(eq(recipes.productSlug, productSlug));
  if (!recipe) throw new ProductionError("Este producto todavía no tiene receta. Crea la receta en Costos.", 409);
  const items = await db
    .select({ supplyId: recipeItems.supplyId, qty: recipeItems.qty, name: supplies.name, unit: supplies.unit, kind: supplies.kind, unitCost: supplies.unitCost, stock: supplies.stock })
    .from(recipeItems)
    .innerJoin(supplies, eq(supplies.id, recipeItems.supplyId))
    .where(eq(recipeItems.productSlug, productSlug));
  if (items.length === 0) throw new ProductionError("La receta no tiene insumos. Agrégalos en Costos.", 409);

  const factor = qty / Math.max(1, recipe.yieldUnits);
  const waste = 1 + recipe.wastePct / 100;
  const needs: Need[] = items.map((i) => {
    const need = i.qty * factor * (i.kind === "empaque" ? 1 : waste); // la merma no aplica a los empaques
    return { supplyId: i.supplyId, name: i.name, unit: i.unit, need, stock: i.stock, short: Math.max(0, need - i.stock), unitCost: i.unitCost, cost: r2(need * i.unitCost) };
  });
  const labor = recipe.laborHours * (recipe.laborRate ?? settings.laborRate) * factor;
  const materials = needs.reduce((t, n) => t + n.need * n.unitCost, 0);
  const overhead = (materials + labor) * ((recipe.overheadPct ?? settings.overheadPct) / 100);
  const total = materials + labor + overhead;
  return { recipe, needs, materials: r2(materials), labor: r2(labor), overhead: r2(overhead), total: r2(total), unitCost: qty > 0 ? Math.round((total / qty) * 10000) / 10000 : 0, shortages: needs.filter((n) => n.short > 0.0001) };
}

/**
 * Termina un lote: descuenta los insumos, suma las unidades al stock del producto y guarda el costo real.
 * Todo se aplica junto (o nada). Si faltan insumos, avisa cuáles, salvo que se pida seguir igual.
 */
export async function completeBatch(batchId: string, actor: string, force = false) {
  const [batch] = await db.select().from(productionBatches).where(eq(productionBatches.id, batchId));
  if (!batch) throw new ProductionError("Lote no encontrado.", 404);
  if (batch.status !== "planned") throw new ProductionError(batch.status === "done" ? "Este lote ya se terminó." : "Este lote está cancelado.", 409);

  const q = await quote(batch.productSlug, batch.qty);
  if (q.shortages.length > 0 && !force) {
    throw new ProductionError("Faltan insumos para producir este lote.", 409, q.shortages.map((n) => ({ name: n.name, unit: n.unit, need: n.need, stock: n.stock, short: n.short })));
  }

  const now = Math.floor(Date.now() / 1000);
  const ops: unknown[] = [
    // Se "reserva" el lote: si dos personas lo terminan a la vez, solo una pasa (la otra no cambia nada)
    db.update(productionBatches).set({ status: "done", finishedAt: now, costTotal: q.total, costUnit: q.unitCost }).where(and(eq(productionBatches.id, batchId), eq(productionBatches.status, "planned"))),
  ];
  for (const n of q.needs) {
    ops.push(
      db.update(supplies).set({ stock: sql`${supplies.stock} - ${n.need}` }).where(eq(supplies.id, n.supplyId)),
      db.insert(supplyMovements).values({ supplyId: n.supplyId, type: "production", qty: -n.need, unitCost: n.unitCost, totalCost: -n.cost, ref: batchId, note: `Producción ${batchId}`, createdBy: actor }),
      db.insert(productionBatchItems).values({ batchId, supplyId: n.supplyId, qty: n.need, unitCost: n.unitCost }),
    );
  }
  ops.push(db.update(products).set({ stock: sql`${products.stock} + ${batch.qty}` }).where(eq(products.slug, batch.productSlug)));
  await run(ops);
  return { id: batchId, costTotal: q.total, costUnit: q.unitCost };
}

/** Número de lote siguiente: LT-0001, LT-0002… */
export async function nextBatchId() {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(productionBatches);
  return `LT-${String((row?.n ?? 0) + 1).padStart(4, "0")}`;
}
