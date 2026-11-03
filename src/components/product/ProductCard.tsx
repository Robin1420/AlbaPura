import Link from "next/link";
import { badgeClass, money, type Product } from "@/lib/products";
import { Stars } from "@/components/ui/Stars";
import { ProductArt } from "./ProductArt";
import { QuickAdd } from "./QuickAdd";
import { FavoriteButton } from "./FavoriteButton";

/** Lámina abierta: foto en arco y datos debajo, sin caja. */
export function ProductCard({ product, priority, compact, as: Heading = "h3" }: { product: Product; priority?: boolean; /** Imagen más baja, para que una fila de tarjetas quepa en una pantalla. */ compact?: boolean; /** Nivel del título: h3 bajo una sección con h2, h2 en listados. */ as?: "h2" | "h3" }) {
  return (
    <article className="group relative flex flex-col gap-4">
      <Link href={`/producto/${product.slug}`} className={`relative block aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-lg bg-dew-100 [&_img]:transition-transform [&_img]:duration-[900ms] [&_img]:ease-[var(--ease-out-expo)] group-hover:[&_img]:scale-[1.05] ${compact ? "md:max-h-[min(26svh,280px)]" : ""}`}>
        <ProductArt product={product} priority={priority} />
      </Link>
      <FavoriteButton slug={product.slug} name={product.name} />
      {product.comingSoon ? (
        <span className="absolute left-3 top-3 rounded-full bg-dew-50 px-3 py-1 font-display text-[12px] font-medium text-ink-800 shadow-sm ring-1 ring-ink-800/15">Próximamente</span>
      ) : product.stock !== undefined && product.stock <= 0 ? (
        <span className="absolute left-3 top-3 rounded-full bg-danger px-3 py-1 font-display text-[12px] font-medium text-white">Agotado</span>
      ) : product.badge && (
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 font-display text-[12px] font-medium ${badgeClass(product.badgeTone)}`}>
          {product.badge}
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className={`text-[15px] italic text-leaf-600 ${compact ? "[@media(max-height:820px)]:md:hidden" : ""}`}>{product.category}</p>
        <Heading className={compact ? "text-[clamp(19px,3.2svh,24px)]" : "text-[24px]"}>
          <Link href={`/producto/${product.slug}`} className="hover:underline underline-offset-4 decoration-1">
            {product.name}
          </Link>
        </Heading>
        <p className="text-[15px] italic text-faint">{product.meta}</p>
        {product.reviews > 0 && <Stars value={product.rating} count={product.reviews} />}
        <div className={`flex items-center justify-between ${compact ? "mt-1" : "mt-2"}`}>
          {product.comingSoon ? (
            <p className="font-display text-[18px] font-medium italic text-muted">Próximamente</p>
          ) : (
            <>
              <p className="font-display text-[24px] font-medium tracking-tight">{money(product.price)}</p>
              <QuickAdd slug={product.slug} name={product.name} soldOut={product.stock !== undefined && product.stock <= 0} />
            </>
          )}
        </div>
      </div>
    </article>
  );
}
