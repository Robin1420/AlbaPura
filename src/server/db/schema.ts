import { sql } from "drizzle-orm";
import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const now = () => Math.floor(Date.now() / 1000);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<"customer" | "admin">().notNull().default("customer"),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

/** El id es el SHA-256 del token que viaja en la cookie; el token nunca se guarda. */
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
});

export const categories = sqliteTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  image: text("image"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const products = sqliteTable("products", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  categorySlug: text("category_slug").notNull().default("infusiones"),
  meta: text("meta").notNull(),
  latin: text("latin"),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  oldPrice: integer("old_price"),
  stock: integer("stock").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  /** Producto anunciado pero todavía no a la venta: se muestra sin precio y no se puede comprar. */
  comingSoon: integer("coming_soon", { mode: "boolean" }).notNull().default(false),
  badge: text("badge"),
  images: text("images", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  notes: text("notes", { mode: "json" }).$type<{ title: string; text: string }[]>().notNull().default(sql`'[]'`),
  provenance: text("provenance", { mode: "json" }).$type<{ label: string; value: string }[]>().notNull().default(sql`'[]'`),
  rating: real("rating").notNull().default(0),
  reviews: integer("reviews").notNull().default(0),
  art: text("art").$type<"oil" | "honey" | "soap" | "tea">(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type OrderStatus = "pending_payment" | "awaiting_transfer" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled" | "failed";

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  /** Permite ver el pedido sin cuenta (viaja en el enlace de confirmación). */
  publicToken: text("public_token").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  status: text("status").$type<OrderStatus>().notNull(),
  shippingMethod: text("shipping_method").$type<"standard" | "express" | "pickup">().notNull(),
  payment: text("payment").$type<"webpay" | "transfer">().notNull(),
  subtotal: integer("subtotal").notNull(),
  shipping: integer("shipping").notNull(),
  gift: integer("gift").notNull().default(0),
  total: integer("total").notNull(),
  address: text("address", { mode: "json" }).$type<Address>().notNull(),
  webpayToken: text("webpay_token"),
  webpayAuthCode: text("webpay_auth_code"),
  createdAt: integer("created_at").notNull().$defaultFn(now),
  paidAt: integer("paid_at"),
  trackingCode: text("tracking_code"),
  shippedAt: integer("shipped_at"),
});

export type Address = { name: string; lastName: string; line: string; region: string; comuna: string; phone: string };

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  meta: text("meta").notNull(),
  qty: integer("qty").notNull(),
  price: integer("price").notNull(),
});

export const favorites = sqliteTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.slug] })],
);

export const contactMessages = sqliteTable("contact_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  readAt: integer("read_at"),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

export const subscribers = sqliteTable("subscribers", {
  email: text("email").primaryKey(),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

/** Historial de cada pedido: quién cambió qué y cuándo. */
export const orderEvents = sqliteTable("order_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

/** Fotos subidas desde el panel: el archivo vive en data/uploads y aquí queda su ficha. */
export const media = sqliteTable("media", {
  /** Nombre del archivo en disco (uuid + extensión); también es la última parte de la URL /api/media/… */
  name: text("name").primaryKey(),
  originalName: text("original_name").notNull(),
  mime: text("mime").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  bytes: integer("bytes").notNull(),
  /** Texto alternativo: lo leen los lectores de pantalla y buscadores. */
  alt: text("alt").notNull().default(""),
  uploadedBy: text("uploaded_by"),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

/** Etiquetas que se pegan a un producto ("Más vendido", "Nuevo"…). El producto guarda el slug en products.badge. */
export const badges = sqliteTable("badges", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  /** Color de la etiqueta: ink, leaf, peach o sky. */
  tone: text("tone").notNull().default("ink"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});
