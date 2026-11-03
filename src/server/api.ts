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
  return fetch(`${(process.env.API_URL ?? "https://alba-pura-api.robinzon-1420.workers.dev").replace(/\/$/, "")}${path}`, init);
}
