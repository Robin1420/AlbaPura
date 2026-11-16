import type { Metadata } from "next";
import Link from "next/link";
import { HeroFull } from "@/components/hero/HeroFull";
import { CollectionRow } from "@/components/home/CollectionRow";
import { PhotoStrip } from "@/components/home/PhotoStrip";
import { Philosophy } from "@/components/home/Philosophy";
import { Reveal } from "@/components/motion/Reveal";
import { Mix } from "@/components/ui/Mix";
import { ParallaxArch } from "@/components/motion/ParallaxArch";
import { ProductArt } from "@/components/product/ProductArt";
import { JsonLd } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { formatDate, posts } from "@/lib/content";
import { SITE } from "@/lib/site";
import { getCatalog } from "@/server/catalog";

export const metadata: Metadata = {
  title: { absolute: "Alba Pura | Productos orgánicos en Lima, Perú" },
  description: "Productos orgánicos hechos en Lima: jabones, bálsamo, aceite, miel e infusiones para cuidar tu piel y el medio ambiente.",
  alternates: { canonical: "/" },
};

const siteData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    email: SITE.email,
    address: { "@type": "PostalAddress", addressLocality: SITE.city, addressCountry: "PE" },
    areaServed: { "@type": "City", name: SITE.city },
  },
  { "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.url, inLanguage: "es-PE" },
];

const proof = [
  ["Pensado para tu piel", "Ingredientes de origen natural"],
  ["Hecho en Lima", "Producción local, en pequeñas cantidades"],
  ["Respeto por el medio ambiente", "Procesos y empaques pensados para dañar menos"],
  ["Atención cercana", "Te respondemos antes y después de tu pedido"],
];

const principles = [
  ["Para tu piel", "Elegimos ingredientes de origen natural y evitamos los que más suelen afectarla."],
  ["Para el consumo humano", "Lo que usas en tu piel o llevas a tu mesa no debería hacerte daño."],
  ["Para el medio ambiente", "Procesos y empaques pensados para dejar la menor huella posible."],
];

