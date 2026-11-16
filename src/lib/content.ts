import { STANDARD_SHIPPING } from "@/lib/checkout";
import type { Product } from "@/lib/products";

export type Post = {
  slug: string;
  title: string;
  topic: "Piel" | "Ciencia" | "Medio ambiente";
  excerpt: string;
  date: string;
  minutes: number;
  image?: string;
  /** Ilustración que se usa cuando el artículo no tiene foto. */
  art: Product["art"];
  body: string[];
};

export const faqs: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: "Envíos",
    items: [
      { q: "¿Dónde entregan?", a: "Por ahora, en Lima Metropolitana y Callao, porque queremos cuidar cada entrega. Si estás en otra ciudad, escríbenos y vemos si es posible." },
      { q: "¿Cuánto cuesta el delivery?", a: `El delivery en Lima Metropolitana y Callao cuesta S/ ${STANDARD_SHIPPING}. Al finalizar tu pedido ves el total exacto antes de pagar. Te confirmamos el día de entrega por correo.` },
      { q: "¿Puedo recoger mi pedido?", a: "Sí. Elige Retiro coordinado al pagar y te escribimos para acordar un punto en Lima, el día y la hora." },
    ],
  },
  {
    group: "Pagos",
    items: [
      { q: "¿Qué medios de pago aceptan?", a: "Tarjetas Visa, Mastercard, American Express y Diners, Yape, o el QR de tu billetera móvil (Yape, Plin y otras). Pagas de forma segura con Culqi y los datos de tu tarjeta no pasan por nuestro sitio. Preparamos tu pedido cuando se confirma el pago." },
      { q: "¿Puedo pagar por transferencia o por WhatsApp?", a: "Por ahora el pago se hace con tarjeta o Yape en la tienda. Si tienes dudas o prefieres que te ayudemos con tu pedido, escríbenos por WhatsApp." },
    ],
  },
  {
    group: "Devoluciones",
    items: [
      { q: "Mi pedido llegó dañado, ¿qué hago?", a: "Escríbenos dentro de las 48 horas siguientes a la entrega con una foto del producto y del empaque. Lo reponemos sin costo." },
      { q: "¿Puedo devolver un producto?", a: "Por tratarse de productos de cuidado personal y de consumo, no aceptamos devoluciones de productos abiertos. Si algo no es lo que esperabas, escríbenos y revisamos tu caso." },
    ],
  },
  {
    group: "Productos",
    items: [
      { q: "¿Los productos son naturales?", a: "Esa es la base de la línea: ingredientes de origen natural y procesos pensados para no dañar a las personas ni al medio ambiente. Detallamos lo que lleva cada producto en su ficha. Si tienes dudas sobre un ingrediente, escríbenos." },
      { q: "Tengo piel sensible o alergias, ¿puedo usarlos?", a: "Revisa la lista de ingredientes y prueba el producto en una zona pequeña antes de usarlo. Si tienes una condición diagnosticada o alergias conocidas, consulta antes con tu médico." },
    ],
  },
];

export function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
}
