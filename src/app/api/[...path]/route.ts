import { apiFetch } from "@/server/api";

/**
 * Todo lo que el navegador pide a /api/* se reenvía a la API (otro Worker). Así las cookies de
 * sesión siguen siendo del mismo sitio y no hace falta CORS.
 */
async function proxy(req: Request, ctx: RouteContext<"/api/[...path]">) {
  const { path } = await ctx.params;
  const url = new URL(req.url);
  const headers = new Headers(req.headers);
  headers.set("x-forwarded-host", url.host);
  headers.delete("host");
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const res = await apiFetch(`/api/${path.join("/")}${url.search}`, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    redirect: "manual",
    // @ts-expect-error duplex es obligatorio al reenviar un cuerpo en streaming
    duplex: hasBody ? "half" : undefined,
  });
  return res;
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
