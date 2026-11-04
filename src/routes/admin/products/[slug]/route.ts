import { changes } from "@/server/http";
import type { RouteCtx } from "@/shims/route";
import { eq } from "drizzle-orm";
import { revalidateTag } from "@/shims/cache";
import { requireAdmin } from "@/server/auth";
import { badges, categories, db, favorites, productionBatches, products } from "@/server/db";
import { logManualAdjust } from "@/server/stock";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { productInput } from "@/server/product-input";

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { slug } = await ctx.params;
  const [p] = await db.select().from(products).where(eq(products.slug, slug));
  if (!p) return fail("Producto no encontrado.", 404);
  const cats = await db.select({ slug: categories.slug, name: categories.name }).from(categories);
  const bs = await db.select().from(badges);
  return json({ product: p, categories: cats, badges: bs.map((b) => ({ slug: b.slug, name: b.name, tone: b.tone, active: b.active })) });
}

/** Reemplaza todos los campos editables del producto (el slug no cambia para no romper enlaces). */
export async function PUT(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, productInput);
  if (!body.ok) return body.res;
  const d = body.data;
  const { slug } = await ctx.params;

  if (!d.comingSoon && d.price < 1) return fail("Escribe el precio, o marca el producto como Próximamente.", 422, { price: "Escribe el precio." });

  if (d.badge) {
    const [b] = await db.select({ slug: badges.slug }).from(badges).where(eq(badges.slug, d.badge));
    if (!b) return fail("La etiqueta elegida no existe.", 422, { badge: "La etiqueta elegida no existe." });
  }

  const [cat] = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.slug, d.categorySlug));
  if (!cat) return fail("La categoría elegida no existe.", 422, { categorySlug: "La categoría elegida no existe." });

  const [prev] = await db.select({ stock: products.stock }).from(products).where(eq(products.slug, slug));
  const r = await db
    .update(products)
    .set({
      name: d.name,
      categorySlug: d.categorySlug,
      meta: d.meta,
      latin: d.latin || null,
      description: d.description,
      price: d.price,
      oldPrice: d.oldPrice ?? null,
      stock: d.stock,
      active: d.active,
      comingSoon: d.comingSoon,
      badge: d.badge || null,
      images: d.images,
      notes: d.notes,
      provenance: d.provenance,
      art: d.art ?? null,
      sortOrder: d.sortOrder,
    })
    .where(eq(products.slug, slug));
  if (changes(r) === 0) return fail("Producto no encontrado.", 404);
  if (prev) await logManualAdjust(slug, prev.stock, d.stock, auth.user.email);
  revalidateTag("catalog", { expire: 0 });
  return json({ slug });
}

/** Cambios rápidos de la lista (precio, stock, visibilidad). */
export async function PATCH(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, productInput.pick({ price: true, stock: true, active: true, comingSoon: true }).partial());
  if (!body.ok) return body.res;
  if (Object.keys(body.data).length === 0) return fail("No hay nada que cambiar.", 400);
  const { slug } = await ctx.params;
  const [prev] = await db.select({ stock: products.stock }).from(products).where(eq(products.slug, slug));
  const r = await db.update(products).set(body.data).where(eq(products.slug, slug));
  if (changes(r) === 0) return fail("Producto no encontrado.", 404);
  if (prev && body.data.stock !== undefined) await logManualAdjust(slug, prev.stock, body.data.stock, auth.user.email);
  revalidateTag("catalog", { expire: 0 });
  return json({ slug });
}

/** Elimina el producto. Los pedidos antiguos conservan nombre y precio de cuando se compró. */
export async function DELETE(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { slug } = await ctx.params;
  // Un producto con lotes de producción guarda su historial de costos: no se borra, se oculta
  const batch = await db.select({ id: productionBatches.id }).from(productionBatches).where(eq(productionBatches.productSlug, slug)).limit(1);
  if (batch.length) return fail("Este producto tiene lotes de producción registrados, así que no se puede eliminar. Si no quieres venderlo, cámbialo a “Oculto”.", 409);
  await db.delete(favorites).where(eq(favorites.slug, slug));
  const r = await db.delete(products).where(eq(products.slug, slug));
  if (changes(r) === 0) return fail("Producto no encontrado.", 404);
  revalidateTag("catalog", { expire: 0 });
  return json({ ok: true });
}
