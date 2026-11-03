/**
 * Webpay Plus por su API REST (sin el SDK de Node, que no corre en Workers).
 * Sin TBK_COMMERCE_CODE / TBK_API_KEY usa el ambiente de integración de Transbank
 * (tarjetas de prueba, sin cargos reales). En producción hay que definir ambas variables.
 */
const INTEGRATION = {
  code: "597055555532",
  key: "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C",
  base: "https://webpay3gint.transbank.cl",
};
const PRODUCTION_BASE = "https://webpay3g.transbank.cl";
const PATH = "/rswebpaytransbank/v1.2/transactions";

export type WebpayCommit = { status: string; response_code: number; buy_order: string; amount: number; authorization_code?: string };

function config() {
  const code = process.env.TBK_COMMERCE_CODE;
  const key = process.env.TBK_API_KEY;
  if (code && key) return { code, key, base: PRODUCTION_BASE };
  if (process.env.ENVIRONMENT === "production") throw new Error("Faltan TBK_COMMERCE_CODE y TBK_API_KEY en producción.");
  return INTEGRATION;
}

async function call<T>(method: "POST" | "PUT", path: string, body?: unknown): Promise<T> {
  const c = config();
  const res = await fetch(c.base + path, {
    method,
    headers: { "Tbk-Api-Key-Id": c.code, "Tbk-Api-Key-Secret": c.key, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Webpay respondió ${res.status}`);
  return (await res.json()) as T;
}

export function webpay() {
  return {
    create: (buyOrder: string, sessionId: string, amount: number, returnUrl: string) =>
      call<{ token: string; url: string }>("POST", PATH, { buy_order: buyOrder, session_id: sessionId, amount, return_url: returnUrl }),
    commit: (token: string) => call<WebpayCommit>("PUT", `${PATH}/${token}`),
  };
}

/** Dirección pública de la tienda (donde vive el front). */
export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
