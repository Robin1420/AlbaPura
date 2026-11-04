import { eq, sql } from "drizzle-orm";
import type { RouteCtx } from "@/shims/route";
import { requireAdmin } from "@/server/auth";
import { unitFactors } from "@/server/costing";
import { adjustInput } from "@/server/costing-input";
import { db, supplies, supplyMovements } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";

type Q = Parameters<typeof db.batch>[0];

/** Corrige el stock: por una diferencia (merma, rotura) o contando lo que hay realmente. */
export async function POST(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { id } = await ctx.params;
  const body = await parseBody(req, adjustInput);
  if (!body.ok) return body.res;
  const d = body.data;
  const [s] = await db.select().from(supplies).where(eq(supplies.id, id));
  if (!s) return fail("Insumo no encontrado.", 404);
  const f = unitFactors[d.unit];
  if (f.base !== s.unit) return fail(`Este insumo se mide en ${s.unit}; elige una unidad compatible.`, 422, { unit: "Unidad no compatible." });
  if (d.mode === "count" && d.qty < 0) return fail("El conteo no puede ser negativo.", 422, { qty: "No puede ser negativo." });

  const delta = d.mode === "delta" ? d.qty * f.factor : d.qty * f.factor - s.stock;
  if (Math.abs(delta) < 1e-9) return json({ id, stock: s.stock });
  await db.batch([
    db.update(supplies).set({ stock: sql`${supplies.stock} + ${delta}` }).where(eq(supplies.id, id)),
    db.insert(supplyMovements).values({ supplyId: id, type: "adjustment", qty: delta, unitCost: s.unitCost, totalCost: Math.round(delta * s.unitCost * 100) / 100, note: d.reason || (d.mode === "count" ? "Conteo de inventario" : "Ajuste"), createdBy: auth.user.email }),
  ] as unknown as Q);
  return json({ id, stock: s.stock + delta });
}
