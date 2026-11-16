"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import { useCart } from "@/components/cart/CartProvider";
import { SearchOverlay } from "@/components/site/SearchOverlay";
import { money } from "@/lib/products";
import { useCatalog } from "@/lib/useCatalog";

const tail = [
  { href: "/nosotros", label: "Nosotros" },
  { href: "/diario", label: "Diario" },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function Header() {
  const { count, setOpen } = useCart();
  const { user } = useAccount();
  const catalog = useCatalog();
  const pathname = usePathname();
  const cats = catalog?.categories.filter((c) => c.count > 0) ?? [];
  const links = [{ href: "/tienda", label: "Tienda", mega: true }, ...tail.map((l) => ({ ...l, mega: false }))];

  const [menu, setMenu] = useState(false);
  const [mega, setMega] = useState(false);
  const [search, setSearch] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const close = () => setMenu(false);

  // En el inicio el header flota transparente sobre la foto; al bajar o en otras páginas es sólido
  const overHero = pathname === "/" && !scrolled && !mega;

  const openMega = () => {
    clearTimeout(closeTimer.current);
    setMega(true);
  };
  const closeMega = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMega(false), 140);
  }, []);

  // El menú se cierra al cambiar de página
  const [shownAt, setShownAt] = useState(pathname);
  if (shownAt !== pathname) {
    setShownAt(pathname);
    setMega(false);
    setMenu(false);
  }

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menu]);

  // Se esconde mientras lees hacia abajo y reaparece en cuanto subes
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      // En el inicio el header se mantiene transparente mientras el hero sigue a la vista
      setScrolled(y > (pathname === "/" ? window.innerHeight - 96 : 24));
      if (Math.abs(y - last) > 8) {
        setHidden(y > 240 && y > last);
        last = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  // Atajos: “/” y Ctrl/Cmd+K abren el buscador; Escape cierra el menú desplegable
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if ((e.key === "/" && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setSearch(true);
      }
      if (e.key === "Escape") setMega(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const featured = catalog?.products.find((p) => !p.comingSoon && p.image);
  const active = (href: string) => pathname.startsWith(href);
  const ico = "grid size-10 place-items-center rounded-full transition-colors hover:bg-ink-800/8";

  return (
    <>
      <header
        onMouseLeave={closeMega}
        className={`site-header fixed inset-x-0 top-0 z-50 transition-[transform,background-color,color,border-color] duration-500 ease-[var(--ease-out-expo)] ${hidden && !mega ? "-translate-y-full" : ""} ${
          overHero ? "border-b border-transparent bg-transparent text-white" : "border-b border-ink-800/5 bg-dew-50/65 text-ink-900 backdrop-blur-2xl backdrop-saturate-150"
        }`}
      >
        <div className="mx-auto grid h-[76px] max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-12">
          <Link href="/" className="flex shrink-0 items-center" aria-label="Alba Pura, productos orgánicos. Ir al inicio">
            <Image src="/img/logo.png" alt="" width={1000} height={704} priority className={`h-14 w-auto transition-opacity duration-300 ${overHero ? "hidden" : ""}`} />
            <Image src="/img/logo-light.png" alt="" width={1000} height={704} priority className={`h-14 w-auto transition-opacity duration-300 ${overHero ? "" : "hidden"}`} />
          </Link>

          <nav
            className={`hidden items-center gap-1 rounded-full border p-1 backdrop-blur-md transition-colors duration-500 lg:flex ${overHero ? "border-white/35 bg-white/10" : "border-ink-800/10 bg-white/55"}`}
            aria-label="Principal"
            onMouseLeave={() => setHover(null)}
          >
            {links.map((l) => {
              const lit = hover === l.href || (hover === null && active(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onMouseEnter={() => {
                    setHover(l.href);
                    if (l.mega) openMega();
                    else closeMega();
                  }}
                  onFocus={() => (l.mega ? openMega() : undefined)}
                  aria-expanded={l.mega ? mega : undefined}
                  aria-haspopup={l.mega ? "true" : undefined}
                  className={`relative rounded-full px-5 py-2 font-display text-[13px] font-medium uppercase tracking-[0.08em] transition-colors duration-300 ${lit ? (overHero ? "text-ink-900" : "text-dew-50") : ""}`}
                >
                  {lit && <m.span layoutId="nav-pill" className={`absolute inset-0 -z-10 rounded-full ${overHero ? "bg-white" : "bg-ink-800"}`} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-2">
            <div className={`flex items-center rounded-full px-1.5 py-1 transition-colors duration-500 ${overHero ? "bg-white text-ink-900" : "bg-ink-800 text-dew-50"}`}>
              <button onClick={() => setSearch(true)} className={`${ico} ${overHero ? "" : "hover:bg-white/15"}`} aria-label="Buscar productos">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </button>
              <span className="h-5 w-px bg-current opacity-20" aria-hidden="true" />
              <button onClick={() => setOpen(true)} className={`${ico} relative ${overHero ? "" : "hover:bg-white/15"}`} aria-label={`Abrir carrito, ${count} productos`}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
                <AnimatePresence initial={false}>
                  {count > 0 && (
                    <m.span key={count} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 26 }} className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-leaf-300 px-1 text-[11px] font-semibold leading-[18px] text-ink-900">
                      {count}
                    </m.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
            <Link href="/cuenta" aria-label={user ? `Mi cuenta, ${user.name}` : "Ingresar"} className="hidden h-12 items-center gap-2 rounded-full bg-leaf-300 px-5 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-900 transition-colors hover:bg-leaf-400 min-[480px]:inline-flex">
              {user?.picture && <Image src={user.picture} alt="" width={24} height={24} className="size-6 rounded-full object-cover" unoptimized />}
              {user ? user.name.split(" ")[0] : "Ingresar"}
            </Link>
            <button onClick={() => setMenu(true)} aria-label="Abrir menú" aria-expanded={menu} className={`${ico} lg:hidden`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16" /></svg>
            </button>
          </div>
        </div>

        {/* Menú desplegable de la tienda */}
        <AnimatePresence>
          {mega && (
            <m.div
              key="mega"
              className="absolute inset-x-0 top-full hidden overflow-hidden border-t border-ink-800/10 bg-dew-50 text-ink-900 shadow-[0_40px_80px_-40px_rgb(8_24_15/0.5)] lg:block"
              initial={{ clipPath: "inset(0 0 100% 0)" }}
              animate={{ clipPath: "inset(0 0 0% 0)" }}
              exit={{ clipPath: "inset(0 0 100% 0)" }}
              transition={{ duration: 0.45, ease }}
              onMouseEnter={openMega}
            >
              <div className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)_320px] gap-10 px-12 py-8">
                <ul className="grid grid-cols-4 gap-5">
                  {cats.map((c, i) => (
                    <m.li key={c.slug} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05, duration: 0.45, ease }}>
                      <Link href={`/categoria/${c.slug}`} className="group block">
                        <span className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-dew-100">
                          {c.image && <Image src={c.image} alt="" fill sizes="220px" className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.06]" />}
                        </span>
                        <span className="mt-3 block font-display text-[13px] font-medium uppercase tracking-[0.08em]">{c.name}</span>
                        <span className="block text-[14px] italic text-faint">{c.count} producto{c.count === 1 ? "" : "s"}</span>
                      </Link>
                    </m.li>
                  ))}
                </ul>
                <aside className="flex flex-col rounded-3xl bg-peach-100 p-5">
                  <p className="font-heading text-[22px] italic">Para empezar</p>
                  {featured ? (
                    <Link href={`/producto/${featured.slug}`} className="group mt-3 flex flex-1 flex-col">
                      <span className="relative block aspect-[5/4] overflow-hidden rounded-2xl bg-dew-100">
                        <Image src={featured.image!} alt="" fill sizes="300px" className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.06]" />
                      </span>
                      <span className="mt-3 flex items-baseline justify-between gap-3 font-display text-[13px] font-medium uppercase tracking-[0.06em]"><span>{featured.name}</span><span>{money(featured.price)}</span></span>
                      <span className="text-[14px] italic text-muted">{featured.meta}</span>
                    </Link>
                  ) : <div className="mt-3 flex-1 animate-pulse rounded-2xl bg-white/50" />}
                  <Link href="/tienda" className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-ink-800 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-dew-50 transition-colors hover:bg-ink-700">Ver toda la tienda</Link>
                </aside>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </header>

      <SearchOverlay open={search} onClose={() => setSearch(false)} catalog={catalog} />

      <AnimatePresence>
        {menu && (
          <m.div
            key="menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-dew-50 text-ink-900 lg:hidden"
            initial={{ clipPath: "circle(0% at calc(100% - 28px) 36px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 28px) 36px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 28px) 36px)" }}
            transition={{ duration: 0.55, ease }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-4">
              <Link href="/" onClick={close} aria-label="Alba Pura, ir al inicio"><Image src="/img/logo.png" alt="" width={1000} height={704} className="h-10 w-auto" /></Link>
              <button onClick={close} aria-label="Cerrar menú" className="grid size-11 place-items-center rounded-full hover:bg-ink-800/8">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <nav aria-label="Principal" className="flex flex-1 flex-col px-6 pb-10 pt-4">
              <ul className="grid gap-1">
                {[{ href: "/tienda", label: "Tienda" }, ...cats.map((c) => ({ href: `/categoria/${c.slug}`, label: c.name })), ...tail].map((l, i) => (
                  <m.li key={l.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.04, duration: 0.4, ease }}>
                    <Link href={l.href} onClick={close} className="block border-b border-line py-3 font-display text-[18px] font-medium uppercase tracking-[0.06em]">{l.label}</Link>
                  </m.li>
                ))}
              </ul>
              <div className="mt-6 grid gap-2.5 text-[17px]">
                <Link href="/cuenta" onClick={close} className="font-display font-medium">{user ? `Mi cuenta, ${user.name.split(" ")[0]}` : "Ingresar o crear cuenta"}</Link>
                {user?.role === "admin" && <Link href="/admin" onClick={close} className="font-display font-medium text-leaf-600">Administración</Link>}
                <Link href="/preguntas-frecuentes" onClick={close} className="text-muted">Preguntas frecuentes</Link>
                <Link href="/contacto" onClick={close} className="text-muted">Contacto</Link>
              </div>
            </nav>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
