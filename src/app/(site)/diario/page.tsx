import type { Metadata } from "next";
import Link from "next/link";
import { ProductArt } from "@/components/product/ProductArt";
import { PageHeader } from "@/components/site/PageHeader";
import { formatDate, posts } from "@/lib/content";

export const metadata: Metadata = {
  alternates: { canonical: "/diario" },
  title: "Diario",
  description: "Artículos sobre cuidado de la piel, ingredientes y medio ambiente.",
};

export default function Diario() {
  const [featured, ...rest] = posts;
  return (
    <>
      <PageHeader title="Ciencia simple para cuidarte">
        <p>Artículos sobre ingredientes, piel y medio ambiente.</p>
      </PageHeader>

      <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-20">
        <article className="group grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Link href={`/diario/${featured.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-dew-100" aria-label={featured.title}>
            <ProductArt product={{ image: featured.image, art: featured.art, name: featured.title }} sizes="(min-width:1024px) 55vw, 100vw" priority />
          </Link>
          <div>
            <p className="text-[17px] italic text-leaf-600">{featured.topic}, {formatDate(featured.date)}</p>
            <h2 className="mt-3 text-[clamp(32px,4vw,52px)]"><Link href={`/diario/${featured.slug}`} className="hover:underline underline-offset-4 decoration-1">{featured.title}</Link></h2>
            <p className="mt-4 max-w-[46ch] text-[20px] text-muted">{featured.excerpt}</p>
            <p className="mt-4 text-[16px] italic text-faint">{featured.minutes} min de lectura</p>
          </div>
        </article>

        <div className="mt-20 grid gap-x-8 gap-y-14 border-t border-line pt-14 md:grid-cols-3">
          {rest.map((p) => (
            <article key={p.slug} className="group">
              <Link href={`/diario/${p.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-dew-100" aria-label={p.title}>
                <ProductArt product={{ image: p.image, art: p.art, name: p.title }} sizes="(min-width:768px) 30vw, 100vw" />
              </Link>
              <p className="mt-5 text-[16px] italic text-leaf-600">{p.topic}</p>
              <h3 className="mt-1 text-[26px]"><Link href={`/diario/${p.slug}`} className="hover:underline underline-offset-4 decoration-1">{p.title}</Link></h3>
              <p className="mt-2 text-[18px] text-muted">{p.excerpt}</p>
              <p className="mt-3 text-[15px] italic text-faint">{formatDate(p.date)}, {p.minutes} min de lectura</p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
