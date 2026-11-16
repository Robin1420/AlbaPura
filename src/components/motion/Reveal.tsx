"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Hace aparecer su contenido al llegar a la pantalla. Lo que ya se ve al cargar queda como está
 * (sin parpadeo) y, sin JavaScript o con “reducir movimiento”, todo se ve normal.
 */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.classList.add("reveal");
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.in = "";
        io.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}
