import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getConfig } from "@/lib/data";

export const metadata = {
  title: "Prestige Importaciones — Perfumes 100% originales",
  description: "Perfumes árabes y de diseñador 100% originales. Envíos a todo Colombia, pago contra entrega.",
};

export default async function RootLayout({ children }) {
  const config = await getConfig();

  return (
    <html lang="es">
      <body>
        <div className="pi-app">
          <CartProvider>
            <Header nombreTienda={config.nombre_tienda} />
            <main className="pi-main">{children}</main>
            <Footer nombreTienda={config.nombre_tienda} />
            <WhatsAppFloat whatsapp={config.whatsapp} />
          </CartProvider>
        </div>
      </body>
    </html>
  );
}
