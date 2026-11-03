/**
 * Datos iniciales del catálogo (fase de prueba, Lima, Perú). Los usan `npm run db:seed` y
 * `scripts/update-content.mts`; después todo se edita desde /admin.
 * Son productos de ejemplo: reemplázalos por tu catálogo real desde el panel. Los precios van en soles enteros.
 */
export type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  meta: string;
  latin?: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  badge?: string;
  image?: string;
  art: "oil" | "honey" | "soap" | "tea";
  description: string;
  notes: { title: string; text: string }[];
  provenance: { label: string; value: string }[];
};

export const seedCategories = [
  { slug: "cuidado-de-la-piel", name: "Cuidado de la piel", description: "Jabones y bálsamos pensados para cuidar tu piel y el medio ambiente.", image: "/img/products/jabon-artesanal-de-avena.jpg", sortOrder: 1 },
  { slug: "aceites-y-vinagres", name: "Aceites y vinagres", description: "Aceites para tu cocina y tu despensa.", image: "/img/products/aceite-de-oliva-virgen-extra.jpg", sortOrder: 2 },
  { slug: "mieles-y-dulces", name: "Mieles y dulces", description: "Mieles y dulces de origen natural.", image: "/img/products/miel-de-abeja-pura.jpg", sortOrder: 3 },
  { slug: "infusiones", name: "Infusiones", description: "Hierbas y flores para tus momentos de pausa.", image: "/img/products/infusion-de-manzanilla-y-hierba-luisa.jpg", sortOrder: 4 },
] as const;

/** Categoría que corresponde a cada ilustración sembrada. */
export const categoryOf: Record<string, string> = { oil: "aceites-y-vinagres", honey: "mieles-y-dulces", soap: "cuidado-de-la-piel", tea: "infusiones" };

const made = [
  { label: "Elaborado en", value: "Lima, Perú" },
  { label: "Etapa", value: "Producto en fase de prueba" },
];

export const seedProducts: SeedProduct[] = [
  {
    slug: "jabon-artesanal-de-avena",
    name: "Jabón artesanal de avena",
    category: "Cuidado de la piel",
    meta: "100 g, hecho en Lima",
    price: 18,
    rating: 0,
    reviews: 0,
    badge: "Nuevo",
    image: "/img/products/jabon-artesanal-de-avena.jpg",
    art: "soap",
    description: "Jabón artesanal con avena, pensado para una limpieza suave en el día a día. Hecho en pequeñas cantidades en Lima.",
    notes: [],
    provenance: made,
  },
  {
    slug: "jabon-artesanal-de-calendula",
    name: "Jabón artesanal de caléndula",
    category: "Cuidado de la piel",
    meta: "100 g, hecho en Lima",
    price: 18,
    rating: 0,
    reviews: 0,
    image: "/img/products/jabon-artesanal-de-calendula.jpg",
    art: "soap",
    description: "Jabón artesanal con caléndula para la rutina diaria. Hecho en pequeñas cantidades en Lima.",
    notes: [],
    provenance: made,
  },
  {
    slug: "balsamo-labial-de-cera-de-abeja",
    name: "Bálsamo labial de cera de abeja",
    category: "Cuidado de la piel",
    meta: "10 g, hecho en Lima",
    price: 12,
    rating: 0,
    reviews: 0,
    image: "/img/products/balsamo-labial-de-cera-de-abeja.jpg",
    art: "soap",
    description: "Bálsamo para cuidar tus labios, con cera de abeja. Una fórmula simple, hecha en Lima.",
    notes: [],
    provenance: made,
  },
  {
    slug: "aceite-de-oliva-virgen-extra",
    name: "Aceite de oliva extra virgen",
    category: "Aceites y vinagres",
    meta: "500 ml",
    price: 48,
    rating: 0,
    reviews: 0,
    image: "/img/products/aceite-de-oliva-virgen-extra.jpg",
    art: "oil",
    description: "Aceite de oliva extra virgen para aliños y cocina diaria.",
    notes: [],
    provenance: [{ label: "Etapa", value: "Producto en fase de prueba" }],
  },
  {
    slug: "miel-de-abeja-pura",
    name: "Miel de abeja pura",
    category: "Mieles y dulces",
    meta: "500 g",
    price: 32,
    rating: 0,
    reviews: 0,
    badge: "Nuevo",
    image: "/img/products/miel-de-abeja-pura.jpg",
    art: "honey",
    description: "Miel de abeja pura, sin mezclas, para endulzar tus desayunos e infusiones.",
    notes: [],
    provenance: [{ label: "Etapa", value: "Producto en fase de prueba" }],
  },
  {
    slug: "infusion-de-manzanilla-y-hierba-luisa",
    name: "Infusión de manzanilla y hierba luisa",
    category: "Infusiones",
    meta: "20 saquitos",
    price: 14,
    rating: 0,
    reviews: 0,
    image: "/img/products/infusion-de-manzanilla-y-hierba-luisa.jpg",
    art: "tea",
    description: "Mezcla de manzanilla y hierba luisa para una pausa tranquila en tu día.",
    notes: [],
    provenance: [{ label: "Etapa", value: "Producto en fase de prueba" }],
  },
];
