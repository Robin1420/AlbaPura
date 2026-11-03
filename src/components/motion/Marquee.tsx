/** Cinta lenta de orígenes. Solo CSS: se pausa al pasar el mouse y se detiene con "reducir movimiento". */
export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-12 pr-12">
      {items.map((t) => (
        <li key={t} className="flex items-center gap-12 whitespace-nowrap font-text text-[clamp(28px,3.4vw,44px)] italic">
          {t}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14Z" /><path d="M5 19 13 11" /></svg>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee overflow-hidden border-y border-ink-800/15 bg-dew-100 py-6 text-ink-700" aria-label={items.join(", ")} role="group">
      <div className="marquee-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
