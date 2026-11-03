import type { Metadata } from "next";
import { getCatalog } from "@/server/catalog";
import { Catalog } from "./Catalog";

export const metadata: Metadata = {
  title: "Tienda de productos orgánicos en Lima, Perú",
  description: "Jabones, bálsamo, aceite, miel e infusiones orgánicos hechos en Lima. Entrega en Lima Metropolitana y Callao.",
  alternates: { canonical: "/tienda" },
};

export default async function Tienda() {
  const { products, categories } = await getCatalog();
  return (
    <>
      <header className="bg-dawn pb-10 pt-36 sm:pb-14 sm:pt-44">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-20">
          <h1 className="text-[clamp(34px,7vw,96px)] font-semibold tracking-[-0.04em]">Tienda</h1>
          <p className="mt-4 max-w-[46ch] text-[21px] text-muted">Cada producto con su ficha clara. Estamos en fase de prueba.</p>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-6 pb-10 pt-8 lg:px-20">
        <Catalog products={products} categories={categories} />
      </div>
    </>
  );
}
