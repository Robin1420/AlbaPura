import { CartProvider } from "@/components/cart/CartProvider";
import { MiniCart } from "@/components/cart/MiniCart";
import { WhatsAppFloat } from "@/components/cart/WhatsAppButtons";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

/** Cáscara de la tienda pública: header, footer y carrito. El panel /admin no la usa. */
/**
 * Las páginas se generan en cada visita: así lo que se edita en el panel (productos, categorías, diario)
 * se ve al instante. La regeneración por tiempo (`revalidate`) no se actualizaba sola en Cloudflare.
 */
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <CartProvider>
      <Header />
      <main>{children}</main>
      <Footer />
      <MiniCart />
      <WhatsAppFloat />
    </CartProvider>
  );
}
