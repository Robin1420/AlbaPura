import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { Stars } from "@/components/ui/Stars";
import { JsonLd, breadcrumbs } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { money } from "@/lib/products";
import { abs, SITE, snippet } from "@/lib/site";
import { getCatalog } from "@/server/catalog";
import { AddToCart } from "./AddToCart";
import { Gallery } from "./Gallery";

export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getCatalog()).products.find((x) => x.slug === slug);
  if (!p) return {};
  const description = snippet(p.description || `${p.name}, ${p.meta}. Producto orgánico y artesanal de ${p.category.toLowerCase()}, con entrega en Lima Metropolitana y Callao.`);
  return {
    title: `${p.name}, ${p.meta}`,
    description,
    alternates: { canonical: `/producto/${p.slug}` },
    openGraph: { type: "website", title: `${p.name} | ${SITE.name}`, description, url: abs(`/producto/${p.slug}`), images: p.images.length ? [{ url: p.images[0], alt: p.name }] : undefined },
    twitter: { card: "summary_large_image" },
  };
}

async function ProductContent({ params }: { params: PageProps<"/producto/[slug]">["params"] }) {
  const { slug } = await params;
  const { products } = await getCatalog();
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  // Primero los de su misma categoría
  const related = [...products.filter((x) => x.slug !== p.slug && x.categorySlug === p.categorySlug), ...products.filter((x) => x.slug !== p.slug && x.categorySlug !== p.categorySlug)].slice(0, 3);
  const saving = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

  // No se marcan reseñas (aggregateRating) hasta que sean reales: Google penaliza las valoraciones inventadas.
  const productData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    sku: p.slug,
    category: p.category,
    image: p.images.map((u) => abs(u)),
    brand: { "@type": "Brand", name: SITE.name },
    // Un producto "Próximamente" no tiene oferta: no se publica precio ni disponibilidad
    ...(p.comingSoon
      ? {}
      : {
          offers: {
            "@type": "Offer",
            url: abs(`/producto/${p.slug}`),
            priceCurrency: "PEN",
            price: p.price,
            availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: SITE.name },
          },
        }),
  };

  return (
    <>
      <JsonLd data={[productData, breadcrumbs([{ name: "Inicio", url: abs("/") }, { name: "Tienda", url: abs("/tienda") }, { name: p.category, url: abs(`/categoria/${p.categorySlug}`) }, { name: p.name, url: abs(`/producto/${p.slug}`) }])]} />
      <div className="mx-auto max-w-[1440px] px-5 pt-36 sm:px-6 sm:pt-36 lg:px-20 lg:pt-36">
        <nav aria-label="Ruta" className="text-[15px] italic text-faint">
          <Link href="/" className="hover:text-ink-900">Inicio</Link>, <Link href="/tienda" className="hover:text-ink-900">Tienda</Link>, <Link href={`/categoria/${p.categorySlug}`} className="hover:text-ink-900">{p.category}</Link>, <span className="text-ink-900 not-italic">{p.name}</span>
        </nav>
      </div>

      <section className="mx-auto grid max-w-[1440px] gap-10 px-6 py-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14 lg:px-20">
        <Gallery product={p} />

        <div className="max-w-[560px]">
          {p.latin && <p className="text-[18px] italic text-leaf-600">{p.latin}</p>}
          <h1 className="mt-2 text-[clamp(30px,5vw,68px)] font-semibold tracking-[-0.04em]">{p.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {p.reviews > 0 && <Stars value={p.rating} count={p.reviews} />}
            <span className="text-[15px] italic text-faint">{p.meta}</span>
          </div>
          {p.comingSoon ? (
            <>
              <p className="mt-4 inline-block rounded-full bg-dew-100 px-4 py-1.5 font-display text-[15px] font-medium text-ink-800 ring-1 ring-ink-800/15 lg:mt-5">Próximamente</p>
              <p className="mt-4 text-[19px] text-muted lg:mt-5 lg:text-[20px]">{p.description}</p>
              <div className="mt-6 rounded-2xl bg-dew-100 p-6 lg:mt-7">
                <p className="font-display text-[19px] font-medium">Todavía no está a la venta.</p>
                <p className="mt-1 text-[17px] text-muted">Lo estamos preparando. Escríbenos si quieres que te avisemos cuando esté disponible.</p>
                <ButtonLink href="/contacto" variant="secondary" size="md" className="mt-4">Quiero que me avisen</ButtonLink>
              </div>
            </>
          ) : (
            <>
            <div className="mt-4 flex items-baseline gap-4 lg:mt-5">
              <p className="font-display text-[44px] font-medium tracking-[-0.04em]">{money(p.price)}</p>
              {p.oldPrice && (
                <>
                  <p className="text-[20px] text-faint line-through">{money(p.oldPrice)}</p>
                  <span className="rounded-full bg-leaf-300 px-3 py-1 font-display text-[13px] font-semibold">Ahorras {saving}%</span>
                </>
              )}
            </div>
            <p className="mt-4 text-[19px] text-muted lg:mt-5 lg:text-[20px]">{p.description}</p>
            <div className="mt-6 lg:mt-7"><AddToCart slug={p.slug} name={p.name} stock={p.stock} price={p.price} /></div>
            {p.stock !== undefined && p.stock > 0 && p.stock <= 5 && <p className="mt-3 text-[16px] italic text-danger">Quedan {p.stock} unidades.</p>}
            </>
          )}
          <div className="mt-10 divide-y divide-line border-y border-line">
            {[
              ["Envío y entrega", "Entregamos en Lima Metropolitana y Callao. Te confirmamos el día de entrega por correo."],
              ["Cambios", "Si tu pedido llega dañado, escríbenos dentro de las 48 horas siguientes con una foto y lo reponemos sin costo."],
              ["Fase de prueba", "Este es uno de los primeros productos de Alba Pura. Cuéntanos cómo te fue: tu opinión nos ayuda a mejorar."],
            ].map(([t, d]) => (
              <details key={t} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-display text-[18px] font-medium [&::-webkit-details-marker]:hidden">
                  {t}
                  <span aria-hidden="true" className="grid size-8 place-items-center rounded-full border border-line-strong/60 text-[18px] leading-none transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-[48ch] text-[17px] text-muted">{d}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {(p.notes.length > 0 || p.provenance.length > 0) && (
      <section className="mx-auto max-w-[1440px] px-6 py-16 lg:px-20" aria-labelledby="specimen">
        <div className="grid gap-12 border-t border-ink-800 pt-10 lg:grid-cols-[1fr_1.4fr]">
          <h2 id="specimen" className="text-[clamp(32px,4vw,48px)]">Lámina del producto</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-dew-100 p-7">
              <h3 className="text-[22px]">Notas de cata</h3>
              <ul className="mt-4 divide-y divide-ink-800/15">
                {p.notes.map((n) => (
                  <li key={n.title} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="font-display text-[17px] font-medium">{n.title}</span>
                    <span className="text-[16px] italic text-muted">{n.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-sky-100 p-7">
              <h3 className="text-[22px]">Procedencia</h3>
              <dl className="mt-4 divide-y divide-ink-800/15">
                {p.provenance.map((x) => (
                  <div key={x.label} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-[16px] italic text-faint">{x.label}</dt>
                    <dd className="font-display text-[17px] font-medium">{x.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>
      )}

      <section className="bg-meadow grain screen py-16 md:py-0">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-20">
          <h2 className="text-[clamp(30px,min(4vw,6.5svh),52px)]">También te puede gustar</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-8 sm:gap-y-14 md:mt-6 lg:grid-cols-3">
            {related.map((r) => <ProductCard key={r.slug} product={r} compact />)}
          </div>
        </div>
      </section>
    </>
  );
}

export default function ProductPage(props: PageProps<"/producto/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
      <ProductContent params={props.params} />
    </Suspense>
  );
}
