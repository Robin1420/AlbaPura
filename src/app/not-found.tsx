import { CartProvider } from "@/components/cart/CartProvider";
import { MiniCart } from "@/components/cart/MiniCart";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { ButtonLink } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Mix";

export default function NotFound() {
  return (
    <CartProvider>
      <Header />
      <main>
        <section className="bg-dawn grain px-6 pb-28 pt-44 lg:px-20">
          <div className="mx-auto max-w-[1440px]">
            <p className="font-heading text-[clamp(96px,18vw,240px)] font-medium italic leading-[0.85] tracking-[-0.03em] text-ink-800">404</p>
            <Heading as="h1" className="mt-6 max-w-[18ch] text-[clamp(34px,5vw,72px)] text-ink-800">Esta página no existe</Heading>
            <p className="mt-5 max-w-[46ch] text-[21px] text-muted">Puede que el enlace esté mal escrito o que el producto ya no esté disponible. Vuelve al inicio o revisa la tienda.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/" size="lg">Volver al inicio</ButtonLink>
              <ButtonLink href="/tienda" size="lg" variant="secondary">Ir a la tienda</ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MiniCart />
    </CartProvider>
  );
}
