import { eq } from "drizzle-orm";
import type { RouteCtx } from "@/shims/route";
import { requireAdmin } from "@/server/auth";
import { computeCost, loadLines, loadSettings, pricing } from "@/server/costing";
import { recipeInput } from "@/server/costing-input";
import { db, products, recipeItems, recipes, supplies } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";

type Q = Parameters<typeof db.batch>[0];

async function detail(slug: string) {
  const [p] = await db.select().from(products).where(eq(products.slug, slug));
  if (!p) return null;
  const [r] = await db.select().from(recipes).where(eq(recipes.productSlug, slug));
  const s = await loadSettings();
  const lines = await loadLines(slug);
  const params = r ?? { yieldUnits: 1, laborHours: 0, laborRate: null, overheadPct: null, wastePct: 0, targetMargin: 50, notes: null };
  const cost = computeCost(params, lines, s);
  return {
    product: { slug: p.slug, name: p.name, price: p.price, stock: p.stock },
    recipe: { yieldUnits: params.yieldUnits, laborHours: params.laborHours, laborRate: params.laborRate, overheadPct: params.overheadPct, wastePct: params.wastePct, targetMargin: params.targetMargin, notes: params.notes ?? null },
    lines,
    cost,
    pricing: pricing(cost.unitCost, p.price, params.targetMargin, s),
    settings: s,
    exists: Boolean(r),
  };
}

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const d = await detail((await ctx.params).slug);
  return d ? json(d) : fail("Producto no encontrado.", 404);
}

/** Guarda la receta y los datos de costeo del producto. */
export async function PUT(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { slug } = await ctx.params;
  const body = await parseBody(req, recipeInput);
  if (!body.ok) return body.res;
  const d = body.data;
  const [p] = await db.select({ slug: products.slug }).from(products).where(eq(products.slug, slug));
  if (!p) return fail("Producto no encontrado.", 404);

  // Un mismo insumo repetido se suma
  const merged = new Map<string, number>();
  for (const i of d.items) merged.set(i.supplyId, (merged.get(i.supplyId) ?? 0) + i.qty);
  const have = await db.select({ id: supplies.id }).from(supplies);
  const ids = new Set(have.map((h) => h.id));
  for (const id of merged.keys()) if (!ids.has(id)) return fail("Uno de los insumos ya no existe. Recarga la lista.", 422);

  const values = { yieldUnits: d.yieldUnits, laborHours: d.laborHours, laborRate: d.laborRate, overheadPct: d.overheadPct, wastePct: d.wastePct, targetMargin: d.targetMargin, notes: d.notes ?? null, updatedAt: Math.floor(Date.now() / 1000) };
  await db.batch([
    db.insert(recipes).values({ productSlug: slug, ...values }).onConflictDoUpdate({ target: recipes.productSlug, set: values }),
    db.delete(recipeItems).where(eq(recipeItems.productSlug, slug)),
    ...[...merged].map(([supplyId, qty]) => db.insert(recipeItems).values({ productSlug: slug, supplyId, qty })),
  ] as unknown as Q);
  return json(await detail(slug));
}
