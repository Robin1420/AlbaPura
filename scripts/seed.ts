/**
 * Carga las categorías y los productos iniciales. Uso: npm run db:seed
 * Es seguro repetirlo: solo crea lo que no existe y NO pisa lo que ya editaste en el panel.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { badges, categories, products } from "../src/server/db/schema";
import { categoryOf, seedCategories, seedProducts } from "./seed-data";

const client = createClient({ url: process.env.DATABASE_URL ?? "file:./data/alba.db", authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
const db = drizzle(client);

const seedBadges = [
  { slug: "mas-vendido", name: "Más vendido", tone: "ink" },
  { slug: "nuevo", name: "Nuevo", tone: "leaf" },
  { slug: "organico", name: "Orgánico", tone: "sky" },
  { slug: "vegano", name: "Vegano", tone: "peach" },
  { slug: "edicion-limitada", name: "Edición limitada", tone: "ink" },
  { slug: "oferta", name: "Oferta", tone: "leaf" },
];
const badgeSlug = (name?: string) => seedBadges.find((b) => b.name === name)?.slug ?? null;

async function main() {
  let b = 0;
  for (const x of seedBadges) await db.insert(badges).values({ ...x, sortOrder: b++, active: true }).onConflictDoNothing();
  for (const c of seedCategories) {
    await db.insert(categories).values({ slug: c.slug, name: c.name, description: c.description, image: c.image, sortOrder: c.sortOrder, active: true }).onConflictDoNothing();
  }
  let order = 0;
  for (const p of seedProducts) {
    order += 1;
    await db
      .insert(products)
      .values({
        slug: p.slug,
        name: p.name,
        categorySlug: categoryOf[p.art],
        meta: p.meta,
        latin: p.latin ?? null,
        description: p.description,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        stock: 40,
        active: true,
        badge: badgeSlug(p.badge),
        images: p.image ? [p.image] : [],
        notes: p.notes,
        provenance: p.provenance,
        rating: p.rating,
        reviews: p.reviews,
        art: p.art,
        sortOrder: order,
      })
      .onConflictDoNothing();
  }
  console.log(`Listo: ${seedCategories.length} categorías y ${seedProducts.length} productos (lo existente no se modifica).`);
}

main().then(() => client.close());
