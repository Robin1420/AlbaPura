import type { Metadata } from "next";
import Image from "next/image";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHeader } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/nosotros" },
  title: "Nosotros",
  description: "Alba Pura es una línea de productos orgánicos creada en Lima por la bióloga Yuleisi Cucho, para cuidar la piel, la salud y el medio ambiente.",
};

const values = [
  { t: "Ciencia al servicio de lo natural", d: "Elegimos los ingredientes con criterio científico: qué le hacen a tu piel, a tu cuerpo y al entorno." },
  { t: "Información clara", d: "Cada producto detalla qué lleva y cómo se hace. Si tienes una duda, te la respondemos." },
  { t: "Respeto por el medio ambiente", d: "Procesos y empaques pensados para dejar la menor huella posible." },
];

const aboutData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  founder: {
    "@type": "Person",
    name: SITE.founder.name,
    jobTitle: SITE.founder.role,
    alumniOf: { "@type": "CollegeOrUniversity", name: SITE.founder.university },
  },
  address: { "@type": "PostalAddress", addressLocality: SITE.city, addressCountry: "PE" },
};

export default function Nosotros() {
  return (
    <>
      <JsonLd data={aboutData} />
      <PageHeader screen title="Cuidarte sin dañar el planeta">
        <p>Alba Pura es una línea de productos orgánicos creada en Lima por una bióloga que quiso ofrecer una alternativa más cuidadosa.</p>
      </PageHeader>

      <section className="screen"><div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-6 py-16 md:py-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:px-20">
        <div className="relative aspect-[4/5] w-full max-w-[560px] overflow-hidden rounded-t-[999px] rounded-b-xl lg:max-w-[min(520px,calc((100svh-var(--header-h)-4rem)*4/5))]">
          <Image src="/img/products/aceite-de-oliva-virgen-extra.jpg" alt="Botella de aceite de oliva Alba Pura con ramas de olivo" fill sizes="(min-width:1024px) 40vw, 90vw" className="object-cover" />
        </div>
        <div className="max-w-[54ch] text-[clamp(16px,2.8svh,21px)] text-muted">
          <h2 className="mb-5 text-[clamp(30px,min(4vw,7svh),52px)] text-ink-900">Por qué existe Alba Pura</h2>
          <p>Hoy en día muchos productos de uso diario contienen químicos que afectan la piel y, al terminar en el desagüe, también dañan el medio ambiente. No siempre es fácil saber qué llevan ni cómo actúan.</p>
          <p className="mt-5">Alba Pura nació para cambiar eso: una línea de productos orgánicos que no sean dañinos ni para el consumo humano ni para el medio ambiente, y que expliquen con claridad de qué están hechos.</p>
        </div>
        </div>
      </section>

      <section className="bg-meadow grain screen" aria-labelledby="values">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 md:py-0 lg:px-20">
          <h2 id="values" className="text-[clamp(30px,min(4vw,7svh),52px)]">Lo que nos importa</h2>
          <dl className="mt-10 grid gap-8 md:mt-[clamp(1.5rem,5svh,3rem)] md:grid-cols-3">
            {values.map((v) => (
              <div key={v.t} className="border-t border-ink-800 pt-6">
                <dt className="font-display text-[clamp(20px,3.4svh,26px)] font-medium leading-tight tracking-[-0.02em]">{v.t}</dt>
                <dd className="mt-3 text-[clamp(16px,2.6svh,19px)] text-muted">{v.d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="screen" aria-labelledby="founder">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-6 py-16 md:py-0 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:px-20">
          <h2 id="founder" className="max-w-[12ch] text-[clamp(30px,min(4vw,7svh),52px)]">La persona detrás de Alba Pura</h2>
          <div className="max-w-[60ch]">
            <p className="font-text text-[34px] italic leading-tight text-ink-700">{SITE.founder.name}</p>
            <p className="mt-1 text-[17px] italic text-faint">{SITE.founder.role}, {SITE.founder.university}. Lima, Perú</p>
            <p className="mt-5 text-[clamp(16px,2.8svh,21px)] text-muted">
              Yuleisi es la dueña y fundadora de Alba Pura. Como bióloga, parte de una pregunta sencilla: ¿qué le hacen a nuestro cuerpo y al entorno los productos que usamos todos los días? De esa pregunta nace esta línea.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-dawn grain screen" aria-labelledby="pilot">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16 md:py-0 lg:px-20">
          <h2 id="pilot" className="max-w-[18ch] text-[clamp(30px,min(4vw,7svh),52px)]">Estamos en fase de prueba</h2>
          <p className="mt-5 max-w-[56ch] text-[clamp(16px,2.8svh,21px)] text-muted">
            Lanzamos una primera tanda pequeña en Lima para escuchar a las personas que prueben los productos y mejorar antes de ampliar la línea. Si los pruebas, tu opinión es muy valiosa para nosotros.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/tienda" size="lg">Ver los productos</ButtonLink>
            <ButtonLink href="/contacto" size="lg" variant="secondary">Escríbenos</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
