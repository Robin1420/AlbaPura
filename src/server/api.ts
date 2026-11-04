import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Llama a la API de Alba Pura (otro Worker). En Cloudflare usa el service binding `API`
 * (llamada interna, sin salir a internet); en desarrollo y durante el build usa API_URL (por defecto la API desplegada).
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  try {
    const { env } = getCloudflareContext();
    if (env.API) return env.API.fetch(new Request(`https://api.internal${path}`, init));
  } catch {
    // fuera de Cloudflare (next dev sin el contexto): se usa la URL
  }
  const res = await fetch(`${(process.env.API_URL ?? "https://alba-pura-api.robinzon-1420.workers.dev").replace(/\/$/, "")}${path}`, init);
  // Node ya descomprimió el cuerpo: si se reenvía content-encoding, el navegador intenta descomprimirlo otra vez y falla
  const headers = new Headers(res.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
