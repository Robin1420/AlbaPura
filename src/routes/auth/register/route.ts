import { eq } from "drizzle-orm";
import { z } from "zod";
import { createUser, startSession } from "@/server/auth";
import { db, users } from "@/server/db";
import { clientIp, fail, json, parseBody, rateLimit, sameOrigin } from "@/server/http";

const schema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  email: z.string().trim().toLowerCase().email("Escribe un correo válido.").max(200),
  password: z.string().min(8, "Usa al menos 8 caracteres.").max(200),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  if (!rateLimit(`register:${clientIp(req)}`, 8, 15 * 60_000)) return fail("Demasiados intentos. Espera unos minutos.", 429);
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  const { name, email, password } = body.data;

  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (exists) return fail("Ya existe una cuenta con ese correo. Ingresa o usa otro correo.", 409, { email: "Ya existe una cuenta con ese correo." });

  const id = await createUser(name, email, password);
  await startSession(id);
  return json({ user: { name, email } }, 201);
}
