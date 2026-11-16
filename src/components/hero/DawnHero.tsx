"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { ButtonLink } from "@/components/ui/Button";
import { money } from "@/lib/products";

export type HeroProduct = { slug: string; name: string; meta: string; category: string; price: number; image: string };

const ease = [0.22, 1, 0.36, 1] as const;
const SLIDE_MS = 5200;

/** Cada línea del titular sube desde una máscara: es el único gran momento de entrada de la página. */
function Line({ children, delay }: { children: string; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <m.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 1, delay, ease }}>{children}</m.span>
    </span>
  );
}

/**
 * Hero “amanecer”: un sol sale detrás de un arco donde rotan los productos.
 * El arco y el sol siguen el mouse con distinta profundidad; los productos cambian solos y se pueden elegir.
 */
export function DawnHero({ products }: { products: HeroProduct[] }) {
  const { add } = useCart();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [calm, setCalm] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 70, damping: 18 });
  const sy = useSpring(py, { stiffness: 70, damping: 18 });
  const archX = useTransform(sx, (v) => v * -14);
  const archY = useTransform(sy, (v) => v * -10);
  const sunX = useTransform(sx, (v) => v * 34);
  const sunY = useTransform(sy, (v) => v * 22);
  const chipX = useTransform(sx, (v) => v * 20);
  const chipY = useTransform(sy, (v) => v * 14);

  const list = products.length ? products : [];
  const p = list[i % Math.max(1, list.length)];

  // Quien prefiere menos movimiento no ve el cambio automático ni el seguimiento del mouse
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setCalm(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (calm || paused || list.length < 2) return;
    const t = setTimeout(() => setI((n) => (n + 1) % list.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [i, paused, calm, list.length]);

  const onMove = (e: React.PointerEvent) => {
    if (calm || e.pointerType !== "mouse") return;
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section className="bg-dawn grain relative isolate overflow-hidden" aria-label="Presentación de Alba Pura">
      <div className="mx-auto grid min-h-[100svh] max-w-[1440px] items-center gap-6 px-5 pb-12 pt-[calc(var(--header-h)+1.5rem)] sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-10 lg:px-20 lg:pb-10">
        <div className="relative z-10">
          <h1 className="text-[clamp(44px,min(5.7vw,10.5svh),92px)] font-semibold leading-[0.92]">
            <Line delay={0.15}>Cuida tu piel.</Line>
            <Line delay={0.32}>Cuida el planeta.</Line>
          </h1>
          <m.p className="mt-5 max-w-[34ch] font-text text-[clamp(19px,1.9vw,26px)] italic text-ink-600" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7, ease }}>
            Productos orgánicos hechos en Lima.
          </m.p>
          <m.p className="mt-3 max-w-[44ch] text-[18px] text-muted" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.82, ease }}>
            Pensados para no dañar a quien los usa ni al medio ambiente. Estamos en fase de prueba: sé de las primeras personas en conocerlos.
          </m.p>
          <m.div className="mt-7 flex flex-wrap gap-3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.95, ease }}>
            <ButtonLink href="/tienda" size="lg">Ver los productos</ButtonLink>
            <ButtonLink href="/nosotros" size="lg" variant="secondary">Nuestra historia</ButtonLink>
          </m.div>

          {list.length > 1 && (
            <m.div className="mt-9 hidden lg:block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}>
              <p className="mb-3 text-[15px] italic text-faint">Mira los primeros productos</p>
              <ul className="flex gap-3" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
                {list.map((x, n) => (
                  <li key={x.slug}>
                    <button onClick={() => setI(n)} aria-label={`Ver ${x.name}`} aria-current={n === i % list.length} className="group block text-left">
                      <span className={`relative block h-[76px] w-[60px] overflow-hidden rounded-t-full rounded-b-lg bg-dew-100 ring-2 ring-offset-2 ring-offset-transparent transition-all duration-500 ${n === i % list.length ? "ring-ink-800" : "ring-transparent opacity-70 group-hover:opacity-100"}`}>
                        <Image src={x.image} alt="" fill sizes="60px" className="object-cover" />
                      </span>
                      <span className="mt-2 block h-[3px] w-[60px] overflow-hidden rounded-full bg-ink-800/15">
                        {n === i % list.length && (
                          <m.span key={`${i}-${paused}`} className="block h-full origin-left bg-ink-800" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: calm || paused ? 0 : SLIDE_MS / 1000, ease: "linear" }} />
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </m.div>
          )}
        </div>

        {/* Escenario: sol + arco */}
        <div
          ref={stage}
          className="relative mx-auto w-full max-w-[min(560px,calc((100svh-var(--header-h)-3rem)*0.8))]"
          onPointerMove={onMove}
          onPointerLeave={() => {
            px.set(0);
            py.set(0);
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <m.div className="absolute -right-[18%] top-[2%] aspect-square w-[88%]" style={{ x: sunX, y: sunY }} aria-hidden="true">
            <m.div className="size-full rounded-full bg-[radial-gradient(circle_at_50%_50%,#fbe3d3_0%,#f6c7ae_52%,rgb(246_199_174/0)_71%)]" initial={{ y: "42%", opacity: 0, scale: 0.82 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ duration: 1.8, delay: 0.1, ease }} />
            <span className="sun-ring absolute inset-[-7%] rounded-full border border-ink-800/15" />
            <span className="sun-ring absolute inset-[-16%] rounded-full border border-ink-800/10 [animation-duration:60s]" />
          </m.div>

          <m.div style={{ x: archX, y: archY }} className="relative">
            <m.div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-2xl bg-dew-100 shadow-[0_40px_80px_-40px_rgb(8_24_15/0.6)]" initial={{ clipPath: "inset(100% 0 0 0 round 999px 999px 16px 16px)" }} animate={{ clipPath: "inset(0% 0 0 0 round 999px 999px 16px 16px)" }} transition={{ duration: 1.3, delay: 0.25, ease }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <m.div key={p?.slug ?? "portada"} className="absolute inset-0" initial={{ opacity: 0, scale: 1.12 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease }}>
                  <Image src={p?.image ?? "/img/portada.jpg"} alt={p ? `${p.name}, ${p.meta}` : "Productos de Alba Pura: jabones, aceite de oliva, miel, infusión y bálsamo"} fill priority sizes="(min-width:1024px) 40vw, 92vw" className="object-cover" />
                </m.div>
              </AnimatePresence>
            </m.div>

            {/* Tarjeta del producto en pantalla */}
            {p && (
              <m.div style={{ x: chipX, y: chipY }} className="absolute -left-3 bottom-8 w-[min(78%,300px)] sm:-left-12">
                <AnimatePresence mode="wait" initial={false}>
                  <m.div key={p.slug} className="rounded-2xl border border-white/70 bg-dew-50/85 p-4 shadow-[0_24px_50px_-26px_rgb(8_24_15/0.55)] backdrop-blur-xl" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5, ease }}>
                    <p className="text-[13px] italic text-leaf-600">{p.category}</p>
                    <Link href={`/producto/${p.slug}`} className="block font-display text-[18px] font-medium leading-tight hover:underline underline-offset-4">{p.name}</Link>
                    <p className="text-[13px] italic text-faint">{p.meta}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="font-display text-[22px] font-medium">{money(p.price)}</span>
                      <button onClick={() => add(p.slug, 1, p.name)} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink-800 px-4 font-display text-[14px] font-semibold text-dew-50 transition-colors hover:bg-ink-700" aria-label={`Añadir ${p.name} al carrito`}>
                        Añadir
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                      </button>
                    </div>
                  </m.div>
                </AnimatePresence>
              </m.div>
            )}

            {/* Sello giratorio */}
            <div className="sun-ring absolute -right-3 top-[14%] grid size-28 place-items-center rounded-full bg-leaf-400 text-ink-900 shadow-[0_18px_40px_-18px_rgb(8_24_15/0.5)] [animation-duration:28s] sm:-right-8 sm:size-32" aria-hidden="true">
              <svg viewBox="0 0 120 120" className="size-full">
                <defs><path id="hero-seal" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" /></defs>
                <text className="fill-current font-display text-[11.5px] font-semibold tracking-[0.22em]"><textPath href="#hero-seal">Hecho en Lima · Hecho en Lima ·</textPath></text>
                <path d="M42 78c0-20 12-34 34-34 0 22-14 34-34 34Z" className="fill-none stroke-current" strokeWidth="2" />
                <path d="M42 78 62 58" className="stroke-current" strokeWidth="2" />
              </svg>
            </div>
          </m.div>
        </div>
      </div>

      {/* Indicador de desplazamiento */}
      <a href="#lineas" className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-display text-[13px] text-muted lg:flex" aria-label="Bajar a las líneas de productos">
        Descubre
        <span className="relative block h-9 w-px overflow-hidden bg-ink-800/20"><span className="scroll-cue absolute inset-x-0 top-0 h-3 bg-ink-800" /></span>
      </a>
    </section>
  );
}
