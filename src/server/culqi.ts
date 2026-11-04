/**
 * Culqi (tarjeta y Yape). El navegador crea un token con la llave PÚBLICA (el número de tarjeta
 * nunca llega a este servidor) y aquí se cobra con la llave SECRETA. El monto sale siempre del
 * pedido guardado, nunca de lo que mande el navegador.
 */
/** CULQI_API_URL solo se define para pruebas con un servidor simulado; en producción queda la de Culqi. */
const API = process.env.CULQI_API_URL ?? "https://api.culqi.com/v2";

export const culqiKeys = () => ({ pk: process.env.CULQI_PUBLIC_KEY, sk: process.env.CULQI_SECRET_KEY });
export const culqiConfigured = () => {
  const { pk, sk } = culqiKeys();
  return Boolean(pk && sk && pk.startsWith("pk_") && sk.startsWith("sk_"));
};

/** El pago con QR de billeteras móviles se enciende con CULQI_QR=on (apagado por defecto hasta validarlo con un pago real). */
export const culqiQrEnabled = () => culqiConfigured() && process.env.CULQI_QR === "on";

export type CulqiCharge =
  | { ok: true; id: string; reference: string; live: boolean }
  | { ok: false; reason: "declined" | "needs_3ds" | "error"; message: string };

type ChargeResponse = {
  object?: string;
  id?: string;
  action_code?: string;
  reference_code?: string;
  authorization_code?: string;
  user_message?: string;
  merchant_message?: string;
  type?: string;
};

/** Crea el cargo con el token que entregó el checkout de Culqi. `amountSoles` son soles enteros. */
export async function createCharge(input: { tokenId: string; amountSoles: number; email: string; orderId: string }): Promise<CulqiCharge> {
  const { sk } = culqiKeys();
  if (!sk) return { ok: false, reason: "error", message: "Los pagos con tarjeta no están disponibles por ahora." };

  let res: Response;
  try {
    res = await fetch(`${API}/charges`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.round(input.amountSoles * 100), // Culqi trabaja en céntimos
        currency_code: "PEN",
        email: input.email,
        source_id: input.tokenId,
        capture: true,
        description: `Pedido ${input.orderId} · Alba Pura`,
        metadata: { pedido: input.orderId },
      }),
    });
  } catch (e) {
    console.error("Culqi no respondió", e);
    return { ok: false, reason: "error", message: "No pudimos conectar con el servicio de pagos. Inténtalo de nuevo en un momento." };
  }

  const body = (await res.json().catch(() => ({}))) as ChargeResponse;

  // Con 3D Secure activo en la cuenta, Culqi pide una verificación extra antes de aprobar
  if (body.action_code === "REVIEW") {
    return { ok: false, reason: "needs_3ds", message: "Tu tarjeta pide una verificación extra (3D Secure) que todavía no tenemos activa. Prueba con otra tarjeta o con Yape." };
  }
  if (res.ok && body.object === "charge" && body.id) {
    return { ok: true, id: body.id, reference: body.reference_code ?? body.authorization_code ?? "", live: sk.startsWith("sk_live") };
  }

  console.error("Culqi rechazó el cargo", res.status, body.type, body.merchant_message);
  return { ok: false, reason: "declined", message: body.user_message || "El banco no aprobó el pago. Revisa los datos o prueba con otra tarjeta o con Yape." };
}

/** Las billeteras móviles (QR) solo aceptan montos entre S/ 6 y S/ 500. */
export const walletRange = { min: 6, max: 500 };

type OrderResponse = { object?: string; id?: string; state?: string; amount?: number; order_number?: string; paid_at?: number | null };

async function culqiFetch(method: "GET" | "POST", path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: OrderResponse & { merchant_message?: string } }> {
  const { sk } = culqiKeys();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: res.ok, status: res.status, data: (await res.json().catch(() => ({}))) as OrderResponse };
}

/**
 * Crea la orden en Culqi para que el checkout muestre también el QR de billeteras móviles.
 * Devuelve null si no se pudo: el pedido sigue pudiendo pagarse con tarjeta o Yape.
 */
export async function createCulqiOrder(i: { orderId: string; amountSoles: number; email: string; firstName: string; lastName: string; phone: string; minutes?: number }) {
  if (i.amountSoles < walletRange.min || i.amountSoles > walletRange.max) return null;
  // Culqi exige el teléfono (entre 6 y 15 caracteres con el +): se normaliza a +51 y 9 dígitos si viene con código de país
  let digits = i.phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("51")) digits = digits.slice(2);
  if (digits.length > 12) digits = digits.slice(-9);
  const phone = `+51${digits}`;
  try {
    const r = await culqiFetch("POST", "/orders", {
      amount: Math.round(i.amountSoles * 100),
      currency_code: "PEN",
      description: `Pedido ${i.orderId} · Alba Pura`,
      order_number: i.orderId,
      client_details: {
        first_name: (i.firstName || "Cliente").slice(0, 50),
        last_name: (i.lastName || "Alba Pura").slice(0, 50),
        email: i.email,
        phone_number: phone,
      },
      expiration_date: Math.floor(Date.now() / 1000) + (i.minutes ?? 40) * 60,
      confirm: false, // el checkout de Culqi la confirma al elegir el medio de pago
    });
    if (r.ok && r.data.id) return r.data.id;
    console.error("Culqi no creó la orden", r.status, r.data.merchant_message);
  } catch (e) {
    console.error("Culqi no respondió al crear la orden", e);
  }
  return null;
}

export type CulqiOrderState = { state: string; amount: number; orderNumber: string | null; paid: boolean };

/** Consulta a Culqi el estado real de una orden: es la única fuente de verdad (el aviso del webhook no se da por bueno). */
export async function getCulqiOrder(id: string): Promise<CulqiOrderState | null> {
  if (!/^ord_(test|live)_[A-Za-z0-9]+$/.test(id)) return null;
  try {
    const r = await culqiFetch("GET", `/orders/${id}`);
    if (!r.ok || r.data.object !== "order") return null;
    return { state: r.data.state ?? "", amount: r.data.amount ?? 0, orderNumber: r.data.order_number ?? null, paid: r.data.state === "paid" };
  } catch (e) {
    console.error("Culqi no respondió al consultar la orden", e);
    return null;
  }
}
