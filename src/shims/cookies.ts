import { store } from "./context";

type Opts = { httpOnly?: boolean; sameSite?: "lax" | "strict" | "none"; secure?: boolean; path?: string; maxAge?: number };

function parse(header: string | null) {
  const out = new Map<string, string>();
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out.set(part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim()));
  }
  return out;
}

/** Equivalente a `cookies()` de Next: lee las cookies de la petición y agrega Set-Cookie a la respuesta. */
export async function cookies() {
  const s = store();
  const jar = parse(s.req.headers.get("cookie"));
  const write = (name: string, value: string, o: Opts) => {
    const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${o.path ?? "/"}`];
    if (o.maxAge !== undefined) parts.push(`Max-Age=${o.maxAge}`);
    if (o.httpOnly) parts.push("HttpOnly");
    if (o.secure) parts.push("Secure");
    parts.push(`SameSite=${o.sameSite === "strict" ? "Strict" : o.sameSite === "none" ? "None" : "Lax"}`);
    s.setCookies.push(parts.join("; "));
  };
  return {
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string, o: Opts = {}) => write(name, value, o),
    delete: (name: string) => write(name, "", { maxAge: 0, httpOnly: true, secure: true }),
  };
}
