import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductArt } from "@/components/product/ProductArt";
import { ButtonLink } from "@/components/ui/Button";
import { JsonLd, breadcrumbs } from "@/components/seo/JsonLd";
import { formatDate, getPost, posts } from "@/lib/content";
import { abs, SITE } from "@/lib/site";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/diario/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.excerpt,
    alternates: { canonical: `/diario/${p.slug}` },
    openGraph: { type: "article", title: p.title, description: p.excerpt, url: abs(`/diario/${p.slug}`), publishedTime: p.date, images: p.image ? [p.image] : undefined },
  };
}

async function Article({ params }: { params: PageProps<"/diario/[slug]">["params"] }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const next = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    inLanguage: "es-PE",
    image: post.image ? abs(post.image) : undefined,
    mainEntityOfPage: abs(`/diario/${post.slug}`),
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };

  return (
    <article>
      <JsonLd data={[articleData, breadcrumbs([{ name: "Inicio", url: abs("/") }, { name: "Diario", url: abs("/diario") }, { name: post.title, url: abs(`/diario/${post.slug}`) }])]} />
      <header className="bg-dawn pb-10 pt-36 sm:pb-14 sm:pt-44">
        <div className="mx-auto max-w-[900px] px-6">
          <Link href="/diario" className="text-[17px] italic text-muted underline-offset-4 hover:underline">Volver al diario</Link>
          <h1 className="mt-6 text-[clamp(30px,6vw,76px)] font-semibold tracking-[-0.04em]">{post.title}</h1>
          <p className="mt-5 text-[18px] italic text-muted">{post.topic}, {formatDate(post.date)}, {post.minutes} min de lectura</p>
        </div>
      </header>

      <div className="mx-auto max-w-[900px] px-6 py-14">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-dew-100">
          <ProductArt product={{ image: post.image, art: post.art, name: post.title }} sizes="900px" priority />
        </div>
        <div className="mx-auto mt-12 grid max-w-[64ch] gap-6 text-[21px] leading-[1.65]">
          {post.body.map((para, i) => <p key={i}>{para}</p>)}
        </div>
        <div className="mx-auto mt-14 max-w-[64ch] rounded-xl bg-dew-100 p-8">
          <p className="font-display text-[24px] font-medium tracking-[-0.02em]">Conoce los productos de Alba Pura</p>
          <p className="mt-2 text-[18px] text-muted">Están pensados con estas ideas: ingredientes simples y respeto por tu piel y por el medio ambiente.</p>
          <ButtonLink href="/tienda" className="mt-5">Ver los productos</ButtonLink>
        </div>
      </div>

      <section className="border-t border-line">
        <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-20">
          <h2 className="text-[clamp(28px,3vw,40px)]">Sigue leyendo</h2>
          <ul className="mt-8 grid gap-8 md:grid-cols-2">
            {next.map((p) => (
              <li key={p.slug} className="border-t border-ink-800 pt-5">
                <p className="text-[16px] italic text-leaf-600">{p.topic}</p>
                <Link href={`/diario/${p.slug}`} className="font-display text-[26px] font-medium tracking-[-0.02em] hover:underline underline-offset-4">{p.title}</Link>
                <p className="mt-2 text-[18px] text-muted">{p.excerpt}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </article>
  );
}

export default function PostPage(props: PageProps<"/diario/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
      <Article params={props.params} />
    </Suspense>
  );
}
