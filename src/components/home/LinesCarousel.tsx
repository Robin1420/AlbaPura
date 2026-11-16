"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mix } from "@/components/ui/Mix";

export type CarouselLine = { slug: string; name: string; count: number; description?: string; image?: string };

const RING = "Hecho en Lima · Cuida tu piel · Cuida el planeta · ";
const ease = [0.22, 1, 0.36, 1] as const;

const wrap = (v: number, n: number) => {
  const o = ((v % n) + n) % n;
  return o > n / 2 ? o - n : o;
};

/**
 * Carrusel de las líneas de productos. Se arrastra (o con las flechas); las tarjetas lejanas se hacen
 * más pequeñas, oscuras y desenfocadas. Un clic en la tarjeta central abre la línea con sus productos.
 * Todo es CSS transform controlado por una animación suave: no usa WebGL.
 */
export function LinesCarousel({ lines }: { lines: CarouselLine[] }) {
  const router = useRouter();
  const n = lines.length;
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const pill = useRef<HTMLSpanElement>(null);
  const pos = useRef(0);
  const target = useRef(0);
  const raf = useRef(0);
  const shown = useRef(0);
  const drag = useRef<{ x: number; p: number; t: number; v: number; moved: boolean } | null>(null);
  const [active, setActive] = useState(0);

  const paint = useCallback(() => {
    const el = stage.current;
    if (!el || n === 0) return;
    const step = Math.min(el.clientWidth * 0.27, 340);
    cards.current.forEach((c, i) => {
      if (!c) return;
      const o = wrap(i - pos.current, n);
      const a = Math.min(Math.abs(o), 2);
      c.style.transform = `translate(-50%, -50%) translate(${o * step}px, ${o * o * 16}px) rotate(${o * 9}deg) scale(${1 - a * 0.2})`;
      c.style.filter = `brightness(${1 - a * 0.2}) blur(${a * 3}px)`;
      c.style.opacity = Math.abs(o) > 2.3 ? "0" : "1";
      c.style.zIndex = String(100 - Math.round(Math.abs(o) * 10));
      c.style.pointerEvents = Math.abs(o) > 2.3 ? "none" : "auto";
    });
    const idx = ((Math.round(pos.current) % n) + n) % n;
    if (idx !== shown.current) {
      shown.current = idx;
      setActive(idx);
    }
  }, [n]);

  const run = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const tick = () => {
      const d = target.current - pos.current;
      if (Math.abs(d) < 0.0008) {
        pos.current = target.current;
        paint();
        return;
      }
      pos.current += d * 0.12;
      paint();
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [paint]);

  useEffect(() => {
    paint();
    window.addEventListener("resize", paint);
    return () => {
      window.removeEventListener("resize", paint);
      cancelAnimationFrame(raf.current);
    };
  }, [paint]);

  const go = (delta: number) => {
    target.current = Math.round(target.current) + delta;
    run();
  };
  const goTo = (i: number) => {
    target.current = Math.round(pos.current) + Math.round(wrap(i - pos.current, n));
    run();
  };

  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, p: pos.current, t: performance.now(), v: 0, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = stage.current;
    if (d && el) {
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 6) d.moved = true;
      if (d.moved) {
        const step = Math.min(el.clientWidth * 0.27, 340);
        const now = performance.now();
        d.v = (-dx / step - (pos.current - d.p)) / Math.max(1, now - d.t);
        pos.current = d.p - dx / step;
        target.current = pos.current;
        paint();
      }
    }
    // El cursor "Ver productos" sigue al mouse sobre la tarjeta central
    const p = pill.current;
    const c = cards.current[shown.current];
    if (p && el && c && e.pointerType === "mouse") {
      const r = c.getBoundingClientRect();
      const on = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom && !d?.moved;
      const s = el.getBoundingClientRect();
      p.style.opacity = on ? "1" : "0";
      p.style.transform = `translate(${e.clientX - s.left}px, ${e.clientY - s.top}px) translate(-50%, -50%)`;
    }
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) {
      target.current = Math.round(pos.current - d.v * 220);
      run();
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    // Solo el gesto horizontal mueve el carrusel; el scroll vertical sigue recorriendo la página
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 12) go(e.deltaX > 0 ? 1 : -1);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
  };

  const cur = lines[active];

  return (
    <section id="lineas" className="relative overflow-hidden bg-dew-50 pb-16 pt-24 sm:pt-28 lg:pb-24" aria-labelledby="lineas-title">
      <div className="relative z-10 mx-auto max-w-[1280px] px-5 text-center sm:px-6">
        <Mix id="lineas-title" className="text-[clamp(34px,5vw,76px)] text-ink-800" parts={[{ t: "Elige" }, { t: "tu línea", italic: true, br: true }]} />
        <p className="mx-auto mt-4 max-w-[46ch] text-[17px] text-muted">Arrastra o usa las flechas. Toca la línea del centro para ver sus productos.</p>
      </div>

      <div
        ref={stage}
        role="group"
        aria-roledescription="carrusel"
        aria-label="Líneas de productos"
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={(e) => {
          onUp();
          if (pill.current && e.pointerType === "mouse") pill.current.style.opacity = "0";
        }}
        onWheel={onWheel}
        className="relative mx-auto mt-6 h-[clamp(420px,62vw,640px)] w-full max-w-[1500px] cursor-grab touch-pan-y select-none outline-none active:cursor-grabbing"
      >
        {/* Mancha orgánica y anillo de texto detrás de las tarjetas */}
        <span className="pointer-events-none absolute left-1/2 top-[60%] aspect-[1.08] w-[min(70vw,640px)] -translate-x-1/2 -translate-y-1/2 bg-ink-800 [border-radius:56%_44%_48%_52%/54%_46%_54%_46%]" aria-hidden="true" />
        <svg viewBox="0 0 800 800" className="sun-ring pointer-events-none absolute left-1/2 top-[60%] w-[min(94vw,800px)] opacity-70 -translate-x-1/2 -translate-y-1/2 [animation-duration:120s]" aria-hidden="true">
          <defs><path id="lines-ring" d="M400 400m-340 0a340 340 0 1 1 680 0a340 340 0 1 1-680 0" /></defs>
          <text className="fill-leaf-400 font-display text-[58px] font-medium uppercase tracking-[0.04em]">
            <textPath href="#lines-ring">{RING.repeat(2)}</textPath>
          </text>
        </svg>

        {lines.map((l, i) => (
          <Link
            key={l.slug}
            ref={(el) => {
              cards.current[i] = el;
            }}
            href={`/categoria/${l.slug}`}
            draggable={false}
            aria-label={`${l.name}, ${l.count} producto${l.count === 1 ? "" : "s"}`}
            onClick={(e) => {
              // Un arrastre o un toque en una tarjeta lateral no abren la línea: la traen al centro
              if (drag.current?.moved || i !== shown.current) {
                e.preventDefault();
                if (i !== shown.current) goTo(i);
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && i === shown.current && router.push(`/categoria/${l.slug}`)}
            className="absolute left-1/2 top-1/2 block aspect-[3/4.1] w-[clamp(190px,24vw,320px)] overflow-hidden rounded-t-[999px] rounded-b-[22px] bg-dew-100 will-change-transform [backface-visibility:hidden]"
          >
            {l.image && <Image src={l.image} alt="" fill sizes="(min-width:1024px) 24vw, 60vw" draggable={false} className="pointer-events-none object-cover" priority={i < 2} />}
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/65 via-transparent to-transparent" />
            <span className="pointer-events-none absolute inset-x-3 bottom-5 text-center font-display text-[12px] font-medium uppercase tracking-[0.1em] text-white sm:text-[13px]">{l.name}</span>
          </Link>
        ))}

        <span ref={pill} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-[200] flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 font-display text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-800 opacity-0 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.5)] transition-opacity duration-300">
          <span className="size-2 rounded-full bg-leaf-600" />
          Ver productos
        </span>
      </div>

      <div className="mx-auto mt-2 flex max-w-[1280px] flex-col items-center gap-5 px-5 text-center sm:px-6">
        <AnimatePresence mode="wait" initial={false}>
          {cur && (
            <m.div key={cur.slug} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease }} className="max-w-[52ch]">
              <p className="font-heading text-[clamp(30px,3.4vw,46px)] font-semibold leading-none">{cur.name}</p>
              <p className="mt-2 text-[16px] italic text-faint">{cur.count} producto{cur.count === 1 ? "" : "s"}{cur.description ? ` · ${cur.description}` : ""}</p>
            </m.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-3">
          <button onClick={() => go(-1)} aria-label="Línea anterior" className="grid size-12 place-items-center rounded-full border border-ink-800/25 transition-colors hover:bg-ink-800 hover:text-dew-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          {cur && (
            <Link href={`/categoria/${cur.slug}`} className="inline-flex h-12 items-center rounded-full bg-ink-800 px-8 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-dew-50 transition-colors hover:bg-ink-700">
              Ver productos
            </Link>
          )}
          <button onClick={() => go(1)} aria-label="Línea siguiente" className="grid size-12 place-items-center rounded-full border border-ink-800/25 transition-colors hover:bg-ink-800 hover:text-dew-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
