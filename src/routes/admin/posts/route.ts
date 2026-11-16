import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { db, posts } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { postInput } from "@/server/product-input";
import { uniqueSlug } from "@/server/slug";

export async function GET() {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const rows = await db.select().from(posts).orderBy(desc(posts.publishedAt));
  return json({ posts: rows });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, postInput);
  if (!body.ok) return body.res;
  const d = body.data;
  const slug = await uniqueSlug(d.title, async (s) => (await db.select({ s: posts.slug }).from(posts).where(eq(posts.slug, s))).length > 0);
  await db.insert(posts).values({ slug, title: d.title, topic: d.topic, excerpt: d.excerpt, body: d.body, image: d.image ?? null, art: d.art, minutes: d.minutes, publishedAt: d.publishedAt, active: d.active });
  return json({ slug }, 201);
}
