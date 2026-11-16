import type { Metadata } from "next";
import Link from "next/link";
import { DawnHero } from "@/components/hero/DawnHero";
import { RitualPicker } from "@/components/home/RitualPicker";
import { ProductRail } from "@/components/home/ProductRail";
import { Marquee } from "@/components/motion/Marquee";
import { Reveal } from "@/components/motion/Reveal";
import { ParallaxArch } from "@/components/motion/ParallaxArch";
import { ProductArt } from "@/components/product/ProductArt";
import { ProductCard } from "@/components/product/ProductCard";
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

const values = ["Hecho en Lima", "Pensado para tu piel", "Pequeñas cantidades", "Respeto por el medio ambiente", "Atención cercana"];

export default async function Home() {
  const { products, categories } = await getCatalog();
  const heroProducts = products.filter((p) => !p.comingSoon && p.image).slice(0, 5).map((p) => ({ slug: p.slug, name: p.name, meta: p.meta, category: p.category, price: p.price, image: p.image! }));
  const lines = categories.filter((c) => c.count > 0).map((c) => ({ slug: c.slug, name: c.name, count: c.count, description: c.description, image: c.image }));
  const pickerProducts = products.map((p) => ({ slug: p.slug, name: p.name, meta: p.meta, price: p.price, categorySlug: p.categorySlug, image: p.image, comingSoon: p.comingSoon }));
  return (
    <>
      <JsonLd data={siteData} />
      <DawnHero products={heroProducts} />
      <Marquee items={values} />

      <section id="lineas" className="screen scroll-mt-4" aria-labelledby="cat-title">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-6 sm:py-16 md:py-0 lg:px-20">
          <Reveal>
            <h2 id="cat-title" className="mb-7 max-w-[18ch] text-[clamp(32px,min(5vw,8svh),64px)] md:mb-[clamp(1rem,4svh,2.5rem)]">Elige tu línea</h2>
          </Reveal>
          <RitualPicker categories={lines} products={pickerProducts} />
        </div>
      </section>

      <section className="bg-meadow grain screen" aria-labelledby="feat-title">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-6 sm:py-16 md:py-0 lg:px-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="feat-title" className="max-w-[18ch] text-[clamp(28px,min(4.2vw,6.5svh),56px)]">Los primeros productos de Alba Pura</h2>
              <p className="mt-2 max-w-[52ch] text-[clamp(15px,2.4svh,20px)] text-muted">Estamos en fase de prueba. Sé de las primeras personas en conocerlos y cuéntanos qué te parecen.</p>
            </div>
            <ButtonLink href="/tienda" variant="primary">Ver toda la tienda</ButtonLink>
          </Reveal>
          <div className="mt-7 md:mt-[clamp(1rem,3svh,2.5rem)]">
            <ProductRail>
              {products.map((p, n) => (
                <ProductCard key={p.slug} product={p} priority={n < 3} />
              ))}
            </ProductRail>
          </div>
        </div>
      </section>

      <section className="screen" aria-labelledby="story-title">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-5 py-12 sm:px-6 sm:py-16 md:py-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-20">
          <div className="lg:max-w-[min(520px,calc((100svh-var(--header-h)-4rem)*4/5))]">
            <ParallaxArch src="/img/products/miel-de-abeja-pura.jpg" alt="Frasco de miel de Alba Pura con tapa de madera y cuchara" seal="Hecho en Lima" />
          </div>
          <Reveal>
            <h2 id="story-title" className="max-w-[16ch] text-[clamp(28px,min(4.2vw,6.4svh),56px)]">Por qué existe Alba Pura</h2>
            <p className="mt-3 max-w-[54ch] text-[clamp(15px,2.4svh,20px)] text-muted">
              Hoy muchos productos de uso diario contienen químicos que afectan la piel y dañan el medio ambiente. Alba Pura nació para ofrecer una alternativa orgánica que cuide a las personas y a su entorno.
            </p>
            <dl className="mt-6 grid max-w-2xl gap-5 border-t border-line pt-5 sm:grid-cols-3 md:mt-[clamp(1rem,3svh,2rem)]">
              {principles.map(([t, d]) => (
                <div key={t}>
                  <dt className="font-display text-[clamp(16px,2.6svh,20px)] font-medium leading-tight tracking-[-0.02em]">{t}</dt>
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
            <h2 id="diario-title" className="max-w-[16ch] text-[clamp(30px,4.4vw,56px)]">Ciencia simple para cuidarte</h2>
            <Link href="/diario" className="font-display text-[16px] font-semibold underline decoration-1 underline-offset-[6px] hover:decoration-2">Leer el diario</Link>
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
            <h2 id="pilot-title" className="text-[clamp(30px,min(4.5vw,7.5svh),56px)]">Sé de las primeras personas en probar Alba Pura</h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-[clamp(16px,2.6svh,20px)] text-muted">
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
                <p className="font-display text-[17px] font-medium">{t}</p>
                <p className="text-[15px] text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
