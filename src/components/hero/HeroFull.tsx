"use client";

import Image from "next/image";
import Link from "next/link";
import { m } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

/** Cada línea sube desde una máscara: el único gran momento de entrada de la página. */
function Line({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.12em] pt-[0.04em]">
      <m.span className="block" initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1.05, delay, ease }}>{children}</m.span>
    </span>
  );
}

const sans = "font-display font-semibold tracking-[-0.035em]";
const serif = "font-heading font-medium italic tracking-[-0.02em] text-[1.16em] leading-[0.8]";

/** Portada a pantalla completa: foto, titular centrado en dos voces y una barra grande para entrar a la tienda. */
export function HeroFull() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-ink-900 px-5 pb-36 pt-28 text-center text-white" aria-label="Presentación de Alba Pura">
      <m.div className="absolute inset-0 -z-20" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.2, ease }}>
        <Image src="/img/portada.jpg" alt="Productos de Alba Pura: jabones, aceite de oliva, miel, infusión y bálsamo sobre un lino" fill priority sizes="100vw" className="object-cover object-[70%_58%]" />
      </m.div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_38%,rgb(8_24_15/0.55)_0%,rgb(8_24_15/0.25)_60%,rgb(8_24_15/0.45)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-ink-900/55 to-transparent" />

      <h1 className="max-w-[16ch] text-[clamp(44px,7.4vw,112px)] leading-[0.98] sm:max-w-none">
        <Line delay={0.2}>
          <span className={serif}>Cuida</span> <span className={sans}>tu piel,</span>
        </Line>
        <Line delay={0.38}>
          <span className={sans}>cuida el</span> <span className={serif}>planeta</span>
        </Line>
      </h1>
      <m.p className="mt-6 max-w-[44ch] font-display text-[clamp(14px,1.25vw,17px)] font-medium leading-snug" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.85, ease }}>
        Productos naturales hechos en Lima, pensados para no dañar a quien los usa ni al medio ambiente.
      </m.p>

      <m.div className="absolute inset-x-0 bottom-8 flex justify-center px-5 sm:bottom-12" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 1.05, ease }}>
        <Link href="/tienda" className="group flex h-[64px] w-full max-w-[730px] items-center rounded-full bg-white/92 pl-8 pr-2 text-ink-900 shadow-[0_24px_60px_-28px_rgb(0_0_0/0.6)] backdrop-blur-md transition-colors hover:bg-white sm:h-[68px]">
          <span className="flex-1 text-center font-display text-[13px] font-medium uppercase tracking-[0.1em] underline decoration-1 underline-offset-[5px] sm:text-[14px]">Explorar todos los productos</span>
          <span className="grid size-[52px] shrink-0 place-items-center overflow-hidden rounded-full bg-ink-800 text-white sm:size-[54px]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </Link>
      </m.div>
    </section>
  );
}
