import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Newsreader } from "next/font/google";
import "./globals.css";
import { AccountProvider } from "@/components/account/AccountProvider";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SITE } from "@/lib/site";

// Títulos: serif de display clásica, a juego con el logotipo
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Menú, botones, precios y etiquetas: sans limpia que contrasta con las serifs
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}, ${SITE.tagline.toLowerCase()}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { type: "website", siteName: SITE.name, locale: SITE.locale, title: `${SITE.name}, ${SITE.tagline.toLowerCase()}`, description: SITE.description },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PE" className={`${cormorant.variable} ${jost.variable} ${newsreader.variable}`}>
      <body className="min-h-screen">
        <AccountProvider>
          <MotionProvider>{children}</MotionProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
