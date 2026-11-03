import { cacheLife, cacheTag } from "next/cache";
import type { Catalog } from "@/lib/products";
import { apiFetch } from "./api";

/**
 * Catálogo público completo, pedido a la API. Se guarda en caché unos segundos: los cambios
 * del panel aparecen en la tienda en menos de un minuto.
 */
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheTag("catalog");
  cacheLife({ stale: 30, revalidate: 30, expire: 300 });

  const res = await apiFetch("/api/catalog");
  if (!res.ok) throw new Error(`La API respondió ${res.status} al pedir el catálogo.`);
  return (await res.json()) as Catalog;
}
