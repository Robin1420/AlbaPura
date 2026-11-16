import { als, type Env } from "@/shims/context";
import { routes } from "./routes.gen";

const METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

const compiled = routes.map((r) => {
  const names: string[] = [];
  const re = new RegExp("^" + r.pattern.replace(/\[([^\]]+)\]/g, (_m, n) => (names.push(n), "([^/]+)")) + "/?$");
  return { re, names, methods: r.methods };
});

function match(pathname: string) {
  for (const r of compiled) {
    const m = r.re.exec(pathname);
    if (m) return { methods: r.methods, params: Object.fromEntries(r.names.map((n, i) => [n, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const hit = match(url.pathname);
    if (!hit) return Response.json({ error: "No encontrado." }, { status: 404 });

    const method = req.method === "HEAD" ? "GET" : req.method;
    const handler = METHODS.has(method) ? hit.methods[method] : undefined;
    if (!handler) return Response.json({ error: "Método no permitido." }, { status: 405, headers: { Allow: Object.keys(hit.methods).join(", ") } });

    const store = { req, env, ctx, setCookies: [] as string[] };
    try {
      const res = await als.run(store, async () => handler(req, { params: Promise.resolve(hit.params) }));
      // Las respuestas de redirect() son inmutables: se copian para poder agregar cookies
      const out = new Response(res.body, res);
      for (const c of store.setCookies) out.headers.append("Set-Cookie", c);
      return out;
    } catch (e) {
      console.error("Error en", req.method, url.pathname, e);
      return Response.json({ error: "Algo salió mal. Inténtalo de nuevo." }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
