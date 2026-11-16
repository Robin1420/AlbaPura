import { and, asc, desc, eq } from "drizzle-orm";
import type { Catalog, Product } from "@/types";
import { badges as badgesTable, categories as categoriesTable, db, products as productsTable, recipeItems, supplies as suppliesTable } from "./db";

/**
 * Catálogo público completo (productos activos con su categoría) desde la base de datos.
 * Se guarda en caché con la etiqueta "catalog"; el panel la invalida al guardar cualquier cambio.
 */
export async function getCatalog(): Promise<Catalog> {
  const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.active, true)).orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));
  const rows = await db.select().from(productsTable).where(eq(productsTable.active, true)).orderBy(asc(productsTable.sortOrder), asc(productsTable.name));
  const badgeRows = await db.select().from(badgesTable).where(eq(badgesTable.active, true));
  const badgeBySlug = new Map(badgeRows.map((b) => [b.slug, b]));
  const bySlug = new Map(cats.map((c) => [c.slug, c]));

  // Ingredientes = materias primas de la receta (sin empaques). Solo se publica el nombre, nunca cantidades ni costos.
  const used = await db
    .select({ productSlug: recipeItems.productSlug, name: suppliesTable.name, qty: recipeItems.qty })
    .from(recipeItems)
    .innerJoin(suppliesTable, eq(recipeItems.supplyId, suppliesTable.id))
    .where(and(eq(suppliesTable.kind, "materia"), eq(suppliesTable.active, true)))
    .orderBy(desc(recipeItems.qty));
  const ingredientsBySlug = new Map<string, string[]>();
  for (const u of used) ingredientsBySlug.set(u.productSlug, [...(ingredientsBySlug.get(u.productSlug) ?? []), u.name]);

  const products: Product[] = rows
    .filter((p) => bySlug.has(p.categorySlug))
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: bySlug.get(p.categorySlug)!.name,
      categorySlug: p.categorySlug,
      meta: p.meta,
      latin: p.latin ?? undefined,
      // Un producto "Próximamente" no publica precio (ni siquiera en la API pública)
      price: p.comingSoon ? 0 : p.price,
      oldPrice: p.oldPrice ?? undefined,
      stock: p.stock,
      comingSoon: p.comingSoon,
      rating: p.rating,
      reviews: p.reviews,
      badge: p.badge ? badgeBySlug.get(p.badge)?.name : undefined,
      badgeTone: p.badge ? badgeBySlug.get(p.badge)?.tone : undefined,
      image: p.images[0],
      images: p.images,
      art: p.art ?? undefined,
      description: p.description,
      notes: p.notes,
      provenance: p.provenance,
      ingredients: ingredientsBySlug.get(p.slug) ?? [],
      processDoc: p.processDoc ?? undefined,
      usageDoc: p.usageDoc ?? undefined,
    }));

  return {
    products,
    categories: cats.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description || undefined,
      image: c.image ?? undefined,
      count: products.filter((p) => p.categorySlug === c.slug).length,
    })),
  };
}
