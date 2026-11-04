import { desc, eq, inArray } from "drizzle-orm";
import { currentUser } from "@/server/auth";
import { db, favorites, orderItems, orders } from "@/server/db";
import { json } from "@/server/http";
import { serializeOrder } from "@/server/orders";

export async function GET() {
  const user = await currentUser();
  if (!user) return json({ user: null, favorites: [], orders: [] });

  const favs = await db.select({ slug: favorites.slug }).from(favorites).where(eq(favorites.userId, user.id));
  const mine = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(50);
  const items = mine.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, mine.map((o) => o.id))) : [];
  const withItems = mine.map((o) => serializeOrder(o, items.filter((i) => i.orderId === o.id)));
  return json({ user: { name: user.name, email: user.email, role: user.role, picture: user.picture, phone: user.phone, addressLine: user.addressLine, district: user.district, region: user.region, profileComplete: user.profileComplete }, favorites: favs.map((f) => f.slug), orders: withItems });
}
