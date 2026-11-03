"use client";

import { useCart } from "@/components/cart/CartProvider";

export function QuickAdd({ slug, name, soldOut }: { slug: string; name: string; soldOut?: boolean }) {
  const { add } = useCart();
  return (
    <button
      disabled={soldOut}
      onClick={() => add(slug, 1, name)}
      aria-label={`Añadir ${name} al carrito`}
      className="group/btn inline-flex disabled:opacity-40 disabled:pointer-events-none h-10 items-center gap-2 rounded-full bg-ink-800 px-3 text-dew-50 transition-all duration-300 hover:bg-leaf-500 hover:text-ink-900"
    >
      <span className="max-w-0 overflow-hidden whitespace-nowrap font-display text-[14px] font-semibold opacity-0 transition-all duration-300 group-hover/btn:max-w-24 group-hover/btn:pl-1 group-hover/btn:opacity-100 group-focus-visible/btn:max-w-24 group-focus-visible/btn:opacity-100">
        Añadir
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    </button>
  );
}
