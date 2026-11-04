import { z } from "zod";

const units = ["g", "kg", "ml", "l", "un", "docena", "ciento"] as const;
const text = (max: number) => z.string().trim().max(max).nullable().optional();

export const supplyInput = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del insumo.").max(80),
  kind: z.enum(["materia", "empaque", "otro"]).default("materia"),
  unit: z.enum(["g", "ml", "un"]),
  minStock: z.number().min(0).max(1e9).default(0),
  /** Costo por unidad base (S/ por g, ml o unidad). Normalmente se calcula con las compras. */
  unitCost: z.number().min(0).max(1e6).optional(),
  supplier: text(80),
  notes: text(300),
  active: z.boolean().default(true),
  initialStock: z.number().min(0).max(1e9).optional(),
  initialTotalCost: z.number().min(0).max(1e8).optional(),
});

export const purchaseInput = z.object({
  qty: z.number().positive("La cantidad debe ser mayor que cero.").max(1e9),
  unit: z.enum(units),
  totalCost: z.number().min(0, "El costo no puede ser negativo.").max(1e8),
  supplier: text(80),
  note: text(120),
});

export const adjustInput = z.object({
  mode: z.enum(["delta", "count"]),
  qty: z.number().min(-1e9).max(1e9),
  unit: z.enum(units),
  reason: z.string().trim().max(120).default(""),
});

export const recipeInput = z.object({
  yieldUnits: z.number().int("Las unidades por lote deben ser un número entero.").min(1, "Indica cuántas unidades salen por lote.").max(100000),
  laborHours: z.number().min(0).max(1000).default(0),
  laborRate: z.number().min(0).max(10000).nullable().default(null),
  overheadPct: z.number().min(0).max(1000).nullable().default(null),
  wastePct: z.number().min(0).max(100).default(0),
  targetMargin: z.number().min(0).max(95).default(50),
  notes: text(500),
  items: z.array(z.object({ supplyId: z.string().min(1), qty: z.number().positive("Cada insumo necesita una cantidad mayor que cero.").max(1e9) })).max(40),
});

export const settingsInput = z.object({
  laborRate: z.number().min(0).max(10000),
  overheadPct: z.number().min(0).max(1000),
  gatewayPct: z.number().min(0).max(50),
  gatewayFixed: z.number().min(0).max(100),
  applyIgv: z.boolean(),
  igvRate: z.number().min(0).max(30),
});

export const batchInput = z.object({
  productSlug: z.string().min(1),
  qty: z.number().int("Las unidades deben ser un número entero.").min(1, "Indica cuántas unidades vas a producir.").max(100000),
  notes: text(200),
  expiresAt: z.number().int().nullable().optional(),
  produceNow: z.boolean().default(false),
  force: z.boolean().default(false),
});

export const quoteInput = z.object({ productSlug: z.string().min(1), qty: z.number().int().min(1).max(100000) });
export const batchAction = z.object({ action: z.enum(["complete", "cancel"]), force: z.boolean().default(false) });
