"use client";

import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import { ProductArt } from "@/components/product/ProductArt";
import type { Product } from "@/lib/products";

/** Foto principal en arco con zoom que sigue al cursor, cambio con fundido y miniaturas. */
export function Gallery({ product }: { product: Product }) {
  const [i, setI] = useState(0);
  const photos = product.images;
  const hasPhotos = photos.length > 0;

  function track(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--ox", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--oy", `${((e.clientY - r.top) / r.height) * 100}%`);
  }

  return (
    <div className="w-full max-w-[640px] lg:sticky lg:top-36 lg:max-w-[min(640px,calc((100svh-15rem)*5/6))] lg:self-start">
      <div
        onPointerMove={track}
        className="relative aspect-[5/6] w-full overflow-hidden rounded-t-[999px] rounded-b-xl bg-dew-100 [&_img]:[transform-origin:var(--ox,50%)_var(--oy,50%)] [&_img]:transition-transform [&_img]:duration-500 [&_img]:ease-out [@media(hover:hover)]:hover:cursor-zoom-in [@media(hover:hover)]:hover:[&_img]:scale-[1.7]"
      >
        <AnimatePresence initial={false}>
          <m.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
            <ProductArt product={product} src={photos[i]} priority sizes="(min-width:1024px) 45vw, 100vw" />
          </m.div>
        </AnimatePresence>
      </div>
      {hasPhotos && photos.length > 1 && (
        <ul className="mt-4 grid grid-cols-5 gap-3" aria-label="Fotos del producto">
          {photos.map((src, k) => (
            <li key={src}>
              <button
                onClick={() => setI(k)}
                aria-label={`Ver foto ${k + 1}`}
                aria-current={k === i}
                className={`relative block aspect-square w-full overflow-hidden rounded-lg bg-dew-100 outline-offset-2 transition-all duration-300 ${k === i ? "ring-2 ring-ink-800" : "opacity-70 hover:opacity-100"}`}
              >
                <ProductArt product={product} src={src} sizes="120px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
