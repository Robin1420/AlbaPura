import type { ElementType } from "react";

export type MixPart = { t: string; italic?: boolean; underline?: boolean; br?: boolean };

/**
 * Titular de dos voces: sans en mayúsculas junto a una serif cursiva en minúsculas.
 * Es el sello visual de las secciones del inicio.
 */
export function Mix({ parts, as: Tag = "h2", caps = true, className = "", id }: { parts: MixPart[]; as?: ElementType; caps?: boolean; className?: string; id?: string }) {
  return (
    <Tag id={id} className={`pb-[0.1em] leading-[0.98] ${className}`}>
      {parts.map((p, i) => (
        <span key={i}>
          {p.br && <br />}
          {i > 0 && !p.br && " "}
          {p.italic ? (
            <em className={`font-heading text-[1.14em] font-medium italic normal-case tracking-[-0.01em] ${p.underline ? "underline decoration-[0.05em] underline-offset-[0.12em]" : ""}`}>{p.t}</em>
          ) : (
            <span className={`font-display font-medium tracking-[-0.02em] ${caps ? "uppercase" : ""}`}>{p.t}</span>
          )}
        </span>
      ))}
    </Tag>
  );
}

/** Titular simple: el texto va en sans y la última palabra en serif cursiva (si hay una sola palabra, toda en cursiva). */
export function Heading({ children, as = "h2", caps = true, className = "", id }: { children: string; as?: ElementType; caps?: boolean; className?: string; id?: string }) {
  const words = children.trim().split(" ");
  const last = words.pop() ?? children;
  const parts: MixPart[] = words.length ? [{ t: words.join(" ") }, { t: last, italic: true }] : [{ t: last, italic: true }];
  return <Mix as={as} caps={caps} className={className} id={id} parts={parts} />;
}
