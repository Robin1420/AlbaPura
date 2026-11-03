"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Hero de presentación: el video corre solo y, al terminar, la marca aparece en
 * pantalla (header, título, botones). Sin archivo de video, se usa el póster y
 * un temporizador para simular la duración del film.
 *
 * Para activar el video real: copia el archivo a public/video/hero.mp4 (y .webm).
 */
const VIDEO_MP4 = "/video/hero.mp4";
// Pon NEXT_PUBLIC_HERO_VIDEO=1 cuando subas public/video/hero.mp4. Sin video no hay intro que esperar:
// el texto se muestra de inmediato (mejora la carga y evita un 404 en cada visita).
const HAS_VIDEO = process.env.NEXT_PUBLIC_HERO_VIDEO === "1";
const FALLBACK_MS = 8000;

export function CinematicHero() {
  const [state, setState] = useState<"playing" | "revealed">(HAS_VIDEO ? "playing" : "revealed");
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasVideo, setHasVideo] = useState(HAS_VIDEO);
  const video = useRef<HTMLVideoElement>(null);

  const reveal = useCallback(() => setState("revealed"), []);

  // El header lee este atributo para ocultarse mientras el video está solo
  useEffect(() => {
    document.documentElement.dataset.hero = state;
    return () => {
      delete document.documentElement.dataset.hero;
    };
  }, [state]);

  // Movimiento reducido: mostrar directamente el estado final
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const raf = requestAnimationFrame(reveal);
    return () => cancelAnimationFrame(raf);
  }, [reveal]);

  // Sin video: temporizador + progreso simulado
  useEffect(() => {
    if (hasVideo || state === "revealed") return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / FALLBACK_MS);
      setProgress(p);
      if (p >= 1) reveal();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasVideo, state, reveal]);

  const revealed = state === "revealed";

  return (
    <section data-state={state} className="relative isolate min-h-[100svh] overflow-hidden bg-ink-900 text-dew-50 md:snap-start" aria-label="Presentación de Alba Pura">
      {/* Capa de video / póster: en escritorio ocupa la mitad derecha para dejar aire al texto */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#c6cfb8] to-[#d9e0cb]">
        <div className="absolute inset-y-0 right-0 w-full md:w-[min(100%,calc(100svh*1.18))]">
          <Image src="/img/portada.jpg" alt="Productos de Alba Pura: jabones, aceite de oliva, miel, infusión y bálsamo" fill priority sizes="(min-width:768px) 70vw, 100vw" className="object-cover object-[78%_center] md:object-center" />
          {hasVideo && (
            <video
              ref={video}
              className="absolute inset-0 h-full w-full object-cover object-[68%_center] md:object-center"
              autoPlay
              muted={muted}
              playsInline
              preload="auto"
              poster="/img/portada.jpg"
              onEnded={reveal}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration) setProgress(v.currentTime / v.duration);
              }}
            >
              <source src={VIDEO_MP4} type="video/mp4" onError={() => setHasVideo(false)} />
            </video>
          )}
          <div className="absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-[#c9d2bc] to-transparent md:block" />
        </div>
      </div>

      {/* Scrim: aparece al revelar para dar lectura al texto */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-900/95 via-ink-800/75 to-ink-800/5 transition-opacity duration-[1400ms] ease-out-expo md:via-ink-800/70"
        style={{ opacity: revealed ? 1 : 0 }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-900/40 via-transparent to-ink-900/50" />

      {/* Contenido revelado */}
      <div className="mx-auto flex min-h-[100svh] max-w-[1440px] flex-col justify-end px-6 pb-24 pt-40 md:justify-center md:px-20 md:pb-12 md:pt-36">
        <h1 className="max-w-[14ch] text-[clamp(40px,min(5.8vw,10svh),84px)] font-semibold leading-[0.95] tracking-[-0.045em] md:max-w-none">
          <span className="hero-reveal block" style={{ "--d": "300ms" } as React.CSSProperties}>Cuida tu piel.</span>
          <span className="hero-reveal block" style={{ "--d": "520ms" } as React.CSSProperties}>Cuida el planeta.</span>
        </h1>
        <p className="hero-reveal mt-6 font-text text-[clamp(20px,2.2vw,30px)] italic text-leaf-300" style={{ "--d": "900ms" } as React.CSSProperties}>
          Productos orgánicos hechos en Lima.
        </p>
        <p className="hero-reveal mt-4 max-w-[34ch] text-[19px] text-dew-100/85 md:text-[20px]" style={{ "--d": "1100ms" } as React.CSSProperties}>
          Pensados para no dañar a quien los usa ni al medio ambiente. Estamos en fase de prueba: sé de las primeras personas en conocerlos.
        </p>
        <div className="hero-reveal mt-7 flex flex-wrap gap-3 md:mt-9" style={{ "--d": "1300ms" } as React.CSSProperties}>
          <ButtonLink href="/tienda" variant="accent" size="lg">Ver los productos</ButtonLink>
          <ButtonLink href="/nosotros" variant="glass" size="lg">Nuestra historia</ButtonLink>
        </div>
      </div>

      {/* Controles del film (solo mientras corre) */}
      <div className="hero-controls">
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-6 md:p-10">
          <button onClick={() => { setMuted((m) => !m); if (video.current) video.current.muted = !muted; }} className="glass rounded-full px-5 py-2.5 font-display text-[14px] font-medium" aria-pressed={!muted}>
            Sonido: {muted ? "apagado" : "encendido"}
          </button>
          <button onClick={() => { video.current?.pause(); reveal(); }} className="glass rounded-full px-5 py-2.5 font-display text-[14px] font-medium">
            Saltar intro
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25" role="progressbar" aria-label="Progreso del film" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className="h-full bg-leaf-400" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </section>
  );
}
