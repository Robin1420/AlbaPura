import Image from "next/image";
import { Mix } from "@/components/ui/Mix";
import { Reveal } from "@/components/motion/Reveal";

const icon = "h-7 w-7";
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const pillars = [
  {
    title: "Para tu piel",
    text: "Elegimos ingredientes de origen natural y evitamos los que más suelen afectarla.",
    icon: (
      <svg viewBox="0 0 24 24" className={icon} aria-hidden="true" {...stroke}><path d="M12 3c3.5 4 6 7 6 10.5a6 6 0 0 1-12 0C6 10 8.5 7 12 3Z" /><path d="M9.5 14a2.6 2.6 0 0 0 2.5 2.5" /></svg>
    ),
  },
  {
    title: "Para el consumo humano",
    text: "Lo que usas en tu piel o llevas a tu mesa no debería hacerte daño.",
    icon: (
      <svg viewBox="0 0 24 24" className={icon} aria-hidden="true" {...stroke}><path d="M12 20.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10Z" /></svg>
    ),
  },
  {
    title: "Para el medio ambiente",
    text: "Procesos y empaques pensados para dejar la menor huella posible.",
    icon: (
      <svg viewBox="0 0 24 24" className={icon} aria-hidden="true" {...stroke}><path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14Z" /><path d="M5 19 13 11" /></svg>
    ),
  },
];

const card = "w-full rounded-2xl bg-white/80 p-6 text-center shadow-[0_18px_40px_-30px_rgb(8_24_15/0.4)] ring-1 ring-ink-800/5 backdrop-blur-sm lg:w-[262px]";

function Pillar({ p }: { p: (typeof pillars)[number] }) {
  return (
    <div className={card}>
      <span className="mx-auto grid size-[72px] place-items-center rounded-full bg-dew-50 text-ink-800">{p.icon}</span>
      <h3 className="mt-5 font-display text-[16px] font-medium leading-tight tracking-[-0.01em]">{p.title}</h3>
      <p className="mt-3 text-[15px] leading-snug text-muted">{p.text}</p>
    </div>
  );
}

/** Los tres principios de la marca alrededor de una foto con forma orgánica. */
export function Pillars() {
  return (
    <section className="overflow-hidden bg-dew-50 px-5 py-20 sm:px-6 lg:px-12 lg:py-28" aria-labelledby="pilares-title">
      <div className="mx-auto max-w-[1360px]">
        <Reveal className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[min(720px,100%)]">
            <Mix id="pilares-title" className="text-[clamp(34px,5.2vw,78px)] text-ink-800" parts={[{ t: "Orgánico, consciente," }, { t: "cuidado de verdad", italic: true, underline: true, br: true }]} />
            <p className="mt-6 max-w-[40ch] text-[17px] leading-snug text-muted">Pensados para no dañar a quien los usa ni al medio ambiente. Hechos en Lima, en pequeñas cantidades.</p>
          </div>
          <svg viewBox="0 0 430 300" className="pointer-events-none hidden w-[min(34vw,430px)] shrink-0 text-ink-800 lg:block" fill="none" aria-hidden="true">
            <path d="M6 40C120 -6 330 -4 410 130c14 28 8 70-6 118" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="m392 232 12 18 18-14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Reveal>

        {/* Escritorio: tarjetas flotando sobre la foto. Celular: foto y tarjetas apiladas */}
        <div className="relative mt-10 lg:mt-0 lg:min-h-[760px]">
          <Reveal className="mx-auto lg:absolute lg:left-1/2 lg:top-[-30px] lg:w-[min(720px,58%)] lg:-translate-x-[44%]">
            <div className="relative aspect-[4/4.4] overflow-hidden bg-peach-100 [border-radius:58%_42%_46%_54%/52%_48%_52%_48%] lg:[border-radius:80%_20%_70%_30%/62%_58%_42%_38%]">
              <Image src="/img/products/jabon-artesanal-de-avena.jpg" alt="Jabón artesanal de avena de Alba Pura" fill sizes="(min-width:1024px) 42vw, 92vw" className="object-cover" />
            </div>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:static lg:mt-0 lg:block">
            <Reveal delay={0} className="lg:absolute lg:left-[3%] lg:top-[120px]"><Pillar p={pillars[0]} /></Reveal>
            <Reveal delay={120} className="lg:absolute lg:right-[1%] lg:top-[40px]"><Pillar p={pillars[1]} /></Reveal>
            <Reveal delay={240} className="lg:absolute lg:bottom-[40px] lg:right-[22%]"><Pillar p={pillars[2]} /></Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
