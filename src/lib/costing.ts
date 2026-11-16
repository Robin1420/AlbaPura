/** Utilidades del módulo de costos y producción (panel de administración). */

export type Unit = "g" | "ml" | "un";

export type CostSettings = {
  laborRate: number;
  overheadPct: number;
  gatewayPct: number;
  gatewayFixed: number;
  applyIgv: boolean;
  igvRate: number;
};

export type SupplyKind = "materia" | "empaque" | "otro";

/** Soles con céntimos: los costos de un producto suelen ser S/ 4.46, no S/ 4. */
export const soles = (n: number | null | undefined) =>
  n == null || Number.isNaN(n) ? "—" : "S/ " + n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const pct = (n: number | null | undefined) => (n == null || Number.isNaN(n) ? "—" : `${n.toLocaleString("es-PE", { maximumFractionDigits: 1 })} %`);

const num = (n: number, max = 2) => n.toLocaleString("es-PE", { maximumFractionDigits: max });

/** Cantidad en la unidad base, mostrada en una unidad cómoda (1500 g → 1.5 kg). */
export function qty(n: number, unit: Unit) {
  if (unit === "g") return Math.abs(n) >= 1000 ? `${num(n / 1000)} kg` : `${num(n)} g`;
  if (unit === "ml") return Math.abs(n) >= 1000 ? `${num(n / 1000)} L` : `${num(n)} ml`;
  return `${num(n)} un`;
}

/** Costo de comparar por kilo, litro o unidad (más legible que por gramo). */
export function costPerBig(unitCost: number, unit: Unit) {
  if (unit === "g") return `${soles(unitCost * 1000)} / kg`;
  if (unit === "ml") return `${soles(unitCost * 1000)} / L`;
  return `${soles(unitCost)} / un`;
}

export const kindLabel: Record<SupplyKind, string> = { materia: "Materia prima", empaque: "Empaque", otro: "Otro" };

/** Unidades de compra y de ajuste por unidad base. */
export const buyUnits: Record<Unit, { value: string; label: string }[]> = {
  g: [{ value: "g", label: "gramos (g)" }, { value: "kg", label: "kilos (kg)" }],
  ml: [{ value: "ml", label: "mililitros (ml)" }, { value: "l", label: "litros (L)" }],
  un: [{ value: "un", label: "unidades" }, { value: "docena", label: "docenas" }, { value: "ciento", label: "cientos" }],
};

export type CostLine = { kind: string; qty: number; unitCost: number };
export type RecipeParams = { yieldUnits: number; laborHours: number; laborRate: number | null; overheadPct: number | null; wastePct: number };

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

/** Mismo cálculo que hace la API, para mostrar el resultado mientras se edita la receta. */
export function computeCost(p: RecipeParams, lines: CostLine[], s: CostSettings) {
  const materials = lines.reduce((t, l) => t + l.qty * l.unitCost, 0);
  const waste = lines.reduce((t, l) => t + (l.kind === "empaque" ? 0 : l.qty * l.unitCost), 0) * (p.wastePct / 100);
  const labor = p.laborHours * (p.laborRate ?? s.laborRate);
  const overhead = (materials + waste + labor) * ((p.overheadPct ?? s.overheadPct) / 100);
  const batchTotal = materials + waste + labor + overhead;
  return { materials: r2(materials), waste: r2(waste), labor: r2(labor), overhead: r2(overhead), batchTotal: r2(batchTotal), unitCost: r4(batchTotal / Math.max(1, p.yieldUnits)) };
}

export function pricing(unitCost: number, price: number, targetMargin: number, s: CostSettings) {
  const k = s.applyIgv ? 1 / (1 + s.igvRate / 100) : 1;
  const net = price * k;
  const gateway = price * (s.gatewayPct / 100) + s.gatewayFixed;
  const profit = net - gateway - unitCost;
  const margin = net > 0 ? (profit / net) * 100 : 0;
  const denom = k * (1 - targetMargin / 100) - s.gatewayPct / 100;
  const suggested = denom > 0 && unitCost > 0 ? Math.ceil((unitCost + s.gatewayFixed) / denom) : null;
  return { net: r2(net), gateway: r2(gateway), profit: r2(profit), margin: r2(margin), suggested };
}

/** Texto a número: acepta coma o punto decimal y vacío = 0. */
export const toNum = (v: string) => {
  const n = Number(v.replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
};
