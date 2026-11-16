import { and, desc, eq, like, or, type SQL } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { db, orders } from "@/server/db";
import { json } from "@/server/http";
import { adminLabel, statusLabel } from "@/server/orders";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status");
  const q = (sp.get("q") ?? "").trim().slice(0, 80);

  const where: SQL[] = [];
  if (status && status in statusLabel) where.push(eq(orders.status, status as keyof typeof statusLabel));
  if (q) where.push(or(like(orders.id, `%${q}%`), like(orders.email, `%${q.toLowerCase()}%`))!);

  const rows = await db
    .select({
      id: orders.id,
      email: orders.email,
      status: orders.status,
      total: orders.total,
      payment: orders.payment,
      shippingMethod: orders.shippingMethod,
      createdAt: orders.createdAt,
      address: orders.address,
    })
    .from(orders)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(200);

  return json({
    orders: rows.map((r) => ({
      id: r.id,
      email: r.email,
      status: r.status,
      statusLabel: adminLabel[r.status],
      total: r.total,
      payment: r.payment,
      shippingMethod: r.shippingMethod,
      createdAt: new Date(r.createdAt * 1000).toISOString(),
      customer: `${r.address.name} ${r.address.lastName}`.trim(),
    })),
  });
}
