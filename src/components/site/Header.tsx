"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import { useCart } from "@/components/cart/CartProvider";
import { useCatalog } from "@/lib/useCatalog";

const tail = [
  { href: "/nosotros", label: "Nosotros" },
  { href: "/diario", label: "Diario" },
];

/** Logotipo oficial. Hay una versión blanca para cuando el header va sobre el fondo oscuro del inicio. */
function Logo() {
  const size = "h-[4.25rem] w-auto sm:h-[5.5rem]";
  return (
    <Link href="/" className="flex shrink-0 items-center" aria-label="Alba Pura, productos orgánicos. Ir al inicio">
      <Image src="/img/logo.png" alt="" width={1000} height={704} priority className={`hdr-logo-dark ${size}`} />
      <Image src="/img/logo-light.png" alt="" width={1000} height={704} priority className={`hdr-logo-light ${size}`} />
    </Link>
  );
}

export function Header() {
  const { count, setOpen } = useCart();
  const { user } = useAccount();
  const catalog = useCatalog();
  // El menú sale de las categorías que cargas en el panel (las 3 primeras con productos)
  const links = [
    { href: "/tienda", label: "Tienda" },
    ...(catalog?.categories.filter((c) => c.count > 0).slice(0, 3).map((c) => ({ href: `/categoria/${c.slug}`, label: c.name })) ?? []),
    ...tail,
  ];

  const [menu, setMenu] = useState(false);
  const close = () => setMenu(false);
  const allCats = catalog?.categories.filter((c) => c.count > 0) ?? [];

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

  // En el Home el header se superpone al hero; al bajar vuelve a su estilo sólido (ver globals.css)
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 40) document.documentElement.dataset.scrolled = "";
      else delete document.documentElement.dataset.scrolled;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <header className="site-header fixed inset-x-0 top-0 z-50 border-b border-line bg-dew-50/90 text-ink-900 backdrop-blur-md">
      <div className="hdr-bar bg-ink-800 px-4 py-1.5 text-center font-display text-[12px] text-dew-100 sm:px-6 sm:text-[13px]">
        Estamos en fase de prueba: conoce los primeros productos de Alba Pura
      </div>
      <div className="mx-auto flex h-20 max-w-[1440px] items-center gap-4 px-4 sm:h-24 sm:gap-8 sm:px-6 lg:px-8 xl:px-20">
        <Logo />
        <nav className="ml-2 hidden flex-1 items-center gap-4 lg:flex xl:ml-4 xl:gap-6 2xl:ml-8 2xl:gap-8" aria-label="Principal">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap font-display text-[14px] font-medium opacity-90 transition-opacity hover:opacity-100 xl:text-[15px]">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/tienda" aria-label="Buscar" className="hidden rounded-full p-2.5 transition-colors hover:bg-current/10 min-[420px]:block">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </Link>
          {user?.role === "admin" && <Link href="/admin" className="hidden rounded-full px-3 py-2 font-display text-[14px] font-semibold transition-colors hover:bg-current/10 xl:inline-block">Administración</Link>}
          <Link href="/cuenta" aria-label={user ? `Mi cuenta, ${user.name}` : "Ingresar"} className="hidden rounded-full p-2.5 transition-colors hover:bg-current/10 min-[480px]:block">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="hdr-cart ml-1 flex h-11 items-center gap-2 rounded-full bg-ink-800 px-3.5 font-display text-[15px] font-semibold text-dew-50 transition-colors hover:bg-ink-700 sm:px-5"
            aria-label={`Abrir carrito, ${count} productos`}
          >
            <svg className="sm:hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
            <span className="hidden sm:inline">Carrito</span>
            <span className="grid min-w-6 place-items-center rounded-full bg-black/15 px-1.5 text-[13px]">{count}</span>
          </button>
          <button onClick={() => setMenu(true)} aria-label="Abrir menú" aria-expanded={menu} className="grid size-11 place-items-center rounded-full transition-colors hover:bg-current/10 lg:hidden">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16" /></svg>
          </button>
        </div>
      </div>
    </header>

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
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            <Link href="/" onClick={close} aria-label="Alba Pura, ir al inicio"><Image src="/img/logo.png" alt="" width={1000} height={704} className="h-10 w-auto" /></Link>
            <button onClick={close} aria-label="Cerrar menú" className="grid size-11 place-items-center rounded-full hover:bg-ink-800/8">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <nav aria-label="Principal" className="flex flex-1 flex-col px-6 pb-10 pt-4">
            <ul className="grid gap-1">
              {[{ href: "/tienda", label: "Tienda" }, ...allCats.map((c) => ({ href: `/categoria/${c.slug}`, label: c.name })), ...tail].map((l, i) => (
                <m.li key={l.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                  <Link href={l.href} onClick={close} className="block border-b border-line py-2.5 font-display text-[26px] font-medium tracking-[-0.03em]">{l.label}</Link>
                </m.li>
              ))}
            </ul>
            <div className="mt-6 grid gap-2.5 text-[17px]">
              <Link href="/tienda" onClick={close} className="font-display font-medium min-[420px]:hidden">Buscar productos</Link>
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
