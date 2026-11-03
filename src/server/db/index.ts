import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { __albaDb?: ReturnType<typeof make> };

function make() {
  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:./data/alba.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });
  return drizzle(client, { schema });
}

/** Una sola conexión por proceso (también en desarrollo con recarga en caliente). */
export const db = globalForDb.__albaDb ?? make();
if (process.env.NODE_ENV !== "production") globalForDb.__albaDb = db;

export * from "./schema";
