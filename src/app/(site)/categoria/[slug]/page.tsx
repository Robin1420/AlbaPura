import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd, breadcrumbs } from "@/components/seo/JsonLd";
import { abs, SITE, snippet } from "@/lib/site";
import { getCatalog } from "@/server/catalog";

export async function generateStaticParams() {
  const { categories } = await getCatalog();
  return categories.filter((c) => c.count > 0).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categoria/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getCatalog()).categories.find((x) => x.slug === slug);
  if (!c) return {};
  const description = snippet(c.description ? `${c.description} Productos orgánicos de Alba Pura, con entrega en Lima Metropolitana y Callao.` : `${c.name} orgánicos de Alba Pura, creados en Lima, con entrega en Lima Metropolitana y Callao.`);
  return {
    title: `${c.name} orgánicos en Lima, Perú`,
    description,
    alternates: { canonical: `/categoria/${c.slug}` },
    openGraph: { title: `${c.name} | ${SITE.name}`, description, url: abs(`/categoria/${c.slug}`), type: "website", images: c.image ? [c.image] : undefined },
  };
}

async function CategoryContent({ params }: { params: PageProps<"/categoria/[slug]">["params"] }) {
  const { slug } = await params;
  const { products, categories } = await getCatalog();
  const c = categories.find((x) => x.slug === slug);
  if (!c || c.count === 0) notFound();
  const list = products.filter((p) => p.categorySlug === c.slug);
  const others = categories.filter((x) => x.slug !== c.slug && x.count > 0);

  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: c.name,
    url: abs(`/categoria/${c.slug}`),
    description: c.description,
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: list.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/producto/${p.slug}`), name: p.name })),
    },
  };

  return (
    <>
      <JsonLd data={[collection, breadcrumbs([{ name: "Inicio", url: abs("/") }, { name: "Tienda", url: abs("/tienda") }, { name: c.name, url: abs(`/categoria/${c.slug}`) }])]} />
      <header className="bg-dawn grain pb-14 pt-44">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-20">
          <nav aria-label="Ruta" className="text-[15px] italic text-faint">
            <Link href="/" className="hover:text-ink-900">Inicio</Link>, <Link href="/tienda" className="hover:text-ink-900">Tienda</Link>, <span className="text-ink-900 not-italic">{c.name}</span>
          </nav>
          <h1 className="mt-4 text-[clamp(44px,6.5vw,88px)] font-semibold tracking-[-0.04em]">{c.name}</h1>
          {c.description && <p className="mt-4 max-w-[52ch] text-[21px] text-muted">{c.description}</p>}
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-6 py-16 lg:px-20" aria-label={`Productos de ${c.name}`}>
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => <ProductCard key={p.slug} product={p} priority={i < 3} as="h2" />)}
        </div>
      </section>

      {others.length > 0 && (
        <section className="border-t border-line" aria-label="Otras categorías">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-6 py-10 lg:px-20">
            <p className="mr-2 text-[17px] italic text-faint">También puedes mirar</p>
            {others.map((o) => <Link key={o.slug} href={`/categoria/${o.slug}`} className="rounded-full border border-line px-4 py-2 font-display text-[15px] font-medium transition-colors hover:bg-ink-800 hover:text-dew-50">{o.name}</Link>)}
          </div>
        </section>
      )}
    </>
  );
}

export default function CategoryPage(props: PageProps<"/categoria/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
      <CategoryContent params={props.params} />
    </Suspense>
  );
}
