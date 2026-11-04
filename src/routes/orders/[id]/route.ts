import type { RouteCtx } from "@/shims/route";
import { timingSafeEqual } from "node:crypto";
import { currentUser } from "@/server/auth";
import { fail, json } from "@/server/http";
import { getOrder, serializeOrder } from "@/server/orders";

function sameToken(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Un pedido se puede ver con el token del enlace de confirmación o siendo su dueño. */
export async function GET(req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const token = new URL(req.url).searchParams.get("t") ?? "";
  const found = await getOrder(id);
  if (!found) return fail("Pedido no encontrado.", 404);
  const user = await currentUser();
  const allowed = (token && sameToken(token, found.o.publicToken)) || (user && found.o.userId === user.id);
  if (!allowed) return fail("Pedido no encontrado.", 404);
  return json({
    order: serializeOrder(found.o, found.items),
    bankInfo: null,
  });
}
