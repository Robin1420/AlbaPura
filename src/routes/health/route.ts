import { sql } from "drizzle-orm";
import { connection } from "@/shims/route";
import { db } from "@/server/db";

/** Responde 200 si el servidor y la base están vivos. Pensado para el monitoreo del hosting. */
export async function GET() {
  await connection(); // evita que se guarde la respuesta del momento de la compilación
  try {
    await db.run(sql`select 1`);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
