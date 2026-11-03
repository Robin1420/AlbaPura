import { endSession } from "@/server/auth";
import { fail, json, sameOrigin } from "@/server/http";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  await endSession();
  return json({ ok: true });
}
