import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { badges, db, products } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { badgeInput } from "@/server/product-input";

export async function PUT(req: Request, ctx: RouteContext<"/api/admin/badges/[slug]">) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, badgeInput);
  if (!body.ok) return body.res;
  const { slug } = await ctx.params;
  const r = await db.update(badges).set({ name: body.data.name, tone: body.data.tone, sortOrder: body.data.sortOrder, active: body.data.active }).where(eq(badges.slug, slug));
  if (r.rowsAffected === 0) return fail("Etiqueta no encontrada.", 404);
  revalidateTag("catalog", { expire: 0 });
  return json({ slug });
}

/** Al eliminar una etiqueta, los productos que la tenían quedan sin etiqueta. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/admin/badges/[slug]">) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { slug } = await ctx.params;
  await db.update(products).set({ badge: null }).where(eq(products.badge, slug));
  const r = await db.delete(badges).where(eq(badges.slug, slug));
  if (r.rowsAffected === 0) return fail("Etiqueta no encontrada.", 404);
  revalidateTag("catalog", { expire: 0 });
  return json({ ok: true });
}
