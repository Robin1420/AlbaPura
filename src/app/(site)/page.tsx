import type { Metadata } from "next";
import Link from "next/link";
import { CinematicHero } from "@/components/hero/CinematicHero";
import { ParallaxArch } from "@/components/motion/ParallaxArch";
import { ProductArt } from "@/components/product/ProductArt";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
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
  return (
    <>
      <JsonLd data={siteData} />
      <CinematicHero />

      <section className="screen" aria-labelledby="cat-title">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-6 sm:py-16 md:py-0 lg:px-20">
          <h2 id="cat-title" className="max-w-[16ch] text-[clamp(32px,min(5vw,8svh),64px)]">Cuatro líneas, una misma idea</h2>
          <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-7 sm:mt-10 sm:gap-x-8 sm:gap-y-10 md:mt-[clamp(1.5rem,5svh,3.5rem)] lg:grid-cols-4">
            {categories.map((c, i) => (
              <li key={c.name} className={i % 2 === 1 ? "[@media(min-height:860px)]:lg:mt-10" : ""}>
                <Link href={`/categoria/${c.slug}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-lg bg-dew-100 transition-[border-radius,transform] duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-2 group-hover:rounded-t-[60px] md:max-h-[min(40svh,420px)] [&_img]:transition-transform [&_img]:duration-[900ms] [&_img]:ease-[var(--ease-out-expo)] group-hover:[&_img]:scale-[1.06]">
                    <ProductArt product={{ image: c.image, name: c.name, art: c.slug.includes("infus") ? "tea" : c.slug.includes("piel") ? "soap" : undefined }} />
                    <span className="absolute bottom-4 right-4 grid size-12 translate-y-3 place-items-center rounded-full bg-dew-50 text-ink-800 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M8 7h9v9" /></svg>
                    </span>
                  </div>
                  <p className="mt-2.5 font-display text-[16px] font-medium leading-tight sm:text-[19px] md:text-[clamp(18px,3svh,22px)]">{c.name}</p>
                  <p className="text-[13px] italic text-faint sm:text-[15px]">{c.count} producto{c.count === 1 ? "" : "s"}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-meadow grain screen" aria-labelledby="feat-title">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-6 sm:py-16 md:py-0 lg:px-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="feat-title" className="max-w-[18ch] text-[clamp(28px,min(4.2vw,6.5svh),56px)]">Los primeros productos de Alba Pura</h2>
              <p className="mt-2 max-w-[52ch] text-[clamp(15px,2.4svh,20px)] text-muted">Estamos en fase de prueba. Sé de las primeras personas en conocerlos y cuéntanos qué te parecen.</p>
            </div>
            <ButtonLink href="/tienda" variant="primary">Ver toda la tienda</ButtonLink>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-9 sm:mt-10 sm:gap-x-8 sm:gap-y-12 md:mt-[clamp(1rem,3svh,2.5rem)] lg:grid-cols-4">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.slug} product={p} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="screen" aria-labelledby="story-title">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-5 py-12 sm:px-6 sm:py-16 md:py-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-20">
          <div className="lg:max-w-[min(520px,calc((100svh-var(--header-h)-4rem)*4/5))]">
            <ParallaxArch src="/img/products/miel-de-abeja-pura.jpg" alt="Frasco de miel de Alba Pura con tapa de madera y cuchara" seal="Hecho en Lima" />
          </div>
          <div>
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
          </div>
        </div>
      </section>

      <section className="bg-dawn grain screen" aria-labelledby="pilot-title">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-6 sm:py-16 md:py-0 lg:px-20">
          <div className="mx-auto max-w-[900px] text-center">
            <h2 id="pilot-title" className="text-[clamp(30px,min(4.5vw,7.5svh),56px)]">Sé de las primeras personas en probar Alba Pura</h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-[clamp(16px,2.6svh,20px)] text-muted">
              Estamos en fase de prueba de producto. Tu opinión nos ayuda a mejorar antes de ampliar la línea.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/tienda" size="lg">Ver los productos</ButtonLink>
              <ButtonLink href="/contacto" size="lg" variant="secondary">Escríbenos</ButtonLink>
            </div>
          </div>
          <ul aria-label="Lo que nos define" className="mt-10 grid gap-6 border-t border-ink-800/20 pt-6 sm:grid-cols-2 md:mt-[clamp(1.5rem,6svh,4rem)] lg:grid-cols-4">
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
