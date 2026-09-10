import { getProducts, getPromotions, getConfig } from "@/lib/data";
import CheckoutClient from "@/components/CheckoutClient";

export const revalidate = 3600; // se actualiza al instante si el admin edita algo (revalidatePath), esto es solo un techo de seguridad

export const metadata = { title: "Finalizar compra — Prestige Importaciones" };

export default async function CheckoutPage() {
  const [products, promotions, config] = await Promise.all([getProducts(), getPromotions(), getConfig()]);
  return <CheckoutClient products={products} promotions={promotions} config={config} />;
}
