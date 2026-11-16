"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Mix } from "@/components/ui/Mix";
import { money } from "@/lib/products";

export type SpotProduct = { slug: string; name: string; meta: string; price: number; comingSoon?: boolean };

/** Posición (en %) de cada producto dentro de /img/portada.jpg. */
const spots: { slug: string; x: number; y: number }[] = [
  { slug: "aceite-de-oliva-virgen-extra", x: 76, y: 38 },
  { slug: "miel-de-abeja-pura", x: 62, y: 60 },
  { slug: "jabon-artesanal-de-avena", x: 58, y: 78 },
  { slug: "balsamo-labial-de-cera-de-abeja", x: 87, y: 79 },
];

const ease = [0.22, 1, 0.36, 1] as const;

/** Foto de los productos con puntos que se pueden tocar: cada uno abre una tarjeta con sus datos y compra directa. */
export function Hotspots({ products }: { products: SpotProduct[] }) {
  const { add } = useCart();
  const list = spots.flatMap((s) => {
    const p = products.find((x) => x.slug === s.slug);
    return p ? [{ ...s, p }] : [];
  });
  const [open, setOpen] = useState(list[0]?.slug ?? "");
  const cur = list.find((s) => s.slug === open) ?? list[0];
  if (!cur) return null;

  return (
    <section className="bg-dew-50 px-5 py-20 sm:px-6 lg:px-12 lg:py-28" aria-labelledby="mira-title">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-10 text-center">
          <Mix id="mira-title" className="text-[clamp(34px,5vw,76px)] text-ink-800" parts={[{ t: "Míralos" }, { t: "de cerca", italic: true, br: true }]} />
          <p className="mx-auto mt-5 max-w-[46ch] text-[17px] text-muted">Toca un punto para conocer cada producto.</p>
        </div>

        <div className="relative mx-auto w-full max-w-[1080px]">
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[28px] bg-dew-100 shadow-[0_40px_80px_-50px_rgb(8_24_15/0.55)]">
          <Image src="/img/portada.jpg" alt="Aceite, miel, jabones y bálsamo de Alba Pura sobre un lino" fill sizes="(min-width:1080px) 1080px, 94vw" className="object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink-900/25 to-transparent" />

          {list.map((s) => {
            const on = s.slug === cur.slug;
            return (
              <button
                key={s.slug}
                onClick={() => setOpen(s.slug)}
                onMouseEnter={() => setOpen(s.slug)}
                aria-label={`Ver ${s.p.name}`}
                aria-pressed={on}
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
                className="absolute z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center"
              >
                <span className={`absolute inset-0 rounded-full border border-white/80 ${on ? "" : "animate-ping"}`} aria-hidden="true" />
                <span className={`relative grid place-items-center rounded-full border border-white/90 transition-all duration-500 ${on ? "size-6 bg-white" : "size-4 bg-white/45 backdrop-blur-sm"}`}>
                  {on && <span className="size-2 rounded-full bg-ink-800" />}
                </span>
              </button>
            );
          })}
        </div>

          {/* Tarjeta del producto elegido: sobre la foto en escritorio, debajo en el celular */}
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={cur.slug}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease }}
              className="relative z-20 mt-4 rounded-2xl bg-white p-5 shadow-[0_24px_50px_-26px_rgb(8_24_15/0.5)] ring-1 ring-ink-800/5 sm:absolute sm:left-[5%] sm:top-[8%] sm:mt-0 sm:w-[330px] sm:bg-dew-50/95 sm:backdrop-blur-xl"
            >
              <h3 className="font-display text-[19px] font-medium leading-tight tracking-[-0.01em]">{cur.p.name}</h3>
              <p className="mt-1 text-[14px] italic text-faint">{cur.p.meta}</p>
              <div className="mt-4 flex items-center gap-2">
                {cur.p.comingSoon ? (
                  <span className="font-display text-[15px] font-medium italic text-muted">Próximamente</span>
                ) : (
                  <>
                    <button onClick={() => add(cur.p.slug, 1, cur.p.name)} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-ink-800 font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-dew-50 transition-colors hover:bg-ink-700">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                      Añadir
                    </button>
                    <span className="grid h-10 place-items-center rounded-full bg-leaf-300 px-4 font-display text-[15px] font-medium">{money(cur.p.price)}</span>
                  </>
                )}
                <Link href={`/producto/${cur.p.slug}`} aria-label={`Ver ${cur.p.name}`} className="grid size-10 shrink-0 place-items-center rounded-full border border-ink-800/20 transition-colors hover:bg-ink-800 hover:text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
                </Link>
              </div>
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
