import { readFile } from "node:fs/promises";
import path from "node:path";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Sirve las fotos subidas desde el panel. El nombre se valida para impedir rutas fuera de la carpeta. */
export async function GET(_req: Request, ctx: RouteContext<"/api/media/[name]">) {
  const { name } = await ctx.params;
  const m = /^[a-f0-9-]{36}\.(jpg|png|webp)$/.exec(name);
  if (!m) return new Response("No encontrado", { status: 404 });
  try {
    const file = await readFile(path.join(process.cwd(), "data", "uploads", name));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": TYPES[m[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
