export type ShippingMethod = "standard" | "express" | "pickup";

/**
 * Opciones que se ofrecen al pagar. "express" se conserva en el tipo para no romper pedidos antiguos,
 * pero no se ofrece mientras la tienda esté en fase de prueba.
 */
export const shippingOptions: { id: ShippingMethod; name: string; eta: string }[] = [
  { id: "standard", name: "Delivery en Lima Metropolitana y Callao", eta: "1 a 3 días hábiles, coordinamos contigo" },
  { id: "pickup", name: "Retiro coordinado en Lima", eta: "Acordamos el punto, el día y la hora contigo" },
];

/** Para pedidos que ya existen y usaron una opción que hoy no se ofrece. */
export function shippingLabel(id: ShippingMethod) {
  return shippingOptions.find((o) => o.id === id)?.name ?? "Delivery express";
}

// Valores de ejemplo para la fase de prueba: ajústalos a tus costos reales (en soles).
export const STANDARD_SHIPPING = 10;
const EXPRESS_SHIPPING = 15;

export function shippingCost(method: ShippingMethod) {
  if (method === "pickup") return 0;
  return method === "express" ? EXPRESS_SHIPPING : STANDARD_SHIPPING;
}

/** Zonas con entrega por ahora. */
export const regions = ["Lima Metropolitana", "Callao"];

export type Errors = Record<string, string>;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(email: string): Errors {
  const e: Errors = {};
  if (!emailRe.test(email.trim())) e.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
  return e;
}

export function validateAddress(a: { name: string; lastName: string; line: string; region: string; comuna: string; phone: string }): Errors {
  const e: Errors = {};
  if (a.name.trim().length < 2) e.name = "Escribe tu nombre.";
  if (a.lastName.trim().length < 2) e.lastName = "Escribe tu apellido.";
  if (a.line.trim().length < 5) e.line = "Escribe la calle, el número y el departamento si corresponde.";
  if (!a.region) e.region = "Elige una zona.";
  if (a.comuna.trim().length < 2) e.comuna = "Escribe tu distrito.";
  if (a.phone.replace(/\D/g, "").length < 9) e.phone = "Escribe un celular de 9 dígitos.";
  return e;
}

export function estimateDelivery(method: ShippingMethod, from = new Date()) {
  const addDays = (d: number) => {
    const x = new Date(from);
    let left = d;
    while (left > 0) {
      x.setDate(x.getDate() + 1);
      if (x.getDay() !== 0 && x.getDay() !== 6) left--;
    }
    return x;
  };
  const fmt = (d: Date) => d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
  if (method === "pickup") return "A coordinar contigo";
  if (method === "express") return fmt(addDays(1));
  return `${fmt(addDays(1))} al ${fmt(addDays(3))}`;
}
