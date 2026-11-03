import { CartProvider } from "@/components/cart/CartProvider";
import { MiniCart } from "@/components/cart/MiniCart";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

/** Cáscara de la tienda pública: header, footer y carrito. El panel /admin no la usa. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <CartProvider>
      <Header />
      <main>{children}</main>
      <Footer />
      <MiniCart />
    </CartProvider>
  );
}
