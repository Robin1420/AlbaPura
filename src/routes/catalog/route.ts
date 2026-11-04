import { json } from "@/server/http";
import { getCatalog } from "@/server/catalog";

/** Catálogo público para el carrito, el menú y otras partes del cliente. */
export async function GET() {
  const res = json(await getCatalog());
  res.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
  return res;
}
