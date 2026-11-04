import { eq } from "drizzle-orm";
import { z } from "zod";
import type { RouteCtx } from "@/shims/route";
import { requireAdmin } from "@/server/auth";
import { db, products } from "@/server/db";
import { changes, fail, json, parseBody, sameOrigin } from "@/server/http";

/** Aplica un precio de venta al producto (por ejemplo el sugerido por el costeo). */
export async function POST(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { slug } = await ctx.params;
  const body = await parseBody(req, z.object({ price: z.number().int("El precio debe ser un número entero de soles.").min(1).max(1_000_000) }));
  if (!body.ok) return body.res;
  const r = await db.update(products).set({ price: body.data.price }).where(eq(products.slug, slug));
  if (changes(r) === 0) return fail("Producto no encontrado.", 404);
  return json({ slug, price: body.data.price });
}
