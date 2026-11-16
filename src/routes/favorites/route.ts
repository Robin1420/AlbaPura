import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { currentUser } from "@/server/auth";
import { db, favorites, products } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";

const toggle = z.object({ slug: z.string().min(1).max(120) });
const merge = z.object({ slugs: z.array(z.string().min(1).max(120)).max(100) });

/** Alterna un favorito. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const user = await currentUser();
  if (!user) return fail("Ingresa para guardar favoritos.", 401);
  const body = await parseBody(req, toggle);
  if (!body.ok) return body.res;
  const { slug } = body.data;

  const [p] = await db.select({ slug: products.slug }).from(products).where(eq(products.slug, slug));
  if (!p) return fail("Producto no encontrado.", 404);

  const where = and(eq(favorites.userId, user.id), eq(favorites.slug, slug));
  const [have] = await db.select().from(favorites).where(where);
  if (have) await db.delete(favorites).where(where);
  else await db.insert(favorites).values({ userId: user.id, slug });
  return json({ slug, favorite: !have });
}

/** Une los favoritos guardados como invitado con los de la cuenta. */
export async function PUT(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const user = await currentUser();
  if (!user) return fail("Ingresa para guardar favoritos.", 401);
  const body = await parseBody(req, merge);
  if (!body.ok) return body.res;
  const valid = await db.select({ slug: products.slug }).from(products).where(inArray(products.slug, body.data.slugs));
  for (const v of valid) await db.insert(favorites).values({ userId: user.id, slug: v.slug }).onConflictDoNothing();
  const all = await db.select({ slug: favorites.slug }).from(favorites).where(eq(favorites.userId, user.id));
  return json({ favorites: all.map((f) => f.slug) });
}
