import { eq } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { db, posts } from "@/server/db";
import { changes, fail, json, parseBody, sameOrigin } from "@/server/http";
import { postInput } from "@/server/product-input";
import type { RouteCtx } from "@/shims/route";

export async function PUT(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, postInput);
  if (!body.ok) return body.res;
  const d = body.data;
  const { slug } = await ctx.params;
  const r = await db.update(posts).set({ title: d.title, topic: d.topic, excerpt: d.excerpt, body: d.body, image: d.image ?? null, art: d.art, minutes: d.minutes, publishedAt: d.publishedAt, active: d.active }).where(eq(posts.slug, slug));
  if (changes(r) === 0) return fail("Artículo no encontrado.", 404);
  return json({ slug });
}

export async function DELETE(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { slug } = await ctx.params;
  const r = await db.delete(posts).where(eq(posts.slug, slug));
  if (changes(r) === 0) return fail("Artículo no encontrado.", 404);
  return json({ ok: true });
}
