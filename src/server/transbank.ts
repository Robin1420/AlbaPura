import "server-only";
import { Environment, IntegrationApiKeys, IntegrationCommerceCodes, Options, WebpayPlus } from "transbank-sdk";

/**
 * Webpay Plus. Sin TBK_COMMERCE_CODE / TBK_API_KEY usa el ambiente de integración de Transbank
 * (tarjetas de prueba, sin cargos reales). En producción hay que definir ambas variables.
 */
export function webpay() {
  const code = process.env.TBK_COMMERCE_CODE;
  const key = process.env.TBK_API_KEY;
  if (code && key) return new WebpayPlus.Transaction(new Options(code, key, Environment.Production));
  if (process.env.NODE_ENV === "production") throw new Error("Faltan TBK_COMMERCE_CODE y TBK_API_KEY en producción.");
  return new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));
}

export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
