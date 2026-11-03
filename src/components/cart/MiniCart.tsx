"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { money } from "@/lib/products";
import { ButtonLink } from "@/components/ui/Button";
import { useCart } from "./CartProvider";
import { WhatsAppOrderButton } from "./WhatsAppButtons";
import { ProductArt } from "@/components/product/ProductArt";

export function MiniCart() {
  const cart = useCart();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cart.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cart]);

  return (
    <>
      {/* Aviso de producto añadido */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-4 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 transition-all sm:bottom-6 sm:w-auto sm:max-w-none duration-500 ease-out-expo ${
          cart.toast && !cart.open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-xl border border-line bg-dew-50 px-4 py-3 sm:gap-4 sm:px-5 shadow-[0_24px_60px_rgba(8,24,15,.18)]">
          <span className="grid size-7 place-items-center rounded-full bg-ink-800 text-dew-50" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </span>
          <div className="min-w-0 flex-1 leading-tight sm:flex-none">
            <p className="font-display text-[15px] font-medium">Añadido a tu carrito</p>
            <p className="truncate text-[14px] italic text-muted">{cart.toast}</p>
          </div>
          <button onClick={() => cart.setOpen(true)} className="shrink-0 font-display text-[14px] font-medium text-leaf-600 underline-offset-4 hover:underline">
            Ver carrito
          </button>
        </div>
      </div>

      {/* Drawer */}
      <div className={`fixed inset-0 z-[80] overflow-hidden transition-opacity duration-300 ${cart.open ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={!cart.open} inert={!cart.open}>
        <button aria-label="Cerrar carrito" className="absolute inset-0 bg-ink-900/55" onClick={() => cart.setOpen(false)} tabIndex={-1} />
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Tu carrito"
          tabIndex={-1}
          className={`absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col rounded-l-[28px] bg-dew-50 px-5 py-6 sm:px-8 sm:py-8 shadow-[0_24px_60px_rgba(8,24,15,.18)] transition-transform duration-500 ease-out-expo outline-none ${
            cart.open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-baseline justify-between">
            <h2 className="text-[34px]">Tu carrito</h2>
            <button onClick={() => cart.setOpen(false)} className="rounded-full p-2 hover:bg-ink-800/8" aria-label="Cerrar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          {cart.items.length === 0 ? (
            <div className="flex flex-1 flex-col items-start justify-center gap-4">
              <p className="font-display text-[22px] font-medium">Aún no hay nada aquí.</p>
              <p className="text-muted">Empieza por el jabón artesanal de avena, uno de los primeros productos de Alba Pura.</p>
              <ButtonLink href="/producto/jabon-artesanal-de-avena" variant="primary" onClick={() => cart.setOpen(false)}>
                Ver el jabón
              </ButtonLink>
            </div>
          ) : (
            <>
              <p className="mt-6 rounded-lg bg-leaf-300/40 p-4 font-display text-[14px] font-medium text-ink-700">
                Fase de prueba: entregamos en Lima Metropolitana y Callao.
              </p>

              <ul className="mt-6 flex-1 divide-y divide-line overflow-y-auto">
                {cart.items.map(({ product, qty }) => (
                  <li key={product.slug} className="flex gap-4 py-4">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-dew-100">
                      <ProductArt product={product} sizes="80px" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Link href={`/producto/${product.slug}`} onClick={() => cart.setOpen(false)} className="font-display text-[17px] font-medium leading-tight hover:underline">
                        {product.name}
                      </Link>
                      <p className="text-[14px] italic text-faint">{product.meta}, × {qty}</p>
                      <button onClick={() => cart.remove(product.slug)} className="w-fit text-[14px] text-leaf-600 underline-offset-4 hover:underline">Quitar</button>
                    </div>
                    <p className="font-display text-[16px] font-medium">{money(product.price * qty)}</p>
                  </li>
                ))}
              </ul>

              <div className="border-t border-line pt-5">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-[18px] font-medium">Subtotal</span>
                  <span className="font-display text-[28px] font-medium tracking-tight">{money(cart.total)}</span>
                </div>
                <p className="mt-1 text-[14px] italic text-faint">El envío se calcula al pagar.</p>
                <div className="mt-5 grid gap-2">
                  <ButtonLink href="/checkout" variant="primary" size="lg" onClick={() => cart.setOpen(false)}>Ir a pagar</ButtonLink>
                  <WhatsAppOrderButton />
                  <ButtonLink href="/carrito" variant="ghost" onClick={() => cart.setOpen(false)}>Ver carrito completo</ButtonLink>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
