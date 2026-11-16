import type { ReactNode } from "react";

/** Cabecera de página. Con `screen` ocupa una pantalla completa (para páginas de secciones grandes). */
export function PageHeader({ title, children, screen }: { title: string; children?: ReactNode; screen?: boolean }) {
  return (
    <header className={`bg-dawn grain ${screen ? "screen pb-10 pt-36 sm:pb-14 sm:pt-44 md:pb-0 md:pt-0" : "pb-10 pt-36 sm:pb-14 sm:pt-44"}`}>
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-20">
        <h1 className="max-w-[18ch] text-[clamp(34px,min(7vw,12svh),96px)] font-semibold tracking-[-0.04em]">{title}</h1>
        {children && <div className="mt-5 max-w-[52ch] text-[clamp(17px,2.6svh,21px)] text-muted">{children}</div>}
      </div>
    </header>
  );
}
