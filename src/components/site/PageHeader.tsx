import type { ReactNode } from "react";
import { Mix } from "@/components/ui/Mix";
import { Wave } from "@/components/ui/Wave";

/** Cabecera de página: título en dos voces (sans + serif cursiva) sobre el fondo amanecer, con borde orgánico al pasar al contenido. */
export function PageHeader({ title, children, screen }: { title: string; children?: ReactNode; screen?: boolean }) {
  const words = title.split(" ");
  const last = words.pop() ?? title;
  const parts = words.length ? [{ t: words.join(" ") }, { t: last, italic: true }] : [{ t: last, italic: true }];
  return (
    <>
      <header className={`bg-dawn grain ${screen ? "screen pb-10 pt-32 sm:pb-14 sm:pt-40 md:pb-0 md:pt-0" : "pt-32 sm:pt-40"}`}>
        <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-20">
          <Mix as="h1" caps={false} className="max-w-[20ch] text-[clamp(38px,min(7vw,12svh),96px)] text-ink-800" parts={parts} />
          {children && <div className="mt-5 max-w-[52ch] text-[clamp(17px,2.6svh,21px)] text-muted">{children}</div>}
        </div>
        {!screen && <div className="mt-10 sm:mt-14"><Wave bg="" fill="text-dew-50" /></div>}
      </header>
    </>
  );
}
