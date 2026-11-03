import type { Catalog } from "@/lib/products";
import { apiFetch } from "./api";

/**
 * Catálogo público completo, pedido a la API. Las páginas que lo usan se regeneran cada minuto
 * (`revalidate` en el layout de la tienda), así los cambios del panel aparecen enseguida.
 */
export async function getCatalog(): Promise<Catalog> {
  const res = await apiFetch("/api/catalog");
  if (!res.ok) throw new Error(`La API respondió ${res.status} al pedir el catálogo.`);
  return (await res.json()) as Catalog;
}
