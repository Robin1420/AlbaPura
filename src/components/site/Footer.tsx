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
    <footer className="relative mt-20 overflow-hidden sm:mt-32 bg-ink-900 text-dew-100">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-6 gap-y-9 px-5 pb-8 pt-14 sm:grid-cols-3 sm:gap-x-10 sm:gap-y-12 sm:px-6 sm:pb-10 sm:pt-20 xl:grid-cols-[1.3fr_1fr_1fr_1fr_1.3fr] xl:gap-14 lg:px-20">
        <div className="col-span-2 max-w-sm sm:col-span-3 xl:col-span-1 xl:max-w-xs">
          <Image src="/img/logo-light.png" alt="Alba Pura, productos orgánicos" width={1000} height={704} className="h-20 w-auto sm:h-28" />
          <p className="mt-3 text-[16px] text-dew-200/80 sm:text-[17px]">Productos orgánicos hechos en Lima. Cuidamos tu piel y el medio ambiente.</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="font-display text-[15px] font-medium italic text-leaf-300" style={{ fontFamily: "var(--font-text)" }}>{c.title}</p>
            <ul className="mt-2 grid gap-0 sm:mt-3 sm:gap-0.5">
              {c.links.map(([label, href]) => (
                <li key={label}><Link href={href} className="inline-block py-1.5 text-[15px] text-dew-200/85 hover:text-white sm:py-2 sm:text-[17px]">{label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="col-span-2 sm:col-span-3 sm:max-w-md xl:col-span-1 xl:max-w-none"><NewsletterForm /></div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-2 border-t border-white/12 px-5 py-5 text-[13px] sm:gap-3 sm:px-6 sm:py-6 sm:text-[14px] italic text-dew-200/60 lg:px-20">
        <span>© 2026 Alba Pura. Lima, Perú.</span>
        <span>Pago con tarjeta, Yape o QR</span>
      </div>
      <p aria-hidden className="pointer-events-none select-none whitespace-nowrap text-center font-[family-name:var(--font-heading)] text-[min(14vw,240px)] font-medium uppercase leading-[0.8] tracking-[0.06em] text-white/[0.05] translate-y-[8%]">
        ALBA PURA
      </p>
    </footer>
  );
}
