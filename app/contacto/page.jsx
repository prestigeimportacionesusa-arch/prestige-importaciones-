import { getConfig } from "@/lib/data";
import { Diamond, IconWhatsapp } from "@/components/Icons";
import { waUrl } from "@/lib/whatsapp";

export const revalidate = 3600; // se actualiza al instante si el admin edita algo (revalidatePath), esto es solo un techo de seguridad

export const metadata = { title: "Contacto — Prestige Importaciones" };

export default async function ContactoPage() {
  const config = await getConfig();
  return (
    <div className="pi-section pi-static-page">
      <div className="pi-section-title align-left"><h2>Contacto</h2><Diamond /></div>
      <p>Escríbenos por WhatsApp para resolver cualquier duda sobre tu pedido, disponibilidad o venta mayorista. Respondemos todos los días.</p>
      <a className="btn btn-wa" href={waUrl(config.whatsapp, "Hola, tengo una pregunta.")} target="_blank" rel="noreferrer">
        <IconWhatsapp size={18} /> Escribir por WhatsApp
      </a>
    </div>
  );
}
