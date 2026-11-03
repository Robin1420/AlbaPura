import { desc, inArray, lte, sql } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { contactMessages, db, orders, products, subscribers } from "@/server/db";
import { json } from "@/server/http";
import { expireStaleOrders } from "@/server/orders";

export async function GET() {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;

  await expireStaleOrders();

  const byStatus = await db
    .select({ status: orders.status, n: sql<number>`count(*)`, total: sql<number>`coalesce(sum(${orders.total}),0)` })
    .from(orders)
    .groupBy(orders.status);
  const since = Math.floor(Date.now() / 1000) - 30 * 86400;
  const [month] = await db
    .select({ n: sql<number>`count(*)`, total: sql<number>`coalesce(sum(${orders.total}),0)` })
    .from(orders)
    .where(sql`${orders.createdAt} >= ${since} and ${orders.status} in ('paid','preparing','shipped','delivered')`);
  const since14 = Math.floor(Date.now() / 1000) - 14 * 86400;
  const daily = await db
    .select({ day: sql<string>`date(${orders.createdAt}, 'unixepoch')`, total: sql<number>`coalesce(sum(${orders.total}),0)`, n: sql<number>`count(*)` })
    .from(orders)
    .where(sql`${orders.createdAt} >= ${since14} and ${orders.status} in ('paid','preparing','shipped','delivered')`)
    .groupBy(sql`date(${orders.createdAt}, 'unixepoch')`);
  const lowStock = await db.select({ slug: products.slug, name: products.name, stock: products.stock }).from(products).where(lte(products.stock, 5));
  const [unread] = await db.select({ n: sql<number>`count(*)` }).from(contactMessages).where(sql`${contactMessages.readAt} is null`);
  const [subs] = await db.select({ n: sql<number>`count(*)` }).from(subscribers);
  const toAttend = await db
    .select({ id: orders.id, status: orders.status, total: orders.total, email: orders.email, createdAt: orders.createdAt })
    .from(orders)
    .where(inArray(orders.status, ["awaiting_transfer", "paid", "preparing"]))
    .orderBy(desc(orders.createdAt))
    .limit(8);

  return json({
    byStatus: Object.fromEntries(byStatus.map((r) => [r.status, { n: r.n, total: r.total }])),
    month: { orders: month.n, revenue: month.total },
    daily: Array.from({ length: 14 }, (_, i) => {
      const day = new Date(Date.now() - (13 - i) * 86400_000).toISOString().slice(0, 10);
      return { day, total: daily.find((d) => d.day === day)?.total ?? 0 };
    }),
    lowStock,
    unreadMessages: unread.n,
    subscribers: subs.n,
    toAttend: toAttend.map((o) => ({ ...o, createdAt: new Date(o.createdAt * 1000).toISOString() })),
  });
}
