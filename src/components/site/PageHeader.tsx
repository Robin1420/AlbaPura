import type { ReactNode } from "react";
import { Heading } from "@/components/ui/Mix";

/** Cabecera de página: fondo amanecer y título en dos voces (sans + serif cursiva), igual que las secciones del inicio. */
export function PageHeader({ title, children, crumbs, screen }: { title: string; children?: ReactNode; /** Ruta de migas de pan, encima del título. */ crumbs?: ReactNode; screen?: boolean }) {
  return (
    <header className={`bg-dawn grain ${screen ? "screen pb-10 pt-32 sm:pb-14 sm:pt-40 md:pb-0 md:pt-0" : "pb-12 pt-32 sm:pb-16 sm:pt-40"}`}>
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-20">
        {crumbs && <nav aria-label="Ruta" className="mb-4 text-[15px] italic text-faint">{crumbs}</nav>}
        <Heading as="h1" className="max-w-[20ch] text-[clamp(38px,min(7vw,12svh),96px)] text-ink-800">{title}</Heading>
        {children && <div className="mt-5 max-w-[52ch] text-[clamp(17px,2.6svh,21px)] text-muted">{children}</div>}
      </div>
    </header>
  );
}
