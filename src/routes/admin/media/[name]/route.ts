import { changes } from "@/server/http";
import type { RouteCtx } from "@/shims/route";
import { store } from "@/shims/context";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { categories, db, media, products } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";

const NAME = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;

export async function PATCH(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { name } = await ctx.params;
  if (!NAME.test(name)) return fail("Imagen no encontrada.", 404);
  const body = await parseBody(req, z.object({ alt: z.string().trim().max(160) }));
  if (!body.ok) return body.res;
  const r = await db.update(media).set({ alt: body.data.alt }).where(eq(media.name, name));
  if (changes(r) === 0) return fail("Imagen no encontrada.", 404);
  return json({ name });
}

/** Solo se puede borrar una foto que ningún producto ni categoría use. */
export async function DELETE(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { name } = await ctx.params;
  if (!NAME.test(name)) return fail("Imagen no encontrada.", 404);

  const url = `/api/media/${name}`;
  const prods = await db.select({ name: products.name, images: products.images }).from(products);
  const cats = await db.select({ name: categories.name, image: categories.image }).from(categories);
  const user = prods.find((p) => p.images.includes(url))?.name ?? cats.find((c) => c.image === url)?.name;
  if (user) return fail(`Esta foto se usa en “${user}”. Quítala de ahí antes de borrarla.`, 409);

  const r = await db.delete(media).where(eq(media.name, name));
  if (changes(r) === 0) return fail("Imagen no encontrada.", 404);
  await store().env.MEDIA?.delete(name).catch(() => {});
  return json({ ok: true });
}
