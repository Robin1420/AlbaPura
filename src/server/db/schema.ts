import { sql } from "drizzle-orm";
import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const now = () => Math.floor(Date.now() / 1000);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  /** Identificador estable de la cuenta de Google ("sub"): el inicio de sesión es solo con Google. */
  googleSub: text("google_sub").unique(),
  picture: text("picture"),
  role: text("role").$type<"customer" | "admin">().notNull().default("customer"),
  /** Datos del cliente: se completan después del primer ingreso con Google. */
  phone: text("phone"),
  addressLine: text("address_line"),
  district: text("district"),
  region: text("region"),
  profileCompletedAt: integer("profile_completed_at"),
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
  payment: text("payment").$type<"culqi" | "transfer">().notNull(),
  subtotal: integer("subtotal").notNull(),
  shipping: integer("shipping").notNull(),
  gift: integer("gift").notNull().default(0),
  total: integer("total").notNull(),
  address: text("address", { mode: "json" }).$type<Address>().notNull(),
  /** Id del cargo en Culqi (chr_…). */
  paymentRef: text("payment_ref"),
  /** Código de referencia/autorización del cargo. */
  paymentAuth: text("payment_auth"),
  /** Id de la orden en Culqi (ord_…): permite pagar con el QR de Yape, Plin y otras billeteras. */
  culqiOrder: text("culqi_order"),
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

/** Insumos: materias primas y empaques. El stock y el costo se guardan en la unidad base (g, ml o un). */
export const supplies = sqliteTable("supplies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").$type<"materia" | "empaque" | "otro">().notNull().default("materia"),
  unit: text("unit").$type<"g" | "ml" | "un">().notNull(),
  stock: real("stock").notNull().default(0),
  minStock: real("min_stock").notNull().default(0),
  /** Costo por unidad base: promedio ponderado de las compras. */
  unitCost: real("unit_cost").notNull().default(0),
  supplier: text("supplier"),
  notes: text("notes"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

/** Historial del stock de un insumo: compras, consumo en producción y ajustes. qty es el cambio (+/-). */
export const supplyMovements = sqliteTable("supply_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplyId: text("supply_id").notNull().references(() => supplies.id, { onDelete: "cascade" }),
  type: text("type").$type<"purchase" | "production" | "adjustment" | "initial">().notNull(),
  qty: real("qty").notNull(),
  unitCost: real("unit_cost").notNull().default(0),
  totalCost: real("total_cost").notNull().default(0),
  ref: text("ref"),
  note: text("note"),
  createdBy: text("created_by"),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

/** Receta y datos de costeo de un producto: lo que lleva un lote y cuántas unidades salen. */
export const recipes = sqliteTable("recipes", {
  productSlug: text("product_slug").primaryKey().references(() => products.slug, { onDelete: "cascade" }),
  yieldUnits: integer("yield_units").notNull().default(1),
  laborHours: real("labor_hours").notNull().default(0),
  /** S/ por hora. Vacío = usa el valor de Ajustes. */
  laborRate: real("labor_rate"),
  /** % de gastos indirectos sobre materiales + mano de obra. Vacío = usa Ajustes. */
  overheadPct: real("overhead_pct"),
  wastePct: real("waste_pct").notNull().default(0),
  targetMargin: real("target_margin").notNull().default(50),
  notes: text("notes"),
  updatedAt: integer("updated_at").notNull().$defaultFn(now),
});

export const recipeItems = sqliteTable("recipe_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productSlug: text("product_slug").notNull().references(() => recipes.productSlug, { onDelete: "cascade" }),
  supplyId: text("supply_id").notNull().references(() => supplies.id),
  /** Cantidad por lote, en la unidad base del insumo. */
  qty: real("qty").notNull(),
});

export type BatchStatus = "planned" | "done" | "cancelled";

export const productionBatches = sqliteTable("production_batches", {
  id: text("id").primaryKey(),
  productSlug: text("product_slug").notNull().references(() => products.slug),
  /** Unidades terminadas que se producen. */
  qty: integer("qty").notNull(),
  status: text("status").$type<BatchStatus>().notNull().default("planned"),
  notes: text("notes"),
  expiresAt: integer("expires_at"),
  costTotal: real("cost_total"),
  costUnit: real("cost_unit"),
  createdBy: text("created_by"),
  createdAt: integer("created_at").notNull().$defaultFn(now),
  finishedAt: integer("finished_at"),
});

export const productionBatchItems = sqliteTable("production_batch_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  batchId: text("batch_id").notNull().references(() => productionBatches.id, { onDelete: "cascade" }),
  supplyId: text("supply_id").notNull().references(() => supplies.id),
  qty: real("qty").notNull(),
  unitCost: real("unit_cost").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
