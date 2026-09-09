import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import MetaPixel from "@/components/MetaPixel";
import { getConfig } from "@/lib/data";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://prestige-importaciones.vercel.app"),
  title: {
    default: "Prestige Importaciones — Perfumes 100% originales",
    template: "%s — Prestige Importaciones",
  },
  description: "Perfumes árabes y de diseñador 100% originales. Envíos a todo Colombia, pago contra entrega.",
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Prestige Importaciones",
    title: "Prestige Importaciones — Perfumes 100% originales",
    description: "Perfumes árabes y de diseñador 100% originales. Envíos a todo Colombia, pago contra entrega.",
  },
};

export default async function RootLayout({ children }) {
  const config = await getConfig();

  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
        <div className="pi-app">
          <CartProvider>
            <Header nombreTienda={config.nombre_tienda} />
            <main className="pi-main">{children}</main>
            <Footer nombreTienda={config.nombre_tienda} instagram={config.instagram} tiktok={config.tiktok} facebook={config.facebook} />
            <WhatsAppFloat whatsapp={config.whatsapp} />
          </CartProvider>
        </div>
      </body>
    </html>
  );
}
