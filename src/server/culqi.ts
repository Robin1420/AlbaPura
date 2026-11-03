/**
 * Culqi (tarjeta y Yape). El navegador crea un token con la llave PÚBLICA (el número de tarjeta
 * nunca llega a este servidor) y aquí se cobra con la llave SECRETA. El monto sale siempre del
 * pedido guardado, nunca de lo que mande el navegador.
 */
const API = "https://api.culqi.com/v2";

export const culqiKeys = () => ({ pk: process.env.CULQI_PUBLIC_KEY, sk: process.env.CULQI_SECRET_KEY });
export const culqiConfigured = () => {
  const { pk, sk } = culqiKeys();
  return Boolean(pk && sk && pk.startsWith("pk_") && sk.startsWith("sk_"));
};

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
