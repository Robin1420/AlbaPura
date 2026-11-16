"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** Carril horizontal de productos: se arrastra con el mouse, se desliza con el dedo y tiene flechas y progreso. */
export function ProductRail({ children }: { children: ReactNode }) {
  const track = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [progress, setProgress] = useState(0);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft > max - 4 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const by = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });

  const down = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !track.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 5) d.moved = true;
    if (d.moved) {
      track.current.style.scrollSnapType = "none";
      track.current.scrollLeft = d.left - dx;
    }
  };
  const up = () => {
    if (track.current) track.current.style.scrollSnapType = "";
    // Si se arrastró, el clic que sigue no debe abrir un producto
    const wasDrag = drag.current?.moved;
    drag.current = null;
    if (wasDrag) {
      const stop = (ev: Event) => ev.stopPropagation();
      window.addEventListener("click", stop, { capture: true, once: true });
    }
  };

  const arrow = "grid size-12 place-items-center rounded-full border border-ink-800/25 transition-colors hover:bg-ink-800 hover:text-dew-50 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div>
      <ul
        ref={track}
        onScroll={measure}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        onDragStart={(e) => e.preventDefault()}
        className="rail scroll-px-5 sm:scroll-px-6 lg:scroll-px-20 -mx-5 flex cursor-grab gap-5 overflow-x-auto px-5 pb-2 active:cursor-grabbing sm:-mx-6 sm:gap-8 sm:px-6 lg:-mx-20 lg:px-20"
      >
        {Children.map(children, (c) => (
          <li className="w-[70%] shrink-0 select-none sm:w-[42%] lg:w-[calc(25%-1.5rem)]">{c}</li>
        ))}
      </ul>
      <div className="mt-6 flex items-center gap-5">
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-ink-800/15" aria-hidden="true">
          <div className="h-full w-full origin-left rounded-full bg-ink-800 transition-transform duration-200" style={{ transform: `scaleX(${Math.max(0.12, progress)})` }} />
        </div>
        <div className="hidden gap-2 sm:flex">
          <button onClick={() => by(-1)} disabled={edge.start} className={arrow} aria-label="Productos anteriores">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button onClick={() => by(1)} disabled={edge.end} className={arrow} aria-label="Productos siguientes">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
