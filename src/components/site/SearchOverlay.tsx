"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { money, type Catalog } from "@/lib/products";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Buscador a pantalla completa: escribe y ve los productos al instante. Se abre también con “/” o Ctrl+K. */
export function SearchOverlay({ open, onClose, catalog }: { open: boolean; onClose: () => void; catalog: Catalog | null }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const term = norm(q.trim());
    if (!catalog || !term) return [];
    return catalog.products.filter((p) => norm(`${p.name} ${p.category} ${p.meta} ${p.description}`).includes(term)).slice(0, 6);
  }, [catalog, q]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 60);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => {
    setQ("");
    setActive(0);
    onClose();
  };

  const go = (href: string) => {
    close();
    router.push(href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return close();
    if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length) {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      const hit = results[active];
      go(hit ? `/producto/${hit.slug}` : "/tienda");
    }
  };

  const cats = catalog?.categories.filter((c) => c.count > 0) ?? [];

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="search"
          role="dialog"
          aria-modal="true"
          aria-label="Buscar productos"
          className="fixed inset-0 z-[70] flex items-start justify-center bg-ink-900/55 px-4 pt-[10svh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
          onKeyDown={onKey}
        >
          <m.div
            className="w-full max-w-[680px] overflow-hidden rounded-[28px] bg-dew-50 shadow-[0_40px_90px_-30px_rgb(8_24_15/0.6)]"
            initial={{ y: -24, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-leaf-600"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input
                ref={input}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                placeholder="Busca jabón, miel, infusión…"
                aria-label="Buscar productos"
                className="h-16 w-full bg-transparent font-display text-[19px] outline-none focus-visible:outline-none placeholder:text-faint"
              />
              <button onClick={close} className="shrink-0 rounded-full border border-line px-3 py-1 font-display text-[12px] text-muted hover:bg-dew-100">Esc</button>
            </div>

            <div className="max-h-[58svh] overflow-y-auto p-3">
              {q.trim() === "" ? (
                <div className="p-3">
                  <p className="text-[15px] italic text-faint">Explora por categoría</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cats.map((c) => (
                      <Link key={c.slug} href={`/categoria/${c.slug}`} onClick={close} className="rounded-full border border-line bg-white px-4 py-2 font-display text-[15px] font-medium transition-colors hover:border-ink-800 hover:bg-ink-800 hover:text-dew-50">
                        {c.name}
                      </Link>
                    ))}
                    <Link href="/tienda" onClick={close} className="rounded-full bg-leaf-300 px-4 py-2 font-display text-[15px] font-medium transition-colors hover:bg-leaf-400">Ver toda la tienda</Link>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <p className="p-5 text-[17px] text-muted">No encontramos “{q.trim()}”. Prueba con otra palabra o <Link href="/tienda" onClick={close} className="underline underline-offset-4">mira toda la tienda</Link>.</p>
              ) : (
                <ul>
                  {results.map((p, i) => (
                    <li key={p.slug}>
                      <Link
                        href={`/producto/${p.slug}`}
                        onClick={close}
                        onMouseEnter={() => setActive(i)}
                        className={`flex items-center gap-4 rounded-2xl p-2.5 transition-colors ${i === active ? "bg-dew-100" : ""}`}
                      >
                        <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-dew-100">
                          {p.image && <Image src={p.image} alt="" fill sizes="64px" className="object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-[17px] font-medium">{p.name}</span>
                          <span className="block truncate text-[14px] italic text-faint">{p.category} · {p.meta}</span>
                        </span>
                        <span className="font-display text-[16px] font-medium">{p.comingSoon ? "Próximamente" : money(p.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="border-t border-line px-5 py-2.5 text-[13px] italic text-faint">↑ ↓ para moverte · Enter para abrir · / para buscar desde cualquier página</p>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
