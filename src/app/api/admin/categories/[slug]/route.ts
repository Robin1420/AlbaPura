import { eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { categories, db, products } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { categoryInput } from "@/server/product-input";

export async function PUT(req: Request, ctx: RouteContext<"/api/admin/categories/[slug]">) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, categoryInput);
  if (!body.ok) return body.res;
  const d = body.data;
  const { slug } = await ctx.params;
  const r = await db.update(categories).set({ name: d.name, description: d.description, image: d.image ?? null, sortOrder: d.sortOrder, active: d.active }).where(eq(categories.slug, slug));
  if (r.rowsAffected === 0) return fail("Categoría no encontrada.", 404);
  revalidateTag("catalog", { expire: 0 });
  return json({ slug });
}

/** No se puede eliminar una categoría que todavía tiene productos: hay que moverlos primero. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/admin/categories/[slug]">) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { slug } = await ctx.params;
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(products).where(eq(products.categorySlug, slug));
  if (n > 0) return fail(`Esta categoría tiene ${n} producto${n === 1 ? "" : "s"}. Muévelos a otra categoría antes de eliminarla.`, 409);
  const r = await db.delete(categories).where(eq(categories.slug, slug));
  if (r.rowsAffected === 0) return fail("Categoría no encontrada.", 404);
  revalidateTag("catalog", { expire: 0 });
  return json({ ok: true });
}
