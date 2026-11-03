import { desc } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { categories, db, media, products } from "@/server/db";
import { json } from "@/server/http";

/** Biblioteca de fotos subidas, con dónde se usa cada una. */
export async function GET() {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const rows = await db.select().from(media).orderBy(desc(media.createdAt));
  const prods = await db.select({ name: products.name, images: products.images }).from(products);
  const cats = await db.select({ name: categories.name, image: categories.image }).from(categories);

  const usage = new Map<string, string[]>();
  const use = (url: string | null | undefined, where: string) => {
    const n = url?.match(/^\/api\/media\/(.+)$/)?.[1];
    if (n) usage.set(n, [...(usage.get(n) ?? []), where]);
  };
  prods.forEach((p) => p.images.forEach((u) => use(u, `Producto: ${p.name}`)));
  cats.forEach((c) => use(c.image, `Categoría: ${c.name}`));

  return json({
    media: rows.map((m) => ({ ...m, url: `/api/media/${m.name}`, createdAt: new Date(m.createdAt * 1000).toISOString(), usedIn: usage.get(m.name) ?? [] })),
  });
}
