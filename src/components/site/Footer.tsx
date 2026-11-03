import Image from "next/image";
import Link from "next/link";
import { getCatalog } from "@/server/catalog";
import { NewsletterForm } from "./NewsletterForm";

const staticCols = [
  { title: "Ayuda", links: [["Envíos y entregas", "/preguntas-frecuentes#Envíos"], ["Cambios y devoluciones", "/preguntas-frecuentes#Devoluciones"], ["Preguntas frecuentes", "/preguntas-frecuentes"], ["Contacto", "/contacto"]] },
  { title: "Alba Pura", links: [["Nuestra historia", "/nosotros"], ["Diario", "/diario"]] },
];

export async function Footer() {
  const { categories } = await getCatalog();
  const cols = [
    { title: "Tienda", links: [...categories.filter((c) => c.count > 0).map((c) => [c.name, `/categoria/${c.slug}`]), ["Todo", "/tienda"]] },
    ...staticCols,
  ];
  return (
    <footer className="relative mt-32 overflow-hidden bg-ink-900 text-dew-100">
      <div className="mx-auto grid max-w-[1440px] gap-x-10 gap-y-12 px-6 pb-10 pt-20 sm:grid-cols-3 xl:grid-cols-[1.3fr_1fr_1fr_1fr_1.3fr] xl:gap-14 lg:px-20">
        <div className="max-w-sm sm:col-span-3 xl:col-span-1 xl:max-w-xs">
          <Image src="/img/logo-light.png" alt="Alba Pura, productos orgánicos" width={1000} height={704} className="h-28 w-auto" />
          <p className="mt-3 text-[17px] text-dew-200/80">Productos orgánicos hechos en Lima. Cuidamos tu piel y el medio ambiente.</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="font-display text-[15px] font-medium italic text-leaf-300" style={{ fontFamily: "var(--font-text)" }}>{c.title}</p>
            <ul className="mt-3 grid gap-0.5">
              {c.links.map(([label, href]) => (
                <li key={label}><Link href={href} className="inline-block py-2 text-[17px] text-dew-200/85 hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="sm:col-span-3 sm:max-w-md xl:col-span-1 xl:max-w-none"><NewsletterForm /></div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-3 border-t border-white/12 px-6 py-6 text-[14px] italic text-dew-200/60 lg:px-20">
        <span>© 2026 Alba Pura. Lima, Perú.</span>
        <span>Pago por transferencia, Yape o Plin</span>
      </div>
      <p aria-hidden className="pointer-events-none select-none whitespace-nowrap text-center font-[family-name:var(--font-heading)] text-[min(14vw,240px)] font-medium uppercase leading-[0.8] tracking-[0.06em] text-white/[0.05] translate-y-[8%]">
        ALBA PURA
      </p>
    </footer>
  );
}
