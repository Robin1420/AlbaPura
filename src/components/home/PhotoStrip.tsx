import Image from "next/image";
import Link from "next/link";

export type StripTile = { slug: string; name: string; image?: string };

/** Franja de fotos de las líneas, de borde a borde, justo debajo de la portada. */
export function PhotoStrip({ tiles }: { tiles: StripTile[] }) {
  return (
    <ul className="grid grid-cols-2 bg-dew-50 md:grid-cols-4" aria-label="Líneas de productos">
      {tiles.map((t) => (
        <li key={t.slug} className="group relative">
          <Link href={`/categoria/${t.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-dew-100 md:aspect-auto md:h-[clamp(240px,36svh,380px)]" aria-label={t.name}>
            {t.image && <Image src={t.image} alt="" fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]" />}
            <span className="absolute inset-0 bg-gradient-to-t from-ink-900/55 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 font-display text-[12px] font-medium uppercase tracking-[0.1em] text-white">
              {t.name}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 -translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
