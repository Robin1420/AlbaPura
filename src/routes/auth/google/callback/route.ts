import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { startSession } from "@/server/auth";
import { db, users } from "@/server/db";
import { exchangeCode, OAUTH_COOKIE, publicOrigin, redirectUri, safeNext } from "@/server/google";
import { cookies } from "@/shims/cookies";

/** Google vuelve aquí con ?code&state. Se crea o se encuentra a la persona y se abre su sesión. */
export async function GET(req: Request) {
  const origin = publicOrigin(req);
  const back = (path: string) => new Response(null, { status: 302, headers: { Location: origin + path, "Cache-Control": "no-store" } });
  const fail = (why: string) => back(`/cuenta/ingresar?error=${why}`);

  const q = new URL(req.url).searchParams;
  const jar = await cookies();
  const saved = jar.get(OAUTH_COOKIE)?.value;
  jar.delete(OAUTH_COOKIE);
  if (q.get("error")) return fail("cancelado");

  const [state, verifier, rawNext] = (saved ?? "").split(".");
  const code = q.get("code");
  if (!code || !state || !verifier || state !== q.get("state")) return fail("estado");

  let g;
  try {
    g = await exchangeCode(code, verifier, redirectUri(req));
  } catch (e) {
    console.error("Ingreso con Google falló", e);
    return fail("google");
  }

  const admins = (process.env.ADMIN_EMAILS ?? "").toLowerCase().split(",").map((s: string) => s.trim()).filter(Boolean);
  const isAdmin = admins.includes(g.email);

  let user: typeof users.$inferSelect | undefined = (await db.select().from(users).where(eq(users.googleSub, g.sub)))[0];
  user ??= (await db.select().from(users).where(eq(users.email, g.email)))[0]; // cuenta anterior con el mismo correo
  if (user) {
    await db.update(users).set({ googleSub: g.sub, picture: g.picture, ...(isAdmin ? { role: "admin" as const } : {}) }).where(eq(users.id, user.id));
  } else {
    const id = randomUUID();
    await db.insert(users).values({ id, email: g.email, name: g.name, googleSub: g.sub, picture: g.picture, role: isAdmin ? "admin" : "customer" });
    user = (await db.select().from(users).where(eq(users.id, id)))[0]!;
  }

  await startSession(user.id);
  const next = safeNext(rawNext ? decodeURIComponent(rawNext) : null);
  // Quien aún no completó sus datos pasa primero por el formulario de perfil
  return back(user.profileCompletedAt ? next : `/cuenta?completar=1&next=${encodeURIComponent(next)}`);
}
