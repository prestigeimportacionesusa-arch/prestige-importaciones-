import { getConfig } from "@/lib/data";
import { formatCOP } from "@/lib/utils";
import { Diamond } from "@/components/Icons";

export const revalidate = 3600; // se actualiza al instante si el admin edita algo (revalidatePath), esto es solo un techo de seguridad

export const metadata = { title: "Política de envíos — Prestige Importaciones" };

export default async function EnviosPage() {
  const config = await getConfig();

  return (
    <div className="pi-section pi-static-page">
      <div className="pi-section-title align-left"><h2>Política de envíos</h2><Diamond /></div>
      <p>Realizamos envíos a {config.ciudades || "todo Colombia"}. Ofrecemos envío gratis en compras desde {formatCOP(config.envio_gratis_desde)}; por debajo de ese monto el costo de envío es {formatCOP(config.costo_envio)}.</p>
      {config.tiempo_entrega ? <p><b>Tiempo estimado de entrega:</b> {config.tiempo_entrega}</p> : null}
      {config.ciudades_cobertura ? <p>{config.ciudades_cobertura}</p> : null}
      <p>El costo y tiempo exactos para tu dirección se confirman antes de pagar, en el checkout.</p>
    </div>
  );
}
