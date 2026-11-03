import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { eq, lt } from "drizzle-orm";
import { cookies } from "@/shims/cookies";
import { db, sessions, users } from "./db";
import { json } from "./http";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const COOKIE = "alba_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createUser(name: string, email: string, password: string) {
  const id = randomUUID();
  await db.insert(users).values({ id, name, email, passwordHash: await hashPassword(password) });
  return id;
}

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  await db.delete(sessions).where(lt(sessions.expiresAt, Math.floor(Date.now() / 1000)));
  await db.insert(sessions).values({ id: sha(token), userId, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha(token)));
  jar.delete(COOKIE);
}

export type SessionUser = { id: string; name: string; email: string; role: "customer" | "admin" };

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, expiresAt: sessions.expiresAt, sid: sessions.id })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, sha(token)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt < Math.floor(Date.now() / 1000)) {
    await db.delete(sessions).where(eq(sessions.id, row.sid));
    return null;
  }
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

/** Devuelve el administrador de la sesión o una respuesta 401/403 lista para devolver. */
export async function requireAdmin(): Promise<{ user: SessionUser } | { res: Response }> {
  const user = await currentUser();
  if (!user) return { res: json({ error: "Ingresa para continuar." }, 401) };
  if (user.role !== "admin") return { res: json({ error: "No tienes permiso para esto." }, 403) };
  return { user };
}
