import { requireAdmin } from "@/server/auth";
import { loadSettings, saveSettings } from "@/server/costing";
import { settingsInput } from "@/server/costing-input";
import { fail, json, parseBody, sameOrigin } from "@/server/http";

export async function GET() {
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  return json({ settings: await loadSettings() });
}

export async function PUT(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  const body = await parseBody(req, settingsInput);
  if (!body.ok) return body.res;
  await saveSettings(body.data);
  return json({ settings: body.data });
}
