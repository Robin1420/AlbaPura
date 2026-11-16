// Archivo generado por scripts/gen-routes.mjs. No se edita a mano.
import * as r0 from "./routes/admin/badges/route";
import * as r1 from "./routes/admin/categories/route";
import * as r2 from "./routes/admin/cost-settings/route";
import * as r3 from "./routes/admin/costs/route";
import * as r4 from "./routes/admin/media/route";
import * as r5 from "./routes/admin/messages/route";
import * as r6 from "./routes/admin/orders/route";
import * as r7 from "./routes/admin/posts/route";
import * as r8 from "./routes/admin/production/route";
import * as r9 from "./routes/admin/production/quote/route";
import * as r10 from "./routes/admin/products/route";
import * as r11 from "./routes/admin/profit/route";
import * as r12 from "./routes/admin/sales/route";
import * as r13 from "./routes/admin/stock/route";
import * as r14 from "./routes/admin/subscribers/route";
import * as r15 from "./routes/admin/summary/route";
import * as r16 from "./routes/admin/supplies/route";
import * as r17 from "./routes/admin/upload/route";
import * as r18 from "./routes/admin/upload-doc/route";
import * as r19 from "./routes/auth/google/callback/route";
import * as r20 from "./routes/auth/google/start/route";
import * as r21 from "./routes/auth/logout/route";
import * as r22 from "./routes/catalog/route";
import * as r23 from "./routes/contact/route";
import * as r24 from "./routes/favorites/route";
import * as r25 from "./routes/health/route";
import * as r26 from "./routes/me/route";
import * as r27 from "./routes/me/profile/route";
import * as r28 from "./routes/newsletter/route";
import * as r29 from "./routes/orders/route";
import * as r30 from "./routes/payments/config/route";
import * as r31 from "./routes/payments/culqi/charge/route";
import * as r32 from "./routes/payments/culqi/qr/route";
import * as r33 from "./routes/payments/culqi/sync/route";
import * as r34 from "./routes/payments/culqi/webhook/route";
import * as r35 from "./routes/posts/route";
import * as r36 from "./routes/admin/badges/[slug]/route";
import * as r37 from "./routes/admin/categories/[slug]/route";
import * as r38 from "./routes/admin/costs/[slug]/route";
import * as r39 from "./routes/admin/costs/[slug]/price/route";
import * as r40 from "./routes/admin/media/[name]/route";
import * as r41 from "./routes/admin/orders/[id]/route";
import * as r42 from "./routes/admin/posts/[slug]/route";
import * as r43 from "./routes/admin/production/[id]/route";
import * as r44 from "./routes/admin/products/[slug]/route";
import * as r45 from "./routes/admin/sales/[id]/route";
import * as r46 from "./routes/admin/supplies/[id]/route";
import * as r47 from "./routes/admin/supplies/[id]/adjust/route";
import * as r48 from "./routes/admin/supplies/[id]/purchase/route";
import * as r49 from "./routes/media/[name]/route";
import * as r50 from "./routes/orders/[id]/route";

export type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Response | Promise<Response>;
export const routes: { pattern: string; methods: Partial<Record<string, Handler>> }[] = [
  { pattern: "/api/admin/badges", methods: r0 as never },
  { pattern: "/api/admin/categories", methods: r1 as never },
  { pattern: "/api/admin/cost-settings", methods: r2 as never },
  { pattern: "/api/admin/costs", methods: r3 as never },
  { pattern: "/api/admin/media", methods: r4 as never },
  { pattern: "/api/admin/messages", methods: r5 as never },
  { pattern: "/api/admin/orders", methods: r6 as never },
  { pattern: "/api/admin/posts", methods: r7 as never },
  { pattern: "/api/admin/production", methods: r8 as never },
  { pattern: "/api/admin/production/quote", methods: r9 as never },
  { pattern: "/api/admin/products", methods: r10 as never },
  { pattern: "/api/admin/profit", methods: r11 as never },
  { pattern: "/api/admin/sales", methods: r12 as never },
  { pattern: "/api/admin/stock", methods: r13 as never },
  { pattern: "/api/admin/subscribers", methods: r14 as never },
  { pattern: "/api/admin/summary", methods: r15 as never },
  { pattern: "/api/admin/supplies", methods: r16 as never },
  { pattern: "/api/admin/upload", methods: r17 as never },
  { pattern: "/api/admin/upload-doc", methods: r18 as never },
  { pattern: "/api/auth/google/callback", methods: r19 as never },
  { pattern: "/api/auth/google/start", methods: r20 as never },
  { pattern: "/api/auth/logout", methods: r21 as never },
  { pattern: "/api/catalog", methods: r22 as never },
  { pattern: "/api/contact", methods: r23 as never },
  { pattern: "/api/favorites", methods: r24 as never },
  { pattern: "/api/health", methods: r25 as never },
  { pattern: "/api/me", methods: r26 as never },
  { pattern: "/api/me/profile", methods: r27 as never },
  { pattern: "/api/newsletter", methods: r28 as never },
  { pattern: "/api/orders", methods: r29 as never },
  { pattern: "/api/payments/config", methods: r30 as never },
  { pattern: "/api/payments/culqi/charge", methods: r31 as never },
  { pattern: "/api/payments/culqi/qr", methods: r32 as never },
  { pattern: "/api/payments/culqi/sync", methods: r33 as never },
  { pattern: "/api/payments/culqi/webhook", methods: r34 as never },
  { pattern: "/api/posts", methods: r35 as never },
  { pattern: "/api/admin/badges/[slug]", methods: r36 as never },
  { pattern: "/api/admin/categories/[slug]", methods: r37 as never },
  { pattern: "/api/admin/costs/[slug]", methods: r38 as never },
  { pattern: "/api/admin/costs/[slug]/price", methods: r39 as never },
  { pattern: "/api/admin/media/[name]", methods: r40 as never },
  { pattern: "/api/admin/orders/[id]", methods: r41 as never },
  { pattern: "/api/admin/posts/[slug]", methods: r42 as never },
  { pattern: "/api/admin/production/[id]", methods: r43 as never },
  { pattern: "/api/admin/products/[slug]", methods: r44 as never },
  { pattern: "/api/admin/sales/[id]", methods: r45 as never },
  { pattern: "/api/admin/supplies/[id]", methods: r46 as never },
  { pattern: "/api/admin/supplies/[id]/adjust", methods: r47 as never },
  { pattern: "/api/admin/supplies/[id]/purchase", methods: r48 as never },
  { pattern: "/api/media/[name]", methods: r49 as never },
  { pattern: "/api/orders/[id]", methods: r50 as never },
];
