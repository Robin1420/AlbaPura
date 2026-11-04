import { inArray } from "drizzle-orm";
import { computeCost, loadLines, loadSettings } from "./costing";
import { db, recipes, stockMovements, type StockMovementType } from "./db";

/** Costo de producir una unidad de cada producto con receta, a precios de hoy. Sin receta → null. */
export async function unitCosts(slugs: string[]): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>(slugs.map((s) => [s, null]));
  if (slugs.length === 0) return out;
  const settings = await loadSettings();
  const rs = await db.select().from(recipes).where(inArray(recipes.productSlug, slugs));
  for (const r of rs) {
    const lines = await loadLines(r.productSlug);
    if (lines.length === 0) continue;
    out.set(r.productSlug, computeCost(r, lines, settings).unitCost);
  }
  return out;
}

/** Fila del historial de stock de un producto terminado (qty: + entra, − sale). */
export function stockEntry(productSlug: string, type: StockMovementType, qty: number, o: { ref?: string; note?: string; actor?: string } = {}) {
  return db.insert(stockMovements).values({ productSlug, type, qty, ref: o.ref ?? null, note: o.note ?? null, createdBy: o.actor ?? null });
}

/** Un ajuste manual (corrección de conteo): se guarda como aumento o reducción, nunca como producción. */
export async function logManualAdjust(productSlug: string, before: number, after: number, actor: string, note = "Ajuste manual") {
  if (before === after) return;
  await stockEntry(productSlug, after > before ? "adjust_in" : "adjust_out", after - before, { note, actor });
}

