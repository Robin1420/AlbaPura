export function Stars({ value, count }: { value: number; count?: number }) {
  const full = Math.round(value);
  return (
    <span
      className="inline-flex items-center gap-1.5"
      role="img"
      aria-label={`${value.toFixed(1).replace(".", ",")} de 5${count ? `, ${count} reseñas` : ""}`}
    >
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < full ? "var(--color-leaf-500)" : "none"} stroke={i < full ? "var(--color-leaf-500)" : "var(--color-line-strong)"} strokeWidth="2" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </span>
      {count !== undefined && <span className="text-[14px] italic text-faint">({count})</span>}
    </span>
  );
}
