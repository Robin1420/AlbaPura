"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { money } from "@/lib/products";

export function AddToCart({ slug, name, stock, price }: { slug: string; name: string; stock?: number; price: number }) {
  const { add, setOpen } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [away, setAway] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const soldOut = stock !== undefined && stock <= 0;
  const max = stock !== undefined ? Math.max(1, stock) : 20;

  // La barra fija aparece cuando el botón principal sale de la pantalla hacia arriba.
  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setAway(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  const addNow = () => {
    add(slug, qty, name);
    setAdded(true);
  };

  return (
    <>
      <div ref={anchor} className="flex flex-wrap items-center gap-3">
        <div className="flex h-14 items-center rounded-full border border-line-strong" role="group" aria-label="Cantidad">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Quitar una unidad" className="grid size-12 place-items-center rounded-full text-[22px] hover:bg-ink-800/8">−</button>
          <output className="w-8 text-center font-display text-[17px] font-medium" aria-live="polite">{qty}</output>
          <button onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={soldOut || qty >= max} aria-label="Añadir una unidad" className="grid size-12 place-items-center rounded-full text-[22px] hover:bg-ink-800/8 disabled:opacity-40">+</button>
        </div>
        <Button size="lg" className="min-w-40 flex-1" disabled={soldOut} onClick={addNow}>
          <AnimatePresence mode="wait" initial={false}>
            <m.span key={added ? "ok" : "add"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="inline-flex items-center gap-2">
              {soldOut ? "Agotado" : added ? (<><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>Añadido</>) : "Añadir al carrito"}
            </m.span>
          </AnimatePresence>
        </Button>
        <Button size="lg" variant="secondary" className="basis-full" disabled={soldOut} onClick={() => { add(slug, qty, name); setOpen(true); }}>
          Comprar ahora
        </Button>
      </div>

      <AnimatePresence>
        {away && !soldOut && (
          <m.div initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ type: "spring", stiffness: 380, damping: 36 }} className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-between gap-4 rounded-2xl border border-line bg-dew-50/90 p-3 pl-5 shadow-[0_20px_50px_-20px_rgb(8_24_15/0.45)] backdrop-blur-xl lg:left-auto lg:right-6 lg:max-w-md">
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] font-medium">{name}</p>
              <p className="font-display text-[17px] font-semibold">{money(price * qty)}</p>
            </div>
            <Button size="md" onClick={addNow}>{added ? "Añadido" : "Añadir"}</Button>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
