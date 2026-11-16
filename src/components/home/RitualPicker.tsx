"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { money } from "@/lib/products";

export type PickerCategory = { slug: string; name: string; count: number; description?: string; image?: string };
export type PickerProduct = { slug: string; name: string; meta: string; price: number; categorySlug: string; image?: string; comingSoon?: boolean };

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * “Elige tu línea”: un selector grande de categorías. Al pasar el mouse (o tocar) cambia la foto en el arco
 * y aparecen sus productos con compra directa.
 */
export function RitualPicker({ categories, products }: { categories: PickerCategory[]; products: PickerProduct[] }) {
  const { add } = useCart();
  const [i, setI] = useState(0);
  const cat = categories[i];
  if (!cat) return null;
  const inCat = products.filter((p) => p.categorySlug === cat.slug);
  const image = cat.image ?? inCat.find((p) => p.image)?.image;

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
      <div>
        {/* En el celular: píldoras que se desplazan */}
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden [scrollbar-width:none]" role="tablist" aria-label="Líneas de productos">
          {categories.map((c, n) => (
            <button key={c.slug} role="tab" aria-selected={n === i} onClick={() => setI(n)} className={`shrink-0 rounded-full border px-4 py-2 font-display text-[15px] font-medium transition-colors ${n === i ? "border-ink-800 bg-ink-800 text-dew-50" : "border-ink-800/25"}`}>
              {c.name}
            </button>
          ))}
        </div>

        <ul className="hidden lg:block" role="tablist" aria-label="Líneas de productos" aria-orientation="vertical">
          {categories.map((c, n) => (
            <li key={c.slug} className="border-b border-ink-800/15 first:border-t">
              <button
                role="tab"
                aria-selected={n === i}
                onMouseEnter={() => setI(n)}
                onFocus={() => setI(n)}
                onClick={() => setI(n)}
                className="group flex w-full items-baseline justify-between gap-6 py-[clamp(0.6rem,2svh,1.4rem)] text-left"
              >
                <span className={`font-heading text-[clamp(34px,min(4.6vw,7.4svh),64px)] font-semibold leading-none transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)] ${n === i ? "translate-x-4 opacity-100" : "opacity-45 group-hover:opacity-80"}`}>
                  {c.name}
                </span>
                <span className={`shrink-0 font-display text-[15px] italic transition-colors ${n === i ? "text-leaf-600" : "text-faint"}`}>{c.count} producto{c.count === 1 ? "" : "s"}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 min-h-[5.5rem] lg:mt-7">
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={cat.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}>
              {cat.description && <p className="max-w-[48ch] text-[clamp(16px,2.3svh,19px)] text-muted">{cat.description}</p>}
              <Link href={`/categoria/${cat.slug}`} className="mt-3 inline-flex items-center gap-2 font-display text-[16px] font-semibold underline decoration-1 underline-offset-[6px] hover:decoration-2">
                Ver {cat.name.toLowerCase()}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
              </Link>
            </m.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[min(460px,calc((100svh-var(--header-h)-3rem)*0.8))]">
        <span className="absolute -left-[12%] -top-[4%] aspect-square w-[64%] rounded-full bg-peach-300/55 blur-[2px]" aria-hidden="true" />
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-2xl bg-dew-100 shadow-[0_36px_70px_-40px_rgb(8_24_15/0.55)]">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.div key={cat.slug} className="absolute inset-0" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease }}>
              {image && <Image src={image} alt={`Línea ${cat.name}`} fill sizes="(min-width:1024px) 40vw, 90vw" className="object-cover" />}
            </m.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 -mt-14 px-3 sm:-ml-10 sm:mr-6 sm:px-0">
          <AnimatePresence mode="wait" initial={false}>
            <m.ul key={cat.slug} className="grid gap-1.5 rounded-2xl border border-white/70 bg-dew-50/90 p-2 shadow-[0_24px_50px_-26px_rgb(8_24_15/0.5)] backdrop-blur-xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease }}>
              {inCat.slice(0, 3).map((p) => (
                <li key={p.slug} className="flex items-center gap-3 rounded-xl p-1.5">
                  <Link href={`/producto/${p.slug}`} className="relative size-12 shrink-0 overflow-hidden rounded-t-full rounded-b-md bg-dew-100" aria-label={p.name}>
                    {p.image && <Image src={p.image} alt="" fill sizes="48px" className="object-cover" />}
                  </Link>
                  <Link href={`/producto/${p.slug}`} className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[15px] font-medium leading-tight">{p.name}</span>
                    <span className="block truncate text-[12px] italic text-faint">{p.meta}</span>
                  </Link>
                  {p.comingSoon ? (
                    <span className="font-display text-[13px] italic text-muted">Próximamente</span>
                  ) : (
                    <>
                      <span className="font-display text-[15px] font-medium">{money(p.price)}</span>
                      <button onClick={() => add(p.slug, 1, p.name)} aria-label={`Añadir ${p.name} al carrito`} className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-800 text-dew-50 transition-colors hover:bg-leaf-500 hover:text-ink-900">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                      </button>
                    </>
                  )}
                </li>
              ))}
              {inCat.length === 0 && <li className="p-3 text-[14px] italic text-muted">Pronto habrá productos en esta línea.</li>}
            </m.ul>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
