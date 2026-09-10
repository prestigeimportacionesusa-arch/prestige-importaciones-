import { getProducts, getPromotions, getConfig } from "@/lib/data";
import CartClient from "@/components/CartClient";

export const revalidate = 3600; // se actualiza al instante si el admin edita algo (revalidatePath), esto es solo un techo de seguridad

export const metadata = { title: "Carrito — Prestige Importaciones" };

export default async function CartPage() {
  const [products, promotions, config] = await Promise.all([getProducts(), getPromotions(), getConfig()]);
  return <CartClient products={products} promotions={promotions} config={config} />;
}
