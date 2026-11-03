/** Un producto tal como lo entrega la base de datos a la tienda. */
export type Product = {
  slug: string;
  name: string;
  /** Nombre y slug de la categoría. */
  category: string;
  categorySlug: string;
  meta: string;
  latin?: string;
  price: number;
  oldPrice?: number;
  stock: number;
  rating: number;
  reviews: number;
  badge?: string;
  /** Anunciado pero todavía no a la venta: sin precio y sin compra. */
  comingSoon?: boolean;
  /** Color de la etiqueta: ink, leaf, peach o sky. */
  badgeTone?: string;
  /** Primera foto (atajo de images[0]). */
  image?: string;
  images: string[];
  /** Lámina vectorial de respaldo cuando no hay fotos. */
  art?: "oil" | "honey" | "soap" | "tea";
  description: string;
  notes: { title: string; text: string }[];
  provenance: { label: string; value: string }[];
};

export type Category = {
  slug: string;
  name: string;
  description?: string;
  image?: string;
  count: number;
};

export type Catalog = { products: Product[]; categories: Category[] };

/** Precios en soles enteros. */
export function money(n: number) {
  return "S/ " + n.toLocaleString("es-PE");
}

export const badgeTones = ["ink", "leaf", "peach", "sky"] as const;
const toneClass: Record<string, string> = {
  ink: "bg-ink-800 text-dew-50",
  leaf: "bg-leaf-400 text-ink-900",
  peach: "bg-peach-300 text-ink-900",
  sky: "bg-sky-300 text-ink-900",
};
export const badgeClass = (tone?: string) => toneClass[tone ?? "ink"] ?? toneClass.ink;
