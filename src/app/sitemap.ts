import type { MetadataRoute } from "next";
import { posts } from "@/lib/content";
import { abs } from "@/lib/site";
import { getCatalog } from "@/server/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getCatalog();
  const fixed: [string, number, MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
    ["/", 1, "weekly"],
    ["/tienda", 0.9, "daily"],
    ["/nosotros", 0.5, "monthly"],
    ["/diario", 0.6, "weekly"],
    ["/preguntas-frecuentes", 0.5, "monthly"],
    ["/contacto", 0.4, "yearly"],
  ];
  return [
    ...fixed.map(([path, priority, changeFrequency]) => ({ url: abs(path), priority, changeFrequency })),
    ...categories.filter((c) => c.count > 0).map((c) => ({ url: abs(`/categoria/${c.slug}`), priority: 0.8, changeFrequency: "weekly" as const })),
    ...products.map((p) => ({ url: abs(`/producto/${p.slug}`), priority: 0.8, changeFrequency: "weekly" as const })),
    ...posts.map((p) => ({ url: abs(`/diario/${p.slug}`), lastModified: new Date(p.date), priority: 0.6, changeFrequency: "monthly" as const })),
  ];
}
