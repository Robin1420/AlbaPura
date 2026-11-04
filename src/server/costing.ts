import { eq } from "drizzle-orm";
import { db, recipeItems, settings, supplies } from "./db";

/** Ajustes generales del costeo (se editan en el panel). */
export type CostSettings = {
  /** S/ por hora de trabajo, si la receta no define la suya. */
  laborRate: number;
  /** % de gastos indirectos (luz, agua, gas, alquiler…) sobre materiales + mano de obra. */
  overheadPct: number;
  /** Comisión de la pasarela de pago (% del precio) y monto fijo por cobro. */
  gatewayPct: number;
  gatewayFixed: number;
  /** Si el precio de venta incluye IGV, el margen se calcula sobre el precio sin IGV. */
  applyIgv: boolean;
  igvRate: number;
};

export const defaultSettings: CostSettings = { laborRate: 0, overheadPct: 0, gatewayPct: 4, gatewayFixed: 0, applyIgv: false, igvRate: 18 };

export async function loadSettings(): Promise<CostSettings> {
  const [row] = await db.select().from(settings).where(eq(settings.key, "costing"));
  if (!row) return defaultSettings;
  try {
    return { ...defaultSettings, ...(JSON.parse(row.value) as Partial<CostSettings>) };
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(s: CostSettings) {
  const value = JSON.stringify(s);
  await db.insert(settings).values({ key: "costing", value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}

/** Unidades de compra que se convierten a la unidad base del insumo. */
export const unitFactors: Record<string, { base: "g" | "ml" | "un"; factor: number; label: string }> = {
  g: { base: "g", factor: 1, label: "gramos" },
  kg: { base: "g", factor: 1000, label: "kilos" },
  ml: { base: "ml", factor: 1, label: "mililitros" },
  l: { base: "ml", factor: 1000, label: "litros" },
  un: { base: "un", factor: 1, label: "unidades" },
  docena: { base: "un", factor: 12, label: "docenas" },
  ciento: { base: "un", factor: 100, label: "cientos" },
};

export type Line = { supplyId: string; name: string; unit: string; kind: string; qty: number; unitCost: number };
export type RecipeParams = { yieldUnits: number; laborHours: number; laborRate: number | null; overheadPct: number | null; wastePct: number };

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

/** Costo de un lote de la receta y de cada unidad. */
export function computeCost(p: RecipeParams, lines: Line[], s: CostSettings) {
  const materials = lines.reduce((t, l) => t + l.qty * l.unitCost, 0);
  // La merma se aplica a las materias primas; los empaques se cuentan exactos (una caja es una caja)
  const waste = lines.reduce((t, l) => t + (l.kind === "empaque" ? 0 : l.qty * l.unitCost), 0) * (p.wastePct / 100);
  const labor = p.laborHours * (p.laborRate ?? s.laborRate);
  const overhead = (materials + waste + labor) * ((p.overheadPct ?? s.overheadPct) / 100);
  const batchTotal = materials + waste + labor + overhead;
  const yieldUnits = Math.max(1, p.yieldUnits);
  return {
    materials: r2(materials),
    waste: r2(waste),
    labor: r2(labor),
    overhead: r2(overhead),
    batchTotal: r2(batchTotal),
    unitCost: r4(batchTotal / yieldUnits),
  };
}

/**
 * Ganancia y margen de vender una unidad al precio indicado (sin contar el envío), y el precio mínimo
 * entero en soles que logra el margen deseado. Descuenta el IGV (si aplica) y la comisión de la pasarela.
 */
export function pricing(unitCost: number, price: number, targetMargin: number, s: CostSettings) {
  const k = s.applyIgv ? 1 / (1 + s.igvRate / 100) : 1;
  const net = price * k;
  const gateway = price * (s.gatewayPct / 100) + s.gatewayFixed;
  const profit = net - gateway - unitCost;
  const margin = net > 0 ? (profit / net) * 100 : 0;
  const m = targetMargin / 100;
  const denom = k * (1 - m) - s.gatewayPct / 100;
  const suggested = denom > 0 && unitCost > 0 ? Math.ceil((unitCost + s.gatewayFixed) / denom) : null;
  return { net: r2(net), gateway: r2(gateway), profit: r2(profit), margin: r2(margin), suggested };
}

/** Líneas de una receta con el nombre, la unidad y el costo actual de cada insumo. */
export async function loadLines(productSlug: string): Promise<Line[]> {
  const rows = await db
    .select({ supplyId: recipeItems.supplyId, qty: recipeItems.qty, name: supplies.name, unit: supplies.unit, kind: supplies.kind, unitCost: supplies.unitCost })
    .from(recipeItems)
    .innerJoin(supplies, eq(supplies.id, recipeItems.supplyId))
    .where(eq(recipeItems.productSlug, productSlug));
  return rows;
}
