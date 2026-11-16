"use client";

import Link from "next/link";
import { useState } from "react";
import { Mix } from "@/components/ui/Mix";

export type FaqItem = { q: string; a: string };

/** Preguntas rápidas: se despliegan una a la vez, con las respuestas reales de la tienda. */
export function FaqPreview({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState(0);

  return (
    <section className="bg-dew-50 px-5 py-16 sm:px-6 lg:px-12 lg:py-24" aria-labelledby="faq-title">
      <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Mix id="faq-title" className="text-[clamp(34px,4.6vw,68px)] text-ink-800" parts={[{ t: "Dudas" }, { t: "rápidas", italic: true, br: true }]} />
          <p className="mt-5 max-w-[34ch] text-[17px] text-muted">Lo que más nos preguntan antes de hacer un pedido. Si falta algo, escríbenos y te respondemos.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/preguntas-frecuentes" className="inline-flex h-12 items-center rounded-full bg-ink-800 px-7 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-dew-50 transition-colors hover:bg-ink-700">Ver todas</Link>
            <Link href="/contacto" className="inline-flex h-12 items-center rounded-full border border-ink-800/25 px-7 font-display text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors hover:bg-ink-800 hover:text-dew-50">Escríbenos</Link>
          </div>
        </div>

        <ul className="divide-y divide-ink-800/12 border-y border-ink-800/12">
          {items.map((f, i) => {
            const on = open === i;
            return (
              <li key={f.q}>
                <h3>
                  <button onClick={() => setOpen(on ? -1 : i)} aria-expanded={on} aria-controls={`faq-${i}`} className="group flex w-full items-center justify-between gap-6 py-6 text-left">
                    <span className="font-display text-[clamp(18px,1.7vw,22px)] font-medium leading-snug tracking-[-0.01em]">{f.q}</span>
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-500 ease-[var(--ease-out-expo)] ${on ? "rotate-45 border-ink-800 bg-ink-800 text-dew-50" : "border-ink-800/25 group-hover:border-ink-800"}`} aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </span>
                  </button>
                </h3>
                <div id={`faq-${i}`} role="region" className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out-expo)] ${on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="max-w-[60ch] pb-6 pr-12 text-[17px] leading-relaxed text-muted">{f.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
