import { eq } from "drizzle-orm";
import { z } from "zod";
import { regions } from "@/checkout";
import { currentUser } from "@/server/auth";
import { db, users } from "@/server/db";
import { fail, json, parseBody, sameOrigin } from "@/server/http";

const schema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  phone: z.string().trim().max(25, "Teléfono demasiado largo.").refine((v) => v.replace(/\D/g, "").length >= 9, "Escribe un celular de 9 dígitos."),
  addressLine: z.string().trim().min(5, "Escribe la calle, el número y el departamento si corresponde.").max(200),
  district: z.string().trim().min(2, "Escribe tu distrito.").max(80),
  region: z.string().refine((v) => regions.includes(v), "Elige una zona."),
});

/** Guarda los datos del cliente. Es lo que se completa después de ingresar con Google. */
export async function PUT(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const user = await currentUser();
  if (!user) return fail("Ingresa para continuar.", 401);
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  await db.update(users).set({ ...body.data, profileCompletedAt: Math.floor(Date.now() / 1000) }).where(eq(users.id, user.id));
  return json({ ok: true });
}
