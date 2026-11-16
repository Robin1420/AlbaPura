"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FavoriteButton } from "@/components/product/FavoriteButton";
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
    <article className="grid overflow-hidden bg-dew-50 lg:min-h-[min(82svh,700px)] lg:grid-cols-2" aria-label={category.name}>
      <Link href={`/categoria/${category.slug}`} className={`group relative block min-h-[48svh] overflow-hidden bg-dew-100 lg:min-h-0 ${flip ? "lg:order-2" : ""}`} aria-label={`Ver ${category.name}`}>
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
            <li key={p.slug} className="w-[min(68vw,290px)] shrink-0 lg:w-[calc(50%-0.5rem)] xl:w-[calc(46%-0.5rem)]">
              <article className={`group/card relative isolate aspect-[3/4] overflow-hidden rounded-[24px] ${bg}`}>
                {p.image && <Image src={p.image} alt="" fill sizes="290px" className="-z-10 object-cover transition-transform duration-[1100ms] ease-[var(--ease-out-expo)] group-hover/card:scale-[1.06]" />}
                <span className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900/80 via-ink-900/10 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 font-display text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-900 backdrop-blur-sm">{p.category}</span>
                <FavoriteButton slug={p.slug} name={p.name} />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <Link href={`/producto/${p.slug}`} className="block after:absolute after:inset-0 after:content-['']">
                    <span className="block font-heading text-[clamp(26px,2.2vw,32px)] font-semibold leading-[0.95]">{p.name}</span>
                    <span className="mt-1.5 block text-[14px] italic text-white/80">{p.meta}</span>
                  </Link>
                  <div className="relative z-10 mt-3 flex items-center gap-2">
                    {p.comingSoon ? (
                      <span className="rounded-full bg-white/20 px-4 py-2 font-display text-[12px] font-medium uppercase tracking-[0.08em] backdrop-blur-sm">Próximamente</span>
                    ) : p.soldOut ? (
                      <span className="rounded-full bg-danger px-4 py-2 font-display text-[12px] font-medium uppercase tracking-[0.08em]">Agotado</span>
                    ) : (
                      <>
                        <button onClick={() => add(p.slug, 1, p.name)} aria-label={`Añadir ${p.name} al carrito`} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-white font-display text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-900 transition-colors hover:bg-leaf-300">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                          Añadir
                        </button>
                        <span className="grid h-10 place-items-center rounded-full bg-ink-800/90 px-4 font-display text-[14px] font-medium">{money(p.price)}</span>
                      </>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

        {category.description && <p className="max-w-[40ch] font-display text-[12.5px] font-medium uppercase leading-relaxed tracking-[0.06em] text-ink-700">{category.description}</p>}
      </div>
    </article>
  );
}
