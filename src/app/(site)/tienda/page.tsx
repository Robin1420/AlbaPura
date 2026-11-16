import type { Metadata } from "next";
import { getCatalog } from "@/server/catalog";
import { PageHeader } from "@/components/site/PageHeader";
import { Catalog } from "./Catalog";

export const metadata: Metadata = {
  title: "Tienda de productos naturales en Lima, Perú",
  description: "Jabones, bálsamo, aceite, miel e infusiones naturales hechos en Lima. Entrega en Lima Metropolitana y Callao.",
  alternates: { canonical: "/tienda" },
};

export default async function Tienda() {
  const { products, categories } = await getCatalog();
  return (
    <>
      <PageHeader title="Tienda">
        <p>Cada producto con su ficha clara.</p>
      </PageHeader>
      <div className="mx-auto max-w-[1440px] px-6 pb-10 pt-8 lg:px-20">
        <Catalog products={products} categories={categories} />
      </div>
    </>
  );
}
