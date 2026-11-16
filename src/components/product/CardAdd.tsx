"use client";

import { useCart } from "@/components/cart/CartProvider";
import { money } from "@/lib/products";

/** Botón "Añadir" y precio de una tarjeta de producto. */
export function CardAdd({ slug, name, price }: { slug: string; name: string; price: number }) {
  const { add } = useCart();
  return (
    <>
      <button onClick={() => add(slug, 1, name)} aria-label={`Añadir ${name} al carrito`} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-white font-display text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-900 transition-colors hover:bg-leaf-300">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        Añadir
      </button>
      <span className="grid h-10 place-items-center rounded-full bg-ink-800/90 px-4 font-display text-[14px] font-medium text-white">{money(price)}</span>
    </>
  );
}
