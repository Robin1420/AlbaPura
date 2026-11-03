import { z } from "zod";
import { db, subscribers } from "@/server/db";
import { clientIp, fail, json, parseBody, rateLimit, sameOrigin } from "@/server/http";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Escribe un correo válido.").max(200) });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  if (!rateLimit(`news:${clientIp(req)}`, 10, 60 * 60_000)) return fail("Demasiados intentos. Inténtalo más tarde.", 429);
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  await db.insert(subscribers).values({ email: body.data.email }).onConflictDoNothing();
  return json({ ok: true }, 201);
}
