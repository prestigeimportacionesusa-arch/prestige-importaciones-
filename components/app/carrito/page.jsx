import { getProducts, getPromotions, getConfig } from "@/lib/data";
import CartClient from "@/components/CartClient";

export const metadata = { title: "Carrito — Prestige Importaciones" };

export default async function CartPage() {
  const [products, promotions, config] = await Promise.all([getProducts(), getPromotions(), getConfig()]);
  return <CartClient products={products} promotions={promotions} config={config} />;
}
