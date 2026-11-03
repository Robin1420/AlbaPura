import { eq } from "drizzle-orm";
import { z } from "zod";
import { startSession, verifyPassword } from "@/server/auth";
import { db, users } from "@/server/db";
import { clientIp, fail, json, parseBody, rateLimit, sameOrigin } from "@/server/http";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe tu contraseña.").max(200),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  const { email, password } = body.data;
  if (!rateLimit(`login-ip:${clientIp(req)}`, 40, 15 * 60_000)) return fail("Demasiados intentos. Espera unos minutos.", 429);
  if (!rateLimit(`login:${clientIp(req)}:${email}`, 8, 15 * 60_000)) return fail("Demasiados intentos. Espera unos minutos.", 429);

  const [user] = await db.select().from(users).where(eq(users.email, email));
  // Se verifica siempre una contraseña para que el tiempo de respuesta no delate si el correo existe
  const ok = await verifyPassword(password, user?.passwordHash ?? "00:00");
  if (!user || !ok) return fail("Correo o contraseña incorrectos.", 401);

  await startSession(user.id);
  return json({ user: { name: user.name, email: user.email } });
}
