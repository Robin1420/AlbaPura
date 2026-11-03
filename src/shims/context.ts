import { AsyncLocalStorage } from "node:async_hooks";

export type Env = {
  DB: D1Database;
  /** Fotos subidas desde el panel (R2). Opcional hasta que R2 esté activo en la cuenta. */
  MEDIA?: R2Bucket;
  APP_URL?: string;
  BANK_INFO?: string;
  CONTACT_TO?: string;
  EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
  TBK_COMMERCE_CODE?: string;
  TBK_API_KEY?: string;
};

export type Store = {
  req: Request;
  env: Env;
  ctx: ExecutionContext;
  /** Cabeceras Set-Cookie que se agregan a la respuesta. */
  setCookies: string[];
};

export const als = new AsyncLocalStorage<Store>();

export function store(): Store {
  const s = als.getStore();
  if (!s) throw new Error("Fuera de una petición.");
  return s;
}

/** Deja que una tarea (por ejemplo enviar un correo) termine después de responder. */
export function background(p: Promise<unknown>) {
  const s = als.getStore();
  if (s) s.ctx.waitUntil(p.catch((e) => console.error("Tarea en segundo plano falló", e)));
  return p;
}
