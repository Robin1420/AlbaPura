"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import { ButtonLink } from "@/components/ui/Button";

const icon = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const nav = [
  { href: "/admin", label: "Resumen", icon: icon("M4 13h6V4H4v9Zm0 7h6v-3H4v3Zm10 0h6v-9h-6v9Zm0-16v3h6V4h-6Z") },
  { href: "/admin/pedidos", label: "Pedidos", icon: icon("M6 7h12l-1 13H7L6 7Zm3 0a3 3 0 0 1 6 0") },
  { href: "/admin/productos", label: "Productos", icon: icon("M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 9L4 7m8 5 8-5m-8 5v9") },
  { href: "/admin/categorias", label: "Categorías", icon: icon("M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 3.5a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0Z") },
  { href: "/admin/etiquetas", label: "Etiquetas", icon: icon("M3 12V4h8l9 9-8 8-9-9Zm5-4.5a.5.5 0 1 0 0-.01") },
  { href: "/admin/imagenes", label: "Imágenes", icon: icon("M4 5h16v14H4V5Zm0 11 4-4 3 3 4-5 5 6M9 9.5a1 1 0 1 0 0-.01") },
  { href: "/admin/mensajes", label: "Mensajes", icon: icon("M4 6h16v12H4V6Zm0 0 8 7 8-7") },
  { href: "/admin/suscriptores", label: "Suscriptores", icon: icon("M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-3A3.5 3.5 0 0 0 6 17.5V19m6-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z") },
];

/** Menú lateral. Está aparte porque usePathname necesita su propio Suspense en rutas dinámicas. */
function AdminNav() {
  const pathname = usePathname();
  return (
    <>
      {nav.map((n) => {
        const on = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-display text-[15px] font-medium transition-colors ${on ? "bg-leaf-400 text-ink-900" : "text-dew-100/85 hover:bg-white/10"}`}>
            {n.icon}
            {n.label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { ready, user, logout } = useAccount();

  if (!ready) return <div className="min-h-screen" aria-busy="true" />;

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl px-6 py-32">
        <h1 className="text-[44px] font-semibold tracking-[-0.04em]">Administración</h1>
        <p className="mt-4 text-[19px] text-muted">
          {user ? "Tu cuenta no tiene permiso para entrar a este panel." : "Ingresa con una cuenta de administración para continuar."}
        </p>
        <div className="mt-8 flex gap-3">
          {!user && <ButtonLink href="/cuenta/ingresar">Ingresar</ButtonLink>}
          <ButtonLink href="/" variant="secondary">Volver a la tienda</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-3 bg-ink-900 p-4 text-dew-100 lg:sticky lg:top-0 lg:h-screen lg:gap-8 lg:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-dew-50 text-ink-800" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14Z" /><path d="M5 19 13 11" /></svg>
          </span>
          <div>
            <p className="font-display text-[20px] font-semibold leading-none tracking-[-0.03em]">Alba Pura</p>
            <p className="mt-1 text-[14px] italic text-dew-200/60">Administración</p>
          </div>
        </div>
        <nav aria-label="Administración" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden [&>*]:shrink-0">
          <Suspense fallback={nav.map((n) => <Link key={n.href} href={n.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-display text-[15px] font-medium hover:bg-white/10">{n.icon}{n.label}</Link>)}>
            <AdminNav />
          </Suspense>
        </nav>
        <div className="flex items-center gap-4 text-[15px] lg:mt-auto lg:grid lg:gap-2">
          <p className="hidden truncate text-dew-200/70 lg:block">{user.email}</p>
          <Link href="/" className="underline-offset-4 hover:underline">Ver la tienda</Link>
          <button onClick={() => void logout()} className="w-fit underline-offset-4 hover:underline">Cerrar sesión</button>
        </div>
      </aside>
      <main className="min-w-0 bg-dew-50 px-4 py-8 sm:px-6 lg:px-12 lg:py-10">{children}</main>
    </div>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="text-[clamp(32px,4vw,48px)] font-semibold tracking-[-0.04em]">{children}</h1>
      {sub && <p className="mt-1 text-[18px] text-muted">{sub}</p>}
    </header>
  );
}

export function Loading({ error }: { error?: string }) {
  return <p className={`py-10 text-[18px] italic ${error ? "text-danger" : "text-faint"}`} role={error ? "alert" : "status"}>{error ?? "Cargando…"}</p>;
}
