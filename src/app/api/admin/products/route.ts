import { asc, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { badges, categories, db, products } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { productInput } from "@/server/product-input";
import { uniqueSlug } from "@/server/slug";

/** Lista completa (también los ocultos) para el panel. */
export async function GET() {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const rows = await db.select().from(products).orderBy(asc(products.sortOrder), asc(products.name));
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  const catName = new Map(cats.map((c) => [c.slug, c.name]));
  return json({
    products: rows.map((p) => ({ ...p, categoryName: catName.get(p.categorySlug) ?? "Sin categoría" })),
    categories: cats.map((c) => ({ slug: c.slug, name: c.name })),
    badges: (await db.select().from(badges).orderBy(asc(badges.sortOrder))).map((b) => ({ slug: b.slug, name: b.name, tone: b.tone, active: b.active })),
  });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, productInput);
  if (!body.ok) return body.res;
  const d = body.data;

  if (!d.comingSoon && d.price < 1) return fail("Escribe el precio, o marca el producto como Próximamente.", 422, { price: "Escribe el precio." });

  if (d.badge) {
    const [b] = await db.select({ slug: badges.slug }).from(badges).where(eq(badges.slug, d.badge));
    if (!b) return fail("La etiqueta elegida no existe.", 422, { badge: "La etiqueta elegida no existe." });
  }

  const [cat] = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.slug, d.categorySlug));
  if (!cat) return fail("La categoría elegida no existe.", 422, { categorySlug: "La categoría elegida no existe." });

  const slug = await uniqueSlug(d.name, async (s) => (await db.select({ s: products.slug }).from(products).where(eq(products.slug, s))).length > 0);
  await db.insert(products).values({
    slug,
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
  });
  revalidateTag("catalog", { expire: 0 });
  return json({ slug }, 201);
}
