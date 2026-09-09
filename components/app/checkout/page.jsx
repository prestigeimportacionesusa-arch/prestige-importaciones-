import { getProducts, getPromotions, getConfig } from "@/lib/data";
import CheckoutClient from "@/components/CheckoutClient";

export const metadata = { title: "Finalizar compra — Prestige Importaciones" };

export default async function CheckoutPage() {
  const [products, promotions, config] = await Promise.all([getProducts(), getPromotions(), getConfig()]);
  return <CheckoutClient products={products} promotions={promotions} config={config} />;
}
