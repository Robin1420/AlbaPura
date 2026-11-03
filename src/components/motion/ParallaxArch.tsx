"use client";

import { m, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

/** Foto en arco con paralaje suave y un sello giratorio. */
export function ParallaxArch({ src, alt, seal }: { src: string; alt: string; seal: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <div ref={ref} className="relative max-w-[560px]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-xl bg-dew-100">
        <m.div style={{ y }} className="parallax absolute inset-x-0 -inset-y-[10%]">
          <Image src={src} alt={alt} fill sizes="(min-width:1024px) 40vw, 90vw" className="object-cover" />
        </m.div>
      </div>
      <m.div style={{ rotate }} className="parallax absolute -right-4 bottom-10 grid size-36 place-items-center rounded-full bg-leaf-400 text-ink-900 shadow-[0_18px_40px_-18px_rgb(8_24_15/0.5)] sm:-right-10 sm:size-44" aria-hidden="true">
        <svg viewBox="0 0 120 120" className="size-full">
          <defs><path id="seal" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" /></defs>
          <text className="fill-current font-display text-[11.5px] font-semibold tracking-[0.22em]"><textPath href="#seal">{seal} · {seal} ·</textPath></text>
          <path d="M42 78c0-20 12-34 34-34 0 22-14 34-34 34Z" className="fill-none stroke-current" strokeWidth="2" />
          <path d="M42 78 62 58" className="stroke-current" strokeWidth="2" />
        </svg>
      </m.div>
    </div>
  );
}
