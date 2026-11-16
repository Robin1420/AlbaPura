import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { db, saleItems, sales } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { cancelSale, markSalePaid, SaleError } from "@/server/sales";
import type { RouteCtx } from "@/shims/route";

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const { id } = await ctx.params;
  const [s] = await db.select().from(sales).where(eq(sales.id, id));
  if (!s) return fail("Venta no encontrada.", 404);
  return json({ sale: s, items: await db.select().from(saleItems).where(eq(saleItems.saleId, id)) });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, z.object({ action: z.enum(["pay", "cancel"]) }));
  if (!body.ok) return body.res;
  const { id } = await ctx.params;
  try {
    if (body.data.action === "pay") await markSalePaid(id);
    else await cancelSale(id, auth.user.email);
    return json({ ok: true });
  } catch (e) {
    if (e instanceof SaleError) return fail(e.message, e.status);
    throw e;
  }
}
