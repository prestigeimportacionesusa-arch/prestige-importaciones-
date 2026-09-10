import { getConfig } from "@/lib/data";
import WholesaleClient from "@/components/WholesaleClient";

export const revalidate = 3600; // se actualiza al instante si el admin edita algo (revalidatePath), esto es solo un techo de seguridad

export const metadata = { title: "Venta mayorista — Prestige Importaciones" };

export default async function WholesalePage() {
  const config = await getConfig();
  return <WholesaleClient whatsapp={config.whatsapp} />;
}
