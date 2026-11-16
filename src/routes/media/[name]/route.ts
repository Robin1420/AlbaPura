import type { RouteCtx } from "@/shims/route";
import { store } from "@/shims/context";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf" };

/** Sirve las fotos y los PDF subidos desde el panel (guardados en R2). El nombre se valida antes de buscarlo. */
export async function GET(_req: Request, ctx: RouteCtx) {
  const { name } = await ctx.params;
  const m = /^[a-f0-9-]{36}\.(jpg|png|webp|pdf)$/.exec(name);
  if (!m) return new Response("No encontrado", { status: 404 });
  const obj = await store().env.MEDIA?.get(name);
  if (!obj) return new Response("No encontrado", { status: 404 });
  return new Response(obj.body, {
    headers: {
      ...(m[1] === "pdf" ? { "Content-Disposition": "inline" } : {}),
      "Content-Type": TYPES[m[1]],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
