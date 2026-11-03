"use client";

import { AnimatePresence, LayoutGroup, m } from "motion/react";
import { useId, useMemo, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Category, Product } from "@/lib/products";

type Sort = "relevance" | "price-asc" | "price-desc" | "rating";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Catalog({ initialCategory, products, categories }: { initialCategory?: string; products: Product[]; categories: Category[] }) {
  const cats = [{ slug: "", name: "Todo", count: products.length }, ...categories.filter((c) => c.count > 0)];
  const [cat, setCat] = useState(categories.some((c) => c.slug === initialCategory) ? (initialCategory as string) : "");
  const [sort, setSort] = useState<Sort>("relevance");
  const [query, setQuery] = useState("");
  const [onSale, setOnSale] = useState(false);
  const group = useId();

  const list = useMemo(() => {
    let base = cat === "" ? products : products.filter((p) => p.categorySlug === cat);
    if (onSale) base = base.filter((p) => p.oldPrice);
    const q = norm(query.trim());
    if (q) base = base.filter((p) => norm(`${p.name} ${p.meta} ${p.category} ${p.latin ?? ""}`).includes(q));
    const sorted = [...base];
    const price = (p: Product) => (p.comingSoon ? Number.POSITIVE_INFINITY : p.price);
    if (sort === "price-asc") sorted.sort((a, b) => price(a) - price(b));
    if (sort === "price-desc") sorted.sort((a, b) => (a.comingSoon ? 1 : 0) - (b.comingSoon ? 1 : 0) || b.price - a.price);
    if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
    return sorted;
  }, [cat, sort, query, onSale, products]);

  const clear = () => {
    setCat("");
    setQuery("");
    setOnSale(false);
  };

  return (
    <div>
      <div className="border-y border-line py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LayoutGroup id={group}>
            <div role="tablist" aria-label="Categorías" className="-mx-6 flex gap-1 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {cats.map((c) => (
                <button key={c.slug} role="tab" aria-selected={cat === c.slug} onClick={() => setCat(c.slug)} className={`relative shrink-0 rounded-full px-4 py-2 font-display text-[15px] font-medium transition-colors ${cat === c.slug ? "text-dew-50" : "hover:bg-ink-800/8"}`}>
                  {cat === c.slug && <m.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-ink-800" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                  <span className="relative">{c.name}<span className={`ml-1.5 text-[12px] ${cat === c.slug ? "text-dew-200/70" : "text-faint"}`}>{c.count}</span></span>
                </button>
              ))}
            </div>
          </LayoutGroup>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <label className="relative min-w-0 flex-1 sm:flex-none">
              <span className="sr-only">Buscar en la tienda</span>
              <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar" className="h-10 w-full rounded-full border border-line bg-white/70 pl-10 pr-4 font-display text-[15px] outline-none transition-[width] duration-300 focus:ring-2 focus:ring-leaf-500/50 sm:w-40 sm:focus:w-56" />
            </label>
            <button aria-pressed={onSale} onClick={() => setOnSale((v) => !v)} className={`h-10 rounded-full border px-4 font-display text-[15px] font-medium transition-colors ${onSale ? "border-ink-800 bg-ink-800 text-dew-50" : "border-line bg-white/70 hover:border-line-strong"}`}>En oferta</button>
            <label className="sr-only" htmlFor="sort">Ordenar por</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 min-w-0 flex-1 rounded-full border border-line bg-white/70 px-4 font-display text-[15px] text-ink-900 sm:flex-none">
              <option value="relevance">Más vendidos</option>
              <option value="price-asc">Precio, de menor a mayor</option>
              <option value="price-desc">Precio, de mayor a menor</option>
              <option value="rating">Mejor valorados</option>
            </select>
          </div>
        </div>
      </div>

      <p className="mt-6 text-[15px] italic text-faint" aria-live="polite">Mostrando {list.length} de {products.length} productos</p>

      <m.div layout className="mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((p, i) => (
            <m.div key={p.slug} layout="position" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <ProductCard product={p} priority={i < 3} as="h2" />
            </m.div>
          ))}
        </AnimatePresence>
      </m.div>

      {list.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-display text-[28px] font-medium">No encontramos productos con esos filtros.</p>
          <button onClick={clear} className="mt-4 font-display text-[17px] underline underline-offset-4">Quitar filtros</button>
        </div>
      )}
    </div>
  );
}
