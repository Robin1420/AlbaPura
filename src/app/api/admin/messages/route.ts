import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { contactMessages, db } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";

export async function GET() {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(200);
  return json({ messages: rows.map((m) => ({ id: m.id, name: m.name, email: m.email, subject: m.subject, message: m.message, createdAt: new Date(m.createdAt * 1000).toISOString(), read: m.readAt !== null })) });
}

const patch = z.object({ id: z.number().int(), read: z.boolean() });

export async function PATCH(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, patch);
  if (!body.ok) return body.res;
  await db.update(contactMessages).set({ readAt: body.data.read ? Math.floor(Date.now() / 1000) : null }).where(eq(contactMessages.id, body.data.id));
  return json({ ok: true });
}