export default async function Home() {
  const { products, categories } = await getCatalog();
  const lines = categories.filter((c) => c.count > 0);
  const tiles = lines.map((c) => ({ slug: c.slug, name: c.name, image: c.image ?? products.find((p) => p.categorySlug === c.slug && p.image)?.image }));
  const rowProducts = (slug: string) =>
    products
      .filter((p) => p.categorySlug === slug)
      .map((p) => ({ slug: p.slug, name: p.name, meta: p.meta, category: p.category, price: p.price, image: p.image, comingSoon: p.comingSoon, soldOut: p.stock !== undefined && p.stock <= 0 }));

  return (
    <>
      <JsonLd data={siteData} />
      <HeroFull />
      <PhotoStrip tiles={tiles} />
      <Philosophy />

      <section className="bg-dew-50 pt-4" aria-labelledby="lineas-title">
        <Reveal className="mx-auto max-w-[1360px] px-5 pb-14 pt-10 text-center sm:px-6 lg:pb-20">
          <Mix id="lineas-title" className="text-[clamp(38px,6vw,92px)] text-ink-800" parts={[{ t: "Explora" }, { t: "nuestras líneas", italic: true, br: true }]} />
        </Reveal>
        {lines.map((c, i) => (
          <CollectionRow key={c.slug} category={c} products={rowProducts(c.slug)} flip={i % 2 === 1} tone={i} />
        ))}
      </section>

      <section className="screen" aria-labelledby="story-title">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-5 py-12 sm:px-6 sm:py-16 md:py-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-20">
          <div className="lg:max-w-[min(520px,calc((100svh-var(--header-h)-4rem)*4/5))]">
            <ParallaxArch src="/img/products/miel-de-abeja-pura.jpg" alt="Frasco de miel de Alba Pura con tapa de madera y cuchara" seal="Hecho en Lima" />
          </div>
          <Reveal>
            <Mix id="story-title" className="text-[clamp(32px,min(4.6vw,7svh),64px)] text-ink-800" parts={[{ t: "Por qué existe" }, { t: "Alba Pura", italic: true, br: true }]} />
            <p className="mt-5 max-w-[54ch] text-[clamp(15px,2.4svh,20px)] text-muted">
              Hoy muchos productos de uso diario contienen químicos que afectan la piel y dañan el medio ambiente. Alba Pura nació para ofrecer una alternativa orgánica que cuide a las personas y a su entorno.
            </p>
            <dl className="mt-6 grid max-w-2xl gap-5 border-t border-line pt-5 sm:grid-cols-3 md:mt-[clamp(1rem,3svh,2rem)]">
              {principles.map(([t, d]) => (
                <div key={t}>
                  <dt className="font-display text-[clamp(14px,2.2svh,16px)] font-medium uppercase leading-tight tracking-[0.04em]">{t}</dt>
                  <dd className="mt-1.5 text-[clamp(14px,2.1svh,16px)] text-muted">{d}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 md:mt-[clamp(1rem,3svh,2rem)]">
              <ButtonLink href="/nosotros" variant="secondary">Conoce nuestra historia</ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-ink-800 text-dew-50" aria-labelledby="diario-title">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-16 sm:px-6 lg:px-20 lg:py-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <Mix id="diario-title" className="text-[clamp(34px,5vw,72px)]" parts={[{ t: "Ciencia simple" }, { t: "para cuidarte", italic: true, br: true }]} />
            <Link href="/diario" className="font-display text-[13px] font-medium uppercase tracking-[0.1em] underline decoration-1 underline-offset-[6px] hover:decoration-2">Leer el diario</Link>
          </Reveal>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {posts.slice(0, 3).map((post, n) => (
              <li key={post.slug}>
                <Reveal delay={n * 90} className="h-full">
                  <Link href={`/diario/${post.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl bg-ink-700/70 ring-1 ring-white/10 transition-[transform,background-color] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:bg-ink-600/60">
                    <span className="relative block aspect-[4/3] overflow-hidden bg-ink-600 [&_img]:transition-transform [&_img]:duration-[900ms] [&_img]:ease-[var(--ease-out-expo)] group-hover:[&_img]:scale-[1.06]">
                      <ProductArt product={{ image: post.image, art: post.art, name: post.title }} sizes="(min-width:768px) 30vw, 100vw" />
                    </span>
                    <span className="flex flex-1 flex-col gap-2 p-6">
                      <span className="text-[15px] italic text-leaf-400">{post.topic} · {formatDate(post.date)}</span>
                      <span className="font-heading text-[26px] font-semibold leading-[1.05]">{post.title}</span>
                      <span className="mt-auto pt-3 text-[14px] italic text-dew-200/70">{post.minutes} min de lectura</span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-dawn grain" aria-labelledby="pilot-title">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-16 sm:px-6 lg:px-20 lg:py-24">
          <Reveal className="mx-auto max-w-[900px] text-center">
            <Mix id="pilot-title" className="text-[clamp(32px,5vw,68px)] text-ink-800" parts={[{ t: "Sé de las primeras" }, { t: "personas en probarlo", italic: true, br: true }]} />
            <p className="mx-auto mt-5 max-w-[52ch] text-[clamp(16px,2.6svh,20px)] text-muted">
              Estamos en fase de prueba de producto. Tu opinión nos ayuda a mejorar antes de ampliar la línea.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/tienda" size="lg">Ver los productos</ButtonLink>
              <ButtonLink href="/contacto" size="lg" variant="secondary">Escríbenos</ButtonLink>
            </div>
          </Reveal>
          <ul aria-label="Lo que nos define" className="mt-12 grid gap-6 border-t border-ink-800/20 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            {proof.map(([t, d]) => (
              <li key={t}>
                <p className="font-display text-[14px] font-medium uppercase tracking-[0.05em]">{t}</p>
                <p className="mt-1 text-[15px] text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
