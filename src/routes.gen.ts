// Archivo generado por scripts/gen-routes.mjs. No se edita a mano.
import * as r0 from "./routes/admin/badges/[slug]/route";
import * as r1 from "./routes/admin/categories/[slug]/route";
import * as r2 from "./routes/admin/media/[name]/route";
import * as r3 from "./routes/admin/orders/[id]/route";
import * as r4 from "./routes/admin/products/[slug]/route";
import * as r5 from "./routes/media/[name]/route";
import * as r6 from "./routes/orders/[id]/route";
import * as r7 from "./routes/admin/badges/route";
import * as r8 from "./routes/admin/categories/route";
import * as r9 from "./routes/admin/media/route";
import * as r10 from "./routes/admin/messages/route";
import * as r11 from "./routes/admin/orders/route";
import * as r12 from "./routes/admin/products/route";
import * as r13 from "./routes/admin/subscribers/route";
import * as r14 from "./routes/admin/summary/route";
import * as r15 from "./routes/admin/upload/route";
import * as r16 from "./routes/auth/google/callback/route";
import * as r17 from "./routes/auth/google/start/route";
import * as r18 from "./routes/auth/logout/route";
import * as r19 from "./routes/catalog/route";
import * as r20 from "./routes/contact/route";
import * as r21 from "./routes/favorites/route";
import * as r22 from "./routes/health/route";
import * as r23 from "./routes/me/route";
import * as r24 from "./routes/me/profile/route";
import * as r25 from "./routes/newsletter/route";
import * as r26 from "./routes/orders/route";
import * as r27 from "./routes/payments/config/route";
import * as r28 from "./routes/payments/culqi/charge/route";
import * as r29 from "./routes/payments/culqi/sync/route";
import * as r30 from "./routes/payments/culqi/webhook/route";

export type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Response | Promise<Response>;
export const routes: { pattern: string; methods: Partial<Record<string, Handler>> }[] = [
  { pattern: "/api/admin/badges/[slug]", methods: r0 as never },
  { pattern: "/api/admin/categories/[slug]", methods: r1 as never },
  { pattern: "/api/admin/media/[name]", methods: r2 as never },
  { pattern: "/api/admin/orders/[id]", methods: r3 as never },
  { pattern: "/api/admin/products/[slug]", methods: r4 as never },
  { pattern: "/api/media/[name]", methods: r5 as never },
  { pattern: "/api/orders/[id]", methods: r6 as never },
  { pattern: "/api/admin/badges", methods: r7 as never },
  { pattern: "/api/admin/categories", methods: r8 as never },
  { pattern: "/api/admin/media", methods: r9 as never },
  { pattern: "/api/admin/messages", methods: r10 as never },
  { pattern: "/api/admin/orders", methods: r11 as never },
  { pattern: "/api/admin/products", methods: r12 as never },
  { pattern: "/api/admin/subscribers", methods: r13 as never },
  { pattern: "/api/admin/summary", methods: r14 as never },
  { pattern: "/api/admin/upload", methods: r15 as never },
  { pattern: "/api/auth/google/callback", methods: r16 as never },
  { pattern: "/api/auth/google/start", methods: r17 as never },
  { pattern: "/api/auth/logout", methods: r18 as never },
  { pattern: "/api/catalog", methods: r19 as never },
  { pattern: "/api/contact", methods: r20 as never },
  { pattern: "/api/favorites", methods: r21 as never },
  { pattern: "/api/health", methods: r22 as never },
  { pattern: "/api/me", methods: r23 as never },
  { pattern: "/api/me/profile", methods: r24 as never },
  { pattern: "/api/newsletter", methods: r25 as never },
  { pattern: "/api/orders", methods: r26 as never },
  { pattern: "/api/payments/config", methods: r27 as never },
  { pattern: "/api/payments/culqi/charge", methods: r28 as never },
  { pattern: "/api/payments/culqi/sync", methods: r29 as never },
  { pattern: "/api/payments/culqi/webhook", methods: r30 as never },
];
