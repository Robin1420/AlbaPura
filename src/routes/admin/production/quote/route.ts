import { eq } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { loadSettings, pricing } from "@/server/costing";
import { quoteInput } from "@/server/costing-input";
import { db, products } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { ProductionError, quote } from "@/server/production";

/** Cotiza una producción: qué insumos hacen falta, cuánto cuesta, qué falta comprar y cuánto se ganaría vendiéndola. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, quoteInput);
  if (!body.ok) return body.res;
  const { productSlug, qty } = body.data;
  const [p] = await db.select().from(products).where(eq(products.slug, productSlug));
  if (!p) return fail("Producto no encontrado.", 404);
  try {
    const s = await loadSettings();
    const q = await quote(productSlug, qty, s);
    const unit = pricing(q.unitCost, p.price, q.recipe.targetMargin, s);
    const round = (n: number) => Math.round(n * 100) / 100;
    return json({
      product: { slug: p.slug, name: p.name, price: p.price, stock: p.stock },
      qty,
      needs: q.needs,
      shortages: q.shortages,
      cost: { materials: q.materials, labor: q.labor, overhead: q.overhead, total: q.total, unit: q.unitCost },
      sale: { revenue: round(p.price * qty), profit: round(unit.profit * qty), margin: unit.margin, suggestedPrice: unit.suggested, targetMargin: q.recipe.targetMargin },
    });
  } catch (e) {
    if (e instanceof ProductionError) return fail(e.message, e.status);
    throw e;
  }
}
