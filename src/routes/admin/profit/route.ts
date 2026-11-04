import { and, gte, inArray, lt, sql, type SQL } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { loadSettings } from "@/server/costing";
import { db, orderItems, orders, saleItems, sales } from "@/server/db";
import { json } from "@/server/http";

type Acc = { key: string; sales: number; units: number; revenue: number; cost: number; fee: number; profit: number; incomplete: number };
const r2 = (n: number) => Math.round(n * 100) / 100;
const blank = (key: string): Acc => ({ key, sales: 0, units: 0, revenue: 0, cost: 0, fee: 0, profit: 0, incomplete: 0 });

/**
 * Utilidad real del periodo: ventas web (desde que se pagan) + ventas manuales cobradas.
 * El envío no cuenta como ingreso ni como costo. Un producto sin receta deja la utilidad marcada como incompleta.
 */
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const q = new URL(req.url).searchParams;
  const from = Number(q.get("from")) || 0;
  const to = Number(q.get("to")) || 0;
  const settings = await loadSettings();

  const oc: SQL[] = [inArray(orders.status, ["paid", "preparing", "shipped", "delivered"])];
  const paidAt = sql`coalesce(${orders.paidAt}, ${orders.createdAt})`;
  if (from) oc.push(gte(paidAt, from));
  if (to) oc.push(lt(paidAt, to));
  const webOrders = await db.select().from(orders).where(and(...oc));
  const webItems = webOrders.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, webOrders.map((o) => o.id))) : [];

  const sc: SQL[] = [sql`${sales.status} = 'completed'`, sql`${sales.paid} = 1`];
  if (from) sc.push(gte(sales.soldAt, from));
  if (to) sc.push(lt(sales.soldAt, to));
  const manual = await db.select().from(sales).where(and(...sc));
  const manualItems = manual.length ? await db.select().from(saleItems).where(inArray(saleItems.saleId, manual.map((s) => s.id))) : [];

  const total = blank("total");
  const channels = new Map<string, Acc>();
  const products = new Map<string, Acc & { name: string }>();
  const add = (acc: Acc, units: number, revenue: number, cost: number, fee: number, incomplete: boolean) => {
    acc.sales += 1;
    acc.units += units;
    acc.revenue += revenue;
    acc.cost += cost;
    acc.fee += fee;
    acc.profit += revenue - cost - fee;
    if (incomplete) acc.incomplete += 1;
  };
  const line = (slug: string, name: string, qty: number, revenue: number, cost: number) => {
    const p = products.get(slug) ?? { ...blank(slug), name };
    p.units += qty;
    p.revenue += revenue;
    p.cost += cost;
    p.profit += revenue - cost;
    products.set(slug, p);
  };
  const ch = (k: string) => channels.get(k) ?? channels.set(k, blank(k)).get(k)!;

  for (const o of webOrders) {
    const its = webItems.filter((i) => i.orderId === o.id);
    const revenue = o.subtotal + o.gift;
    const cost = its.reduce((t, i) => t + (i.unitCost ?? 0) * i.qty, 0);
    const fee = o.payment === "culqi" ? o.total * (settings.gatewayPct / 100) + settings.gatewayFixed : 0;
    const incomplete = its.some((i) => i.unitCost == null);
    const units = its.reduce((t, i) => t + i.qty, 0);
    add(total, units, revenue, cost, fee, incomplete);
    add(ch("web"), units, revenue, cost, fee, incomplete);
    for (const i of its) line(i.slug, i.name, i.qty, i.price * i.qty, (i.unitCost ?? 0) * i.qty);
  }
  for (const s of manual) {
    const its = manualItems.filter((i) => i.saleId === s.id);
    const revenue = s.subtotal - s.discount;
    const units = its.reduce((t, i) => t + i.qty, 0);
    add(total, units, revenue, s.costTotal, s.fee, !s.costComplete);
    add(ch(s.channel), units, revenue, s.costTotal, s.fee, !s.costComplete);
    const factor = s.subtotal > 0 ? revenue / s.subtotal : 1;
    for (const i of its) line(i.productSlug, i.name, i.qty, i.price * i.qty * factor, (i.unitCost ?? 0) * i.qty);
  }

  const fin = <T extends Acc>(a: T): T => ({ ...a, revenue: r2(a.revenue), cost: r2(a.cost), fee: r2(a.fee), profit: r2(a.profit) });
  return json({
    total: { ...fin(total), margin: total.revenue > 0 ? r2((total.profit / total.revenue) * 100) : 0 },
    channels: [...channels.values()].map(fin).sort((a, b) => b.profit - a.profit),
    products: [...products.values()].map(fin).sort((a, b) => b.profit - a.profit),
  });
}
