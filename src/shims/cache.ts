/**
 * Antes invalidaba el caché del catálogo dentro de Next. Ahora la tienda (otro Worker) pide el
 * catálogo con una vida corta, así que los cambios del panel aparecen en pocos segundos.
 */
export function revalidateTag(_tag: string, _opts?: unknown) {}
