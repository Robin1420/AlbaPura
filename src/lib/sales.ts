/** Canales de venta y formas de pago (ventas dentro y fuera de la web). */

export const channelLabel: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  tienda: "Tienda",
  feria: "Feria o evento",
  b2b: "B2B (empresas)",
  otro: "Otro",
};

/** Canales que se pueden elegir al registrar una venta a mano (la web se registra sola). */
export const manualChannels = ["whatsapp", "instagram", "facebook", "tiktok", "tienda", "feria", "b2b", "otro"] as const;

export const paymentLabel: Record<string, string> = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta (POS)",
  credito: "Crédito / por cobrar",
  otro: "Otro",
};

export const stockTypeLabel: Record<string, string> = {
  production: "Producción",
  sale_web: "Venta web",
  sale_manual: "Venta manual",
  return: "Devolución",
  adjust_in: "Aumento manual",
  adjust_out: "Reducción manual",
};

/** Inicio y fin (segundos Unix) de los periodos del reporte. */
export function periodRange(p: "today" | "month" | "30d" | "all"): { from: number; to: number } {
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const s = (d: Date) => Math.floor(d.getTime() / 1000);
  if (p === "today") return { from: s(day), to: s(day) + 86400 };
  if (p === "month") return { from: s(new Date(now.getFullYear(), now.getMonth(), 1)), to: s(new Date(now.getFullYear(), now.getMonth() + 1, 1)) };
  if (p === "30d") return { from: s(day) - 29 * 86400, to: s(day) + 86400 };
  return { from: 0, to: 0 };
}
