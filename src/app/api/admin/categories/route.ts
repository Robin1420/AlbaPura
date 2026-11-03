import { asc, eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { categories, db, products } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { categoryInput } from "@/server/product-input";
import { uniqueSlug } from "@/server/slug";

export async function GET() {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  const counts = await db.select({ slug: products.categorySlug, n: sql<number>`count(*)` }).from(products).groupBy(products.categorySlug);
  const n = new Map(counts.map((c) => [c.slug, c.n]));
  return json({ categories: cats.map((c) => ({ ...c, products: n.get(c.slug) ?? 0 })) });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, categoryInput);
  if (!body.ok) return body.res;
  const d = body.data;
  const slug = await uniqueSlug(d.name, async (s) => (await db.select({ s: categories.slug }).from(categories).where(eq(categories.slug, s))).length > 0);
  await db.insert(categories).values({ slug, name: d.name, description: d.description, image: d.image ?? null, sortOrder: d.sortOrder, active: d.active });
  revalidateTag("catalog", { expire: 0 });
  return json({ slug }, 201);
}
