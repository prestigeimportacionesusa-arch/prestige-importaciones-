import { getConfig } from "@/lib/data";
import WholesaleClient from "@/components/WholesaleClient";

export const metadata = { title: "Venta mayorista — Prestige Importaciones" };

export default async function WholesalePage() {
  const config = await getConfig();
  return <WholesaleClient whatsapp={config.whatsapp} />;
}
