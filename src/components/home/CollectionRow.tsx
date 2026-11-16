"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Mix } from "@/components/ui/Mix";
import { money } from "@/lib/products";

export type RowProduct = { slug: string; name: string; meta: string; category: string; price: number; image?: string; comingSoon?: boolean; soldOut?: boolean };
export type RowCategory = { slug: string; name: string; description?: string; image?: string };

const tones = ["bg-peach-100", "bg-sky-100", "bg-dew-200", "bg-peach-300/70"];

/** Fila de colección: foto grande a un lado y, al otro, el título con un carrusel de tarjetas pastel. */
export function CollectionRow({ category, products, flip, tone }: { category: RowCategory; products: RowProduct[]; flip?: boolean; tone: number }) {
  const { add } = useCart();
  const rail = useRef<HTMLUListElement>(null);
  const [end, setEnd] = useState(false);
  const [can, setCan] = useState(false);

  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    setCan(el.scrollWidth > el.clientWidth + 4);
    setEnd(el.scrollLeft > el.scrollWidth - el.clientWidth - 4);
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const words = category.name.split(" ");
  const last = words.pop() ?? "";
  const bg = tones[tone % tones.length];
  const next = () => {
    const el = rail.current;
    if (!el) return;
    if (end) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
  };
  const image = category.image ?? products.find((p) => p.image)?.image;

  return (
    <article className="grid overflow-hidden bg-dew-50 lg:min-h-[min(100svh,860px)] lg:grid-cols-2" aria-label={category.name}>
      <Link href={`/categoria/${category.slug}`} className={`group relative block min-h-[56svh] overflow-hidden bg-dew-100 lg:min-h-0 ${flip ? "lg:order-2" : ""}`} aria-label={`Ver ${category.name}`}>
        {image && <Image src={image} alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]" />}
      </Link>

      <div className={`flex min-w-0 flex-col justify-center gap-7 px-5 py-14 sm:px-8 lg:px-12 lg:py-16 ${flip ? "lg:order-1" : ""}`}>
        <div className="flex items-end justify-between gap-6">
          <Mix as="h3" caps={false} className="text-[clamp(38px,4.4vw,72px)] text-ink-800" parts={[{ t: words.join(" ") || last, italic: false }, ...(words.length ? [{ t: last, italic: true }] : [])]} />
          {can && <button onClick={next} aria-label={end ? "Volver al principio" : "Ver más productos"} className="grid size-14 shrink-0 place-items-center rounded-full bg-ink-800 text-white transition-colors hover:bg-ink-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform duration-500 ${end ? "rotate-180" : ""}`}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>}
        </div>

        <ul ref={rail} onScroll={measure} className="rail -mr-5 flex gap-4 overflow-x-auto pb-2 pr-5 sm:-mr-8 sm:pr-8 lg:-mr-12 lg:pr-12">
          {products.map((p) => (
            <li key={p.slug} className="w-[min(64vw,270px)] shrink-0 lg:w-[calc(50%-0.5rem)] xl:w-[calc(46%-0.5rem)]">
              <div className={`group/card relative flex h-full flex-col rounded-[22px] p-3 ${bg}`}>
                <div className="flex h-9 items-center justify-between">
                  <span className="rounded-full bg-white px-3 py-1 font-display text-[10.5px] font-medium uppercase tracking-[0.08em]">{p.category}</span>
                  {!p.comingSoon && !p.soldOut && (
                    <button onClick={() => add(p.slug, 1, p.name)} aria-label={`Añadir ${p.name} al carrito`} className="grid size-8 place-items-center rounded-full bg-white transition-colors hover:bg-ink-800 hover:text-white">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
                    </button>
                  )}
                </div>
                <Link href={`/producto/${p.slug}`} className="mt-2 block">
                  <span className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-white/50">
                    {p.image && <Image src={p.image} alt={p.name} fill sizes="270px" className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover/card:scale-[1.06]" />}
                  </span>
                  <span className="mt-3 flex items-start justify-between gap-3 px-1 pb-1 font-display text-[12px] font-medium uppercase leading-snug tracking-[0.05em]">
                    <span>{p.name}</span>
                    <span className="shrink-0">{p.comingSoon ? "Pronto" : p.soldOut ? "Agotado" : money(p.price)}</span>
                  </span>
                </Link>
              </div>
            </li>
          ))}
        </ul>

        {category.description && <p className="max-w-[40ch] font-display text-[12.5px] font-medium uppercase leading-relaxed tracking-[0.06em] text-ink-700">{category.description}</p>}
      </div>
    </article>
  );
}
