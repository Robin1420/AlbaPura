import type { RouteCtx } from "@/shims/route";
import { store } from "@/shims/context";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Sirve las fotos subidas desde el panel (guardadas en R2). El nombre se valida antes de buscarlo. */
export async function GET(_req: Request, ctx: RouteCtx) {
  const { name } = await ctx.params;
  const m = /^[a-f0-9-]{36}\.(jpg|png|webp)$/.exec(name);
  if (!m) return new Response("No encontrado", { status: 404 });
  const obj = await store().env.MEDIA?.get(name);
  if (!obj) return new Response("No encontrado", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "Content-Type": TYPES[m[1]],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
