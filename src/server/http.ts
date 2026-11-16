import type { z } from "zod";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(message: string, status = 400, fields?: Record<string, string>) {
  return json({ error: message, fields }, status);
}

/** Rechaza peticiones que cambian datos y vienen de otro origen (defensa CSRF junto con SameSite=Lax). */
export function sameOrigin(req: Request) {
  // Los navegadores modernos declaran de dónde viene la petición; "cross-site" nunca es legítimo aquí.
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true; // mismo origen sin cabecera Origin (p. ej. herramientas de servidor)
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Filas cambiadas por una escritura en D1. */
export const changes = (r: unknown) => (r as { meta?: { changes?: number } })?.meta?.changes ?? 0;

export function clientIp(req: Request) {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

const buckets = new Map<string, { n: number; reset: number }>();

/**
 * Límite de intentos en memoria: sirve para un solo servidor. En producción con varias
 * instancias hay que moverlo a Redis/Upstash.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  b.n += 1;
  return b.n <= limit;
}

export async function parseBody<S extends z.ZodType>(req: Request, schema: S) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false as const, res: fail("La petición no es JSON válido.", 400) };
  }
  const r = schema.safeParse(raw);
  if (!r.success) {
    const fields: Record<string, string> = {};
    // Para campos anidados (address.line) se usa el último segmento: es el nombre del input
    for (const issue of r.error.issues) fields[String(issue.path[issue.path.length - 1] ?? "form")] ??= issue.message;
    return { ok: false as const, res: fail("Revisa los datos del formulario.", 422, fields) };
  }
  return { ok: true as const, data: r.data as z.infer<S> };
}
