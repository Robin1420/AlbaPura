import { CartProvider } from "@/components/cart/CartProvider";
import { MiniCart } from "@/components/cart/MiniCart";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <CartProvider>
      <Header />
      <main>
        <section className="bg-dawn px-6 pb-28 pt-52 lg:px-20">
          <div className="mx-auto max-w-[1440px]">
            <p className="font-display text-[clamp(96px,18vw,240px)] font-semibold leading-[0.85] tracking-[-0.06em] text-ink-800">404</p>
            <h1 className="mt-6 max-w-[16ch] text-[clamp(32px,4.5vw,60px)] font-semibold">Esta página no existe</h1>
            <p className="mt-4 max-w-[46ch] text-[21px] text-muted">Puede que el enlace esté mal escrito o que el producto ya no esté disponible. Vuelve al inicio o revisa la tienda.</p>
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
