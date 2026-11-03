/**
 * Reemplaza el catálogo de ejemplo por el de la fase de prueba en Lima (ver scripts/seed-data.ts):
 * actualiza categorías y productos, y elimina los de ejemplo anteriores que ya no existen.
 * ATENCIÓN: sobrescribe nombre, precio, descripción y fotos de los productos que coinciden por slug.
 * Uso: npx tsx --env-file=.env.local scripts/update-content.mts
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, inArray, notInArray } from "drizzle-orm";
import { badges, categories, favorites, products } from "../src/server/db/schema";
import { categoryOf, seedCategories, seedProducts } from "./seed-data";

const client = createClient({ url: process.env.DATABASE_URL ?? "file:./data/alba.db", authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
const db = drizzle(client);

const badgeRows = await db.select().from(badges);
const badgeSlug = (name?: string) => badgeRows.find((b) => b.name === name)?.slug ?? null;

for (const c of seedCategories) {
  const v = { name: c.name, description: c.description, image: c.image, sortOrder: c.sortOrder, active: true };
  await db.insert(categories).values({ slug: c.slug, ...v }).onConflictDoUpdate({ target: categories.slug, set: v });
}

let order = 0;
for (const p of seedProducts) {
  order += 1;
  const v = {
    name: p.name,
    categorySlug: categoryOf[p.art],
    meta: p.meta,
    latin: p.latin ?? null,
    description: p.description,
    price: p.price,
    oldPrice: p.oldPrice ?? null,
    active: true,
    badge: badgeSlug(p.badge),
    images: p.image ? [p.image] : [],
    notes: p.notes,
    provenance: p.provenance,
    rating: p.rating,
    reviews: p.reviews,
    art: p.art,
    sortOrder: order,
  };
  // El stock solo se fija al crear; si ya existía se respeta el que tengas.
  await db.insert(products).values({ slug: p.slug, stock: 20, ...v }).onConflictDoUpdate({ target: products.slug, set: v });
}

const keepProducts = seedProducts.map((p) => p.slug);
const stale = (await db.select({ slug: products.slug }).from(products).where(notInArray(products.slug, keepProducts))).map((r) => r.slug);
if (stale.length) {
  await db.delete(favorites).where(inArray(favorites.slug, stale));
  await db.delete(products).where(inArray(products.slug, stale));
}
await db.delete(categories).where(notInArray(categories.slug, seedCategories.map((c) => c.slug)));
await db.update(products).set({ active: true }).where(eq(products.slug, "jabon-artesanal-de-avena"));

console.log(`Listo: ${seedCategories.length} categorías y ${seedProducts.length} productos. Eliminados: ${stale.length ? stale.join(", ") : "ninguno"}.`);
