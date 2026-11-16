import Image from "next/image";
import Link from "next/link";
import { badgeClass, type Product } from "@/lib/products";
import { Stars } from "@/components/ui/Stars";
import { CardAdd } from "./CardAdd";
import { FavoriteButton } from "./FavoriteButton";

const pill = "rounded-full px-3 py-1 font-display text-[10.5px] font-medium uppercase tracking-[0.08em]";

/** Tarjeta de producto: foto grande con el nombre encima, favorito, "Añadir" y precio (igual que las filas del inicio). */
export function ProductCard({ product, priority, as: Heading = "h3" }: { product: Product; priority?: boolean; /** Se mantiene por compatibilidad: ya no cambia la altura. */ compact?: boolean; /** Nivel del título: h3 bajo una sección con h2, h2 en listados. */ as?: "h2" | "h3" }) {
  const soldOut = product.stock !== undefined && product.stock <= 0;
  return (
    <article className="group relative isolate aspect-[3/4] overflow-hidden rounded-[24px] bg-dew-100">
      {product.image ? (
        <Image src={product.image} alt="" fill priority={priority} sizes="(min-width:1024px) 30vw, 50vw" className="-z-10 object-cover transition-transform duration-[1100ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]" />
      ) : (
        <span className="absolute inset-0 -z-10 bg-gradient-to-br from-dew-100 to-leaf-300" />
      )}
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900/80 via-ink-900/10 to-transparent" />

      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        <span className={`${pill} bg-white/90 text-ink-900 backdrop-blur-sm`}>{product.category}</span>
        {product.comingSoon ? (
          <span className={`${pill} bg-ink-800 text-dew-50`}>Próximamente</span>
        ) : soldOut ? (
          <span className={`${pill} bg-danger text-white`}>Agotado</span>
        ) : (
          product.badge && <span className={`${pill} ${badgeClass(product.badgeTone)}`}>{product.badge}</span>
        )}
      </div>
      <FavoriteButton slug={product.slug} name={product.name} />

      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <Heading className="line-clamp-3 font-heading text-[clamp(24px,2.2vw,32px)] font-semibold leading-[0.98]">
          <Link href={`/producto/${product.slug}`} className="after:absolute after:inset-0 after:content-['']">{product.name}</Link>
        </Heading>
        <p className="mt-1.5 text-[14px] italic text-white/80">{product.meta}</p>
        {product.reviews > 0 && <div className="mt-1.5 text-white"><Stars value={product.rating} count={product.reviews} /></div>}
        <div className="relative z-10 mt-3 flex items-center gap-2">
          {product.comingSoon ? (
            <span className="rounded-full bg-white/20 px-4 py-2 font-display text-[12px] font-medium uppercase tracking-[0.08em] backdrop-blur-sm">Próximamente</span>
          ) : soldOut ? (
            <span className="rounded-full bg-white/20 px-4 py-2 font-display text-[12px] font-medium uppercase tracking-[0.08em] backdrop-blur-sm">Sin stock</span>
          ) : (
            <CardAdd slug={product.slug} name={product.name} price={product.price} />
          )}
        </div>
      </div>
    </article>
  );
}
