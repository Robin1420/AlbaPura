import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { SITE } from "@/lib/site";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  alternates: { canonical: "/contacto" },
  title: "Contacto",
  description: "Escríbenos y te respondemos lo antes posible. Alba Pura, Lima, Perú.",
};

// El correo, el WhatsApp y el Instagram se definen en .env (NEXT_PUBLIC_*) y solo se muestran si existen.
const info: [string, string][] = [
  ["Ciudad", `${SITE.city}, ${SITE.country}`],
  ...(SITE.email ? [["Escríbenos", SITE.email] as [string, string]] : []),
  ...(SITE.whatsapp ? [["WhatsApp", SITE.whatsapp] as [string, string]] : []),
  ...(SITE.instagram ? [["Instagram", SITE.instagram] as [string, string]] : []),
];

export default function Contacto() {
  return (
    <>
      <PageHeader title="Hablemos">
        <p>Escríbenos y te respondemos lo antes posible. Si estás probando algún producto, cuéntanos cómo te fue.</p>
      </PageHeader>
      <div className="mx-auto grid max-w-[1440px] gap-16 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:px-20">
        <dl className="grid content-start gap-0 divide-y divide-line border-y border-line">
          {info.map(([k, v]) => (
            <div key={k} className="py-5">
              <dt className="text-[17px] italic text-faint">{k}</dt>
              <dd className="mt-1 break-words font-display text-[24px] font-medium tracking-[-0.02em]">{v}</dd>
            </div>
          ))}
        </dl>
        <section aria-labelledby="form-title">
          <h2 id="form-title" className="mb-6 text-[clamp(28px,3vw,40px)]">Envíanos un mensaje</h2>
          <ContactForm />
        </section>
      </div>
    </>
  );
}
