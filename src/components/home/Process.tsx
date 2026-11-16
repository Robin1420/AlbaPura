"use client";

import { m, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { Mix } from "@/components/ui/Mix";

const steps = [
  { title: "Ingredientes de origen natural", text: "Elegimos con cuidado lo que lleva cada producto y evitamos los ingredientes que más suelen afectar la piel." },
  { title: "Hechos en Lima", text: "Producimos en pequeñas cantidades para cuidar cada lote." },
  { title: "Empaques con menos huella", text: "Pensamos cada empaque para dejar la menor huella posible." },
  { title: "A tu casa", text: "Entregamos en Lima Metropolitana y Callao, o puedes coordinar el recojo de tu pedido." },
];

const icons = [
  <path key="0" d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14ZM5 19 13 11" />,
  <path key="1" d="M12 3c3.5 4 6 7 6 10.5a6 6 0 0 1-12 0C6 10 8.5 7 12 3Z" />,
  <path key="2" d="M4 8h16l-1.5 11a1 1 0 0 1-1 .9h-11a1 1 0 0 1-1-.9L4 8Zm2-4h12l2 4H4l2-4Z" />,
  <path key="3" d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" />,
];

function Node({ i, progress }: { i: number; progress: MotionValue<number> }) {
  const at = (i + 0.4) / steps.length;
  const fill = useTransform(progress, [at - 0.12, at], [0, 1]);
  const color = useTransform(progress, [at - 0.12, at], ["#0e2a1b", "#f7faf1"]);
  return (
    <span className="relative grid size-16 shrink-0 place-items-center rounded-full border border-ink-800/25 bg-dew-50 text-ink-800">
      <m.span style={{ opacity: fill, scale: fill }} className="absolute inset-0 rounded-full bg-ink-800" aria-hidden="true" />
      <m.svg style={{ color }} viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="relative" aria-hidden="true">
        {icons[i]}
      </m.svg>
    </span>
  );
}

/** "Del origen a tu casa": cuatro pasos unidos por una línea que se va llenando mientras bajas. */
export function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "end 0.55"] });
  const scaleX = useTransform(scrollYProgress, [0.05, 0.95], [0, 1]);

  return (
    <section className="relative overflow-hidden bg-dew-100 px-5 py-16 sm:px-6 lg:px-12 lg:py-24" aria-labelledby="proceso-title">
      <span className="pointer-events-none absolute -left-24 top-10 size-80 rounded-full bg-peach-300/30 blur-3xl" aria-hidden="true" />
      <span className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-leaf-300/50 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1280px]">
        <div className="text-center">
          <Mix id="proceso-title" className="text-[clamp(34px,5vw,76px)] text-ink-800" parts={[{ t: "Del origen" }, { t: "a tu casa", italic: true, br: true }]} />
        </div>

        <div ref={ref} className="relative mt-14 lg:mt-20">
          {/* Línea horizontal (escritorio) y vertical (celular) */}
          <span className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-ink-800/15 lg:block" aria-hidden="true" />
          <m.span style={{ scaleX }} className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px origin-left bg-ink-800 lg:block" aria-hidden="true" />
          <span className="absolute bottom-8 left-8 top-8 w-px bg-ink-800/15 lg:hidden" aria-hidden="true" />
          <m.span style={{ scaleY: scaleX }} className="absolute bottom-8 left-8 top-8 w-px origin-top bg-ink-800 lg:hidden" aria-hidden="true" />

          <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-6">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-5 lg:flex-col lg:items-center lg:text-center">
                <Node i={i} progress={scrollYProgress} />
                <div className="lg:max-w-[26ch]">
                  <h3 className="font-display text-[14px] font-medium uppercase leading-snug tracking-[0.08em] text-ink-800">{s.title}</h3>
                  <p className="mt-2 text-[16px] leading-snug text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
