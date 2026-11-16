"use client";

import { cartMessage, whatsappUrl } from "@/lib/whatsapp";
import { useCart } from "./CartProvider";

function Glyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24s8.24 3.7 8.24 8.24-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}

function useOrderLink() {
  const cart = useCart();
  const href = whatsappUrl(cartMessage(cart.items, { gift: cart.gift, giftPrice: cart.giftPrice, total: cart.total }));
  return { href, hasItems: cart.items.length > 0 };
}

/** Botón dentro del carrito: abre WhatsApp con el pedido escrito. */
export function WhatsAppOrderButton({ className = "" }: { className?: string }) {
  const { href } = useOrderLink();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-6 font-display text-[17px] font-semibold text-[#06361b] transition-[filter,transform] hover:brightness-95 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] ${className}`}
    >
      <Glyph />
      Pedir por WhatsApp
    </a>
  );
}

/** Burbuja flotante en toda la tienda: con carrito lleno envía el pedido, vacío abre una conversación. */
export function WhatsAppFloat() {
  const { href, hasItems } = useOrderLink();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={hasItems ? "Enviar mi carrito por WhatsApp" : "Escríbenos por WhatsApp"}
      className="fixed bottom-24 right-4 z-[60] grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(8,24,15,.28)] transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:bottom-6 sm:right-6"
    >
      <Glyph size={30} />
    </a>
  );
}
