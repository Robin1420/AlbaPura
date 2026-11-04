import { eq, sql } from "drizzle-orm";
import type { RouteCtx } from "@/shims/route";
import { requireAdmin } from "@/server/auth";
import { unitFactors } from "@/server/costing";
import { purchaseInput } from "@/server/costing-input";
import { db, supplies, supplyMovements } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";

type Q = Parameters<typeof db.batch>[0];

/** Registra una compra: suma al stock y recalcula el costo por unidad como promedio ponderado. */
export async function POST(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { id } = await ctx.params;
  const body = await parseBody(req, purchaseInput);
  if (!body.ok) return body.res;
  const d = body.data;
  const [s] = await db.select().from(supplies).where(eq(supplies.id, id));
  if (!s) return fail("Insumo no encontrado.", 404);
  const f = unitFactors[d.unit];
  if (f.base !== s.unit) return fail(`Este insumo se mide en ${s.unit}; elige una unidad compatible.`, 422, { unit: "Unidad no compatible." });

  const qtyBase = d.qty * f.factor;
  const held = Math.max(0, s.stock);
  const unitCost = held + qtyBase > 0 ? (held * s.unitCost + d.totalCost) / (held + qtyBase) : 0;
  await db.batch([
    db.update(supplies).set({ stock: sql`${supplies.stock} + ${qtyBase}`, unitCost, supplier: d.supplier || s.supplier }).where(eq(supplies.id, id)),
    db.insert(supplyMovements).values({ supplyId: id, type: "purchase", qty: qtyBase, unitCost: d.totalCost / qtyBase, totalCost: d.totalCost, note: d.note || d.supplier || null, createdBy: auth.user.email }),
  ] as unknown as Q);
  return json({ id, stock: s.stock + qtyBase, unitCost });
}
