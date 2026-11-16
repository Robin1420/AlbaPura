import { money, type Product } from "@/lib/products";

/** WhatsApp de Alba Pura (código de país de Perú + número). */
export const WHATSAPP = { number: "51931320429", display: "+51 931 320 429" } as const;

export const whatsappUrl = (text: string) => `https://wa.me/${WHATSAPP.number}?text=${encodeURIComponent(text)}`;

/** Mensaje de pedido con lo que hay en el carrito, listo para enviar. Sin productos, un saludo simple. */
export function cartMessage(items: { product: Product; qty: number }[], opts: { gift: boolean; giftPrice: number; total: number }) {
  if (items.length === 0) return "Hola, Alba Pura. Quisiera información sobre sus productos.";
  const lines = items.map((i) => `• ${i.qty} × ${i.product.name} (${i.product.meta}): ${money(i.product.price * i.qty)}`);
  return [
    "Hola, Alba Pura. Quiero hacer este pedido:",
    "",
    ...lines,
    ...(opts.gift && opts.giftPrice > 0 ? [`• Envoltorio para regalo: ${money(opts.giftPrice)}`] : []),
    "",
    `Total: ${money(opts.total)} (sin envío)`,
    "",
    "Mi nombre y distrito de entrega son: ",
  ].join("\n");
}
