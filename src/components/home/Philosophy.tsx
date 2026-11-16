"use client";

import { m, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

const TEXT =
  "Creemos que lo que usas en tu piel o llevas a tu mesa no debería hacerte daño. Elegimos ingredientes de origen natural, producimos en pequeñas cantidades en Lima y pensamos cada empaque para dejar la menor huella posible.";

function Word({ w, i, n, progress }: { w: string; i: number; n: number; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [i / n, (i + 1) / n], [0.2, 1]);
  return (
    <m.span style={{ opacity }} className="phil-word inline-block">
      {w}
    </m.span>
  );
}

/** Declaración de la marca: las palabras se encienden una a una mientras bajas por la página. */
export function Philosophy() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = TEXT.split(" ");

  return (
    <section className="flex min-h-[92svh] items-center bg-dew-50 px-5 py-24 sm:px-6 lg:px-12 lg:py-36" aria-labelledby="filosofia-title">
      <div ref={ref} className="mx-auto w-full max-w-[1080px] text-center">
        <p id="filosofia-title" className="font-display text-[14px] font-medium uppercase tracking-[0.12em] text-leaf-600">Nuestra filosofía</p>
        <p className="mt-8 font-display text-[clamp(26px,3.5vw,54px)] font-normal leading-[1.16] tracking-[-0.025em] text-ink-800" aria-label={TEXT}>
          <span aria-hidden="true">
            {words.map((w, i) => (
              <span key={i}>
                <Word w={w} i={i} n={words.length} progress={scrollYProgress} />{" "}
              </span>
            ))}
          </span>
        </p>
      </div>
    </section>
  );
}
