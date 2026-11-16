import { and, desc, eq, gte, inArray, lt, type SQL } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { db, saleItems, sales } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";
import { channels, createSale, SaleError, saleInput } from "@/server/sales";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const q = new URL(req.url).searchParams;
  const from = Number(q.get("from")) || 0;
  const to = Number(q.get("to")) || 0;
  const ch = q.get("channel");
  const conds: SQL[] = [];
  if (from) conds.push(gte(sales.soldAt, from));
  if (to) conds.push(lt(sales.soldAt, to));
  if (ch && (channels as readonly string[]).includes(ch)) conds.push(eq(sales.channel, ch as (typeof channels)[number]));
  const rows = await db.select().from(sales).where(conds.length ? and(...conds) : undefined).orderBy(desc(sales.soldAt), desc(sales.createdAt)).limit(300);
  const items = rows.length ? await db.select().from(saleItems).where(inArray(saleItems.saleId, rows.map((r) => r.id))) : [];
  return json({ sales: rows.map((s) => ({ ...s, items: items.filter((i) => i.saleId === s.id) })) });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, saleInput);
  if (!body.ok) return body.res;
  try {
    return json(await createSale(body.data, auth.user.email), 201);
  } catch (e) {
    if (e instanceof SaleError) return fail(e.message, e.status);
    throw e;
  }
}
