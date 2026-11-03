import { desc } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { db, subscribers } from "@/server/db";
import { json } from "@/server/http";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const rows = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
  if (new URL(req.url).searchParams.get("format") === "csv") {
    const csv = "correo,fecha\n" + rows.map((r) => `${r.email},${new Date(r.createdAt * 1000).toISOString().slice(0, 10)}`).join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="suscriptores.csv"',
        "Cache-Control": "no-store",
      },
    });
  }
  return json({ subscribers: rows.map((r) => ({ email: r.email, createdAt: new Date(r.createdAt * 1000).toISOString() })) });
}
