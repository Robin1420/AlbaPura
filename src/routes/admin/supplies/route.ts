import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { db, supplies, supplyMovements } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { supplyInput } from "@/server/costing-input";
import { uniqueSlug } from "@/server/slug";

export async function GET() {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const rows = await db.select().from(supplies).orderBy(asc(supplies.name));
  const list = rows.map((s) => ({ ...s, value: Math.round(Math.max(0, s.stock) * s.unitCost * 100) / 100, low: s.minStock > 0 && s.stock <= s.minStock }));
  return json({ supplies: list, totals: { value: Math.round(list.filter((s) => s.active).reduce((t, s) => t + s.value, 0) * 100) / 100, low: list.filter((s) => s.active && s.low).length } });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, supplyInput);
  if (!body.ok) return body.res;
  const d = body.data;
  const id = await uniqueSlug(d.name, async (s) => (await db.select({ s: supplies.id }).from(supplies).where(eq(supplies.id, s))).length > 0);
  const stock = d.initialStock ?? 0;
  const unitCost = d.unitCost ?? (stock > 0 && d.initialTotalCost ? d.initialTotalCost / stock : 0);
  await db.insert(supplies).values({ id, name: d.name, kind: d.kind, unit: d.unit, stock, minStock: d.minStock, unitCost, supplier: d.supplier ?? null, notes: d.notes ?? null, active: d.active });
  if (stock > 0) await db.insert(supplyMovements).values({ supplyId: id, type: "initial", qty: stock, unitCost, totalCost: Math.round(stock * unitCost * 100) / 100, note: "Stock inicial", createdBy: auth.user.email });
  return json({ id }, 201);
}
