import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Respuestas sobre entregas en Lima, pagos con tarjeta y Yape, cambios y sobre nuestros productos orgánicos.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

export default function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.flatMap((g) => g.items).map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHeader title="Preguntas frecuentes">
        <p>Todo sobre entregas, pagos, cambios y nuestros productos.</p>
      </PageHeader>

      <div className="mx-auto grid max-w-[1440px] gap-14 px-6 py-20 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-20">
        <nav aria-label="Temas" className="lg:sticky lg:top-36 lg:h-fit">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 lg:grid">
            {faqs.map((g) => (
              <li key={g.group}><a href={`#${g.group}`} className="font-display text-[17px] font-medium hover:underline underline-offset-4">{g.group}</a></li>
            ))}
          </ul>
        </nav>

        <div className="grid max-w-[820px] gap-14">
          {faqs.map((g) => (
            <section key={g.group} id={g.group} className="scroll-mt-36" aria-labelledby={`h-${g.group}`}>
              <h2 id={`h-${g.group}`} className="text-[clamp(28px,3vw,40px)]">{g.group}</h2>
              <div className="mt-4 border-t border-line">
                {g.items.map((i) => (
                  <details key={i.q} className="group border-b border-line">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-[20px] font-medium tracking-[-0.01em] [&::-webkit-details-marker]:hidden">
                      {i.q}
                      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full border border-line-strong text-[20px] leading-none transition-transform duration-300 group-open:rotate-45">+</span>
                    </summary>
                    <p className="max-w-[62ch] pb-6 text-[19px] text-muted">{i.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <div className="rounded-xl bg-dew-100 p-8">
            <p className="font-display text-[26px] font-medium tracking-[-0.02em]">¿No encontraste tu respuesta?</p>
            <p className="mt-2 text-[19px] text-muted">Respondemos de lunes a viernes, de 9:00 a 18:00.</p>
            <ButtonLink href="/contacto" className="mt-5">Escribir a soporte</ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}
