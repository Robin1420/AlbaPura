/** Contexto que reciben las rutas: los parámetros de la URL (/api/orders/[id] → { id }). */
export type RouteCtx = { params: Promise<Record<string, string>> };

/** En Next servía para no guardar en caché una respuesta; aquí no hace falta. */
export async function connection() {}
