import { asc, eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { badges, db, products } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { badgeInput } from "@/server/product-input";
import { uniqueSlug } from "@/server/slug";

export async function GET() {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const rows = await db.select().from(badges).orderBy(asc(badges.sortOrder), asc(badges.name));
  const counts = await db.select({ slug: products.badge, n: sql<number>`count(*)` }).from(products).groupBy(products.badge);
  const n = new Map(counts.map((c) => [c.slug, c.n]));
  return json({ badges: rows.map((b) => ({ ...b, products: n.get(b.slug) ?? 0 })) });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, badgeInput);
  if (!body.ok) return body.res;
  const d = body.data;
  const slug = await uniqueSlug(d.name, async (s) => (await db.select({ s: badges.slug }).from(badges).where(eq(badges.slug, s))).length > 0);
  await db.insert(badges).values({ slug, name: d.name, tone: d.tone, sortOrder: d.sortOrder, active: d.active });
  revalidateTag("catalog", { expire: 0 });
  return json({ slug }, 201);
}
