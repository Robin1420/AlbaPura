import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { computeCost, loadSettings, pricing, type Line } from "@/server/costing";
import { db, products, recipeItems, recipes, supplies } from "@/server/db";
import { json } from "@/server/http";

/** Costo, precio y margen de cada producto. */
export async function GET() {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const s = await loadSettings();
  const [prods, recs, items, sups] = await Promise.all([
    db.select().from(products).orderBy(asc(products.sortOrder), asc(products.name)),
    db.select().from(recipes),
    db.select({ productSlug: recipeItems.productSlug, supplyId: recipeItems.supplyId, qty: recipeItems.qty, name: supplies.name, unit: supplies.unit, kind: supplies.kind, unitCost: supplies.unitCost }).from(recipeItems).innerJoin(supplies, eq(supplies.id, recipeItems.supplyId)),
    db.select().from(supplies),
  ]);
  const byRecipe = new Map(recs.map((r) => [r.productSlug, r]));
  const rows = prods.map((p) => {
    const base = { slug: p.slug, name: p.name, price: p.price, stock: p.stock, active: p.active, comingSoon: p.comingSoon };
    const r = byRecipe.get(p.slug);
    const lines: Line[] = items.filter((i) => i.productSlug === p.slug);
    if (!r || lines.length === 0) return { ...base, hasRecipe: false, status: "sin-receta" as const };
    const c = computeCost(r, lines, s);
    const pr = pricing(c.unitCost, p.price, r.targetMargin, s);
    const status = p.price > 0 && pr.margin < r.targetMargin ? ("bajo" as const) : ("ok" as const);
    return { ...base, hasRecipe: true, yieldUnits: r.yieldUnits, targetMargin: r.targetMargin, ...c, ...pr, status };
  });
  const inventory = Math.round(sups.filter((x) => x.active).reduce((t, x) => t + Math.max(0, x.stock) * x.unitCost, 0) * 100) / 100;
  const margins = rows.flatMap((r) => ("margin" in r && r.price > 0 ? [r.margin] : []));
  return json({
    products: rows,
    settings: s,
    summary: {
      inventory,
      lowStock: sups.filter((x) => x.active && x.minStock > 0 && x.stock <= x.minStock).length,
      avgMargin: margins.length ? Math.round((margins.reduce((t, m) => t + m, 0) / margins.length) * 100) / 100 : null,
      belowTarget: rows.filter((r) => r.status === "bajo").length,
      withoutRecipe: rows.filter((r) => r.status === "sin-receta").length,
    },
  });
}
