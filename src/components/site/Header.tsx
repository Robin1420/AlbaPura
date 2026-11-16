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

const notices = [
  "Estamos en fase de prueba: conoce los primeros productos de Alba Pura",
  "Hecho en Lima, en pequeñas cantidades",
  "¿Dudas? Escríbenos por WhatsApp y te respondemos",
];

const ease = [0.22, 1, 0.36, 1] as const;

/** Franja superior con mensajes que rotan solos. */
function Ticker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % notices.length), 4200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hdr-ticker overflow-hidden bg-ink-800 text-dew-100" role="status" aria-live="off">
      <div className="relative mx-auto h-8 max-w-[1440px] px-4 text-center font-display text-[12px] sm:text-[13px]">
        <AnimatePresence mode="wait" initial={false}>
          <m.p key={i} className="absolute inset-x-4 top-0 flex h-8 items-center justify-center" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.4, ease }}>
            <span className="mr-2 inline-block size-1.5 rounded-full bg-leaf-400" aria-hidden="true" />
            <span className="truncate">{notices[i]}</span>
          </m.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

const iconBtn = "grid size-11 place-items-center rounded-full transition-colors hover:bg-ink-800/8";

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
  const [hover, setHover] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const close = () => setMenu(false);

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

  // La barra se encoge al bajar y se esconde mientras lees; reaparece en cuanto subes
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setCompact(y > 24);
      if (Math.abs(y - last) > 8) {
        setHidden(y > 240 && y > last);
        last = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className={`site-header fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-[var(--ease-out-expo)] ${hidden && !mega ? "-translate-y-full" : ""}`}>
        <div className={`hdr-ticker-wrap grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)] ${compact ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}>
          <div className="overflow-hidden"><Ticker /></div>
        </div>

        <div className="mx-auto max-w-[1360px] px-3 pt-3 sm:px-5">
          <div
            className={`relative flex items-center gap-2 rounded-full border border-ink-800/10 bg-dew-50/80 pl-4 pr-2 shadow-[0_14px_40px_-22px_rgb(8_24_15/0.55)] backdrop-blur-xl transition-[height] duration-500 ease-[var(--ease-out-expo)] sm:pl-6 ${compact ? "h-[60px]" : "h-[68px] sm:h-[76px]"}`}
            onMouseLeave={() => {
              setHover(null);
              closeMega();
            }}
          >
            <Link href="/" className="flex shrink-0 items-center" aria-label="Alba Pura, productos orgánicos. Ir al inicio">
              <Image src="/img/logo.png" alt="" width={1000} height={704} priority className={`w-auto transition-[height] duration-500 ease-[var(--ease-out-expo)] ${compact ? "h-12" : "h-12 sm:h-14"}`} />
            </Link>

            <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Principal">
              {links.map((l) => (
                <div key={l.href} className="relative" onMouseEnter={() => (l.mega ? openMega() : (closeMega(), undefined))}>
                  <Link
                    href={l.href}
                    onMouseEnter={() => setHover(l.href)}
                    onFocus={() => (l.mega ? openMega() : undefined)}
                    aria-expanded={l.mega ? mega : undefined}
                    aria-haspopup={l.mega ? "true" : undefined}
                    className="relative z-10 flex items-center gap-1.5 rounded-full px-5 py-2.5 font-display text-[15px] font-medium"
                  >
                    {hover === l.href && <m.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-ink-800/8" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                    {l.label}
                    {l.mega && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform duration-300 ${mega ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>}
                    {active(l.href) && <span className="absolute inset-x-5 -bottom-0.5 h-[2px] rounded-full bg-leaf-600" aria-hidden="true" />}
                  </Link>
                </div>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
              <button onClick={() => setSearch(true)} className="hidden h-11 items-center gap-2.5 rounded-full border border-ink-800/10 bg-white/60 pl-4 pr-3 text-[15px] text-faint transition-colors hover:border-ink-800/30 hover:bg-white xl:flex" aria-label="Buscar productos">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                Buscar
                <kbd className="rounded-md border border-line bg-dew-50 px-1.5 font-display text-[12px] text-muted">/</kbd>
              </button>
              <button onClick={() => setSearch(true)} className={`${iconBtn} xl:hidden`} aria-label="Buscar productos">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </button>
              {user?.role === "admin" && <Link href="/admin" className="hidden rounded-full px-3 py-2 font-display text-[14px] font-semibold transition-colors hover:bg-ink-800/8 2xl:inline-block">Administración</Link>}
              <Link href="/cuenta" aria-label={user ? `Mi cuenta, ${user.name}` : "Ingresar"} className={`${iconBtn} hidden min-[480px]:grid`}>
                {user?.picture ? (
                  <Image src={user.picture} alt="" width={30} height={30} className="size-[30px] rounded-full object-cover" unoptimized />
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                )}
              </Link>
              <button onClick={() => setOpen(true)} className="ml-1 flex h-11 items-center gap-2.5 rounded-full bg-ink-800 pl-4 pr-1.5 font-display text-[15px] font-semibold text-dew-50 transition-colors hover:bg-ink-700 sm:pl-5" aria-label={`Abrir carrito, ${count} productos`}>
                <span className="hidden sm:inline">Carrito</span>
                <svg className="sm:hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
                <span className="relative grid size-8 place-items-center overflow-hidden rounded-full bg-leaf-300 text-[14px] text-ink-900">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <m.span key={count} initial={{ y: 18, scale: 0.6, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: -18, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}>{count}</m.span>
                  </AnimatePresence>
                </span>
              </button>
              <button onClick={() => setMenu(true)} aria-label="Abrir menú" aria-expanded={menu} className={`${iconBtn} lg:hidden`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16" /></svg>
              </button>
            </div>

            {/* Menú desplegable de la tienda */}
            <AnimatePresence>
              {mega && (
                <m.div
                  key="mega"
                  className="absolute inset-x-0 top-[calc(100%+10px)] hidden overflow-hidden rounded-[32px] border border-ink-800/10 bg-dew-50 shadow-[0_40px_80px_-30px_rgb(8_24_15/0.55)] lg:block"
                  initial={{ opacity: 0, y: -10, clipPath: "inset(0 0 100% 0 round 32px)" }}
                  animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0 round 32px)" }}
                  exit={{ opacity: 0, y: -6, clipPath: "inset(0 0 100% 0 round 32px)" }}
                  transition={{ duration: 0.45, ease }}
                  onMouseEnter={openMega}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-8 p-7">
                    <div>
                      <p className="mb-4 text-[15px] italic text-faint">Elige tu línea</p>
                      <ul className="grid grid-cols-4 gap-4">
                        {cats.map((c, i) => (
                          <m.li key={c.slug} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05, duration: 0.45, ease }}>
                            <Link href={`/categoria/${c.slug}`} className="group block">
                              <span className="relative block aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-xl bg-dew-100 transition-[border-radius] duration-500 group-hover:rounded-t-[40px]">
                                {c.image && <Image src={c.image} alt="" fill sizes="200px" className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.07]" />}
                              </span>
                              <span className="mt-2 block font-display text-[16px] font-medium leading-tight">{c.name}</span>
                              <span className="block text-[13px] italic text-faint">{c.count} producto{c.count === 1 ? "" : "s"}</span>
                            </Link>
                          </m.li>
                        ))}
                      </ul>
                    </div>
                    <aside className="flex flex-col rounded-3xl bg-dawn p-5">
                      <p className="text-[15px] italic text-muted">Para empezar</p>
                      {featured ? (
                        <Link href={`/producto/${featured.slug}`} className="group mt-3 flex flex-1 flex-col">
                          <span className="relative block aspect-[5/4] overflow-hidden rounded-t-full rounded-b-2xl bg-dew-100">
                            <Image src={featured.image!} alt="" fill sizes="280px" className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.06]" />
                          </span>
                          <span className="mt-3 font-display text-[18px] font-medium leading-tight">{featured.name}</span>
                          <span className="text-[14px] italic text-faint">{featured.meta}</span>
                          <span className="mt-auto flex items-center justify-between pt-3">
                            <span className="font-display text-[20px] font-medium">{money(featured.price)}</span>
                            <span className="font-display text-[14px] font-semibold underline underline-offset-4">Ver producto</span>
                          </span>
                        </Link>
                      ) : <div className="mt-3 flex-1 animate-pulse rounded-2xl bg-white/50" />}
                      <Link href="/tienda" className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-ink-800 font-display text-[15px] font-semibold text-dew-50 transition-colors hover:bg-ink-700">Ver toda la tienda</Link>
                    </aside>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
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
                    <Link href={l.href} onClick={close} className="block border-b border-line py-2.5 font-display text-[26px] font-medium tracking-[-0.03em]">{l.label}</Link>
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
