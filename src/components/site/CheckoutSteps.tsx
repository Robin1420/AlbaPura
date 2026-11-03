const defaultSteps = ["Carrito", "Datos y envío", "Pago"];

/** Indicador de avance de la compra. `current` es la posición (desde 0) del paso actual. */
export function CheckoutSteps({ current, steps = defaultSteps }: { current: number; steps?: string[] }) {
  return (
    <ol aria-label="Pasos de la compra" className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-[15px]">
      {steps.map((s, i) => (
        <li key={s} aria-current={i === current ? "step" : undefined} className="flex items-center gap-3">
          <span className={`grid size-7 place-items-center rounded-full text-[13px] font-semibold ${i < current ? "bg-leaf-500 text-ink-900" : i === current ? "bg-ink-800 text-dew-50" : "border border-line-strong/60 text-faint"}`}>
            {i < current ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
            ) : (
              i + 1
            )}
          </span>
          <span className={i === current ? "font-medium" : "text-faint"}>{s}</span>
          {i < steps.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-8 bg-line-strong/50" />}
        </li>
      ))}
    </ol>
  );
}
