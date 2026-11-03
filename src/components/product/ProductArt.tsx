import Image from "next/image";
import type { Product } from "@/lib/products";

type Art = NonNullable<Product["art"]>;

/** Lámina vectorial para los productos sin fotografía. */
function Vector({ art, label }: { art?: Art; label: string }) {
  const bg: Record<Art, [string, string]> = {
    oil: ["#f0f4e6", "#c4d8ab"],
    honey: ["#fcf2e3", "#ebdcbd"],
    soap: ["#faf7ee", "#dce8cd"],
    tea: ["#f5f1fa", "#d6e3ce"],
  };
  const [a, b] = bg[art ?? "soap"];
  const id = `g-${art ?? "plain"}`;
  return (
    <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#${id})`} />
      <ellipse cx="200" cy="260" rx="170" ry="170" fill="#fff" opacity=".45" />
      <rect y="380" width="400" height="120" fill="#fff" opacity=".35" />
      <ellipse cx="200" cy="392" rx="120" ry="14" fill="#08180f" opacity=".2" />
      {art === "soap" && (
        <g>
          <rect x="100" y="320" width="200" height="70" rx="12" fill="#efe6cf" />
          <rect x="116" y="248" width="170" height="70" rx="12" fill="#f5eedb" transform="rotate(-5 200 280)" />
          <rect x="188" y="236" width="52" height="92" rx="3" fill="#fff" opacity=".9" transform="rotate(-5 200 280)" />
          <text x="214" y="288" textAnchor="middle" fontSize="11" fontFamily="serif" letterSpacing="2" fill="#0e2a1b" transform="rotate(-5 214 288)">ALBA PURA</text>
        </g>
      )}
      {art === "tea" && (
        <g>
          <rect x="120" y="230" width="160" height="160" rx="8" fill="#235b3a" />
          <rect x="132" y="242" width="136" height="136" rx="4" fill="none" stroke="#a3d65c" strokeWidth="1.2" />
          <circle cx="200" cy="300" r="30" fill="#f7faf1" />
          <text x="200" y="308" textAnchor="middle" fontSize="20" fontFamily="serif" fill="#0e2a1b">Té</text>
          <text x="200" y="352" textAnchor="middle" fontSize="9" fontFamily="serif" letterSpacing="2" fill="#cbea95">LAVANDA Y TILO</text>
        </g>
      )}
      {!art && (
        <path d="M200 190c-40 20-50 70-20 110 40-10 70-50 20-110Zm0 0c10 40 0 90-40 130" fill="none" stroke="#6db832" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
      )}
    </svg>
  );
}

/** Foto del producto (la primera de su galería) o, si no tiene, la lámina de respaldo. */
export function ProductArt({
  product,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority,
  src,
}: {
  product: { image?: string; images?: string[]; art?: Art; name: string };
  sizes?: string;
  priority?: boolean;
  /** Para elegir otra foto de la galería. */
  src?: string;
}) {
  const url = src ?? product.image ?? product.images?.[0];
  if (url) {
    return (
      <Image
        src={url}
        alt={product.name}
        fill
        sizes={sizes}
        priority={priority}
        fetchPriority={priority ? "high" : undefined}
        // Las fotos subidas desde el panel salen de /api/media y no pasan por el optimizador
        unoptimized={url.startsWith("/api/media/")}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    );
  }
  return <Vector art={product.art} label={product.name} />;
}
