import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { getConfig } from "@/lib/data";
import { fetchWompiTransaction } from "@/lib/wompi";
import { formatCOP } from "@/lib/utils";
import { waUrl, waOrderMessage } from "@/lib/whatsapp";
import { IconWhatsapp } from "@/components/Icons";

export const metadata = { title: "Confirmación de pedido — Prestige Importaciones" };

const ESTADO_MENSAJE = {
  Pagado: { texto: "¡Tu pago fue aprobado!", tono: "ok" },
  Rechazado: { texto: "Tu pago fue rechazado.", tono: "error" },
  Pendiente: { texto: "Tu pago está siendo procesado.", tono: "pendiente" },
};

export default async function ConfirmacionPage({ searchParams }) {
  const sp = await searchParams;
  const ref = sp?.ref;
  const wompiId = sp?.id;
  const config = await getConfig();

  if (!ref) {
    return (
      <div className="pi-order-confirm">
        <h1>Pedido no encontrado</h1>
        <p>No encontramos información de tu pedido. Si acabas de pagar, escríbenos por WhatsApp con tu número de pedido.</p>
        <Link href="/" className="btn btn-outline">Volver al inicio</Link>
      </div>
    );
  }

  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", ref)
    .single();

  if (!order) {
    return (
      <div className="pi-order-confirm">
        <h1>Pedido no encontrado</h1>
        <p>No encontramos ese pedido. Si acabas de pagar, escríbenos por WhatsApp con tu número de transacción.</p>
        <Link href="/" className="btn btn-outline">Volver al inicio</Link>
      </div>
    );
  }

  // Consultamos a Wompi solo para dar una respuesta inmediata más precisa al
  // cliente (por ejemplo, si el webhook todavía no ha llegado). El estado
  // real y definitivo del pedido en nuestra base de datos (order.estado_pago)
  // solo lo actualiza el webhook verificado — nunca esta consulta.
  let estadoMostrado = order.estado_pago;
  if (wompiId && order.estado_pago === "Pendiente") {
    const tx = await fetchWompiTransaction(wompiId);
    if (tx?.status === "APPROVED") estadoMostrado = "Pagado (confirmando...)";
    else if (tx?.status === "DECLINED" || tx?.status === "ERROR") estadoMostrado = "Rechazado";
  }

  const mensaje = ESTADO_MENSAJE[order.estado_pago] || { texto: "Estamos confirmando tu pago...", tono: "pendiente" };
  const waOrder = {
    numero: order.numero,
    cliente_nombre: order.cliente_nombre,
    cliente_celular: order.cliente_celular,
    cliente_direccion: order.cliente_direccion,
    cliente_ciudad: order.cliente_ciudad,
    cliente_departamento: order.cliente_departamento,
    barrio: order.barrio,
    items: (order.order_items || []).map((it) => ({ nombre: it.nombre, marca: it.marca, qty: it.qty, subtotal: it.subtotal })),
    subtotal: order.subtotal,
    envio: order.envio,
    recargo: order.recargo,
    total: order.total,
    metodo_pago: order.metodo_pago,
    estado_pago: order.estado_pago,
  };

  return (
    <div className="pi-order-confirm">
      <h1>¡Gracias, {order.cliente_nombre.split(" ")[0]}!</h1>
      <p>Tu pedido <b>#{order.numero}</b> fue registrado por {formatCOP(order.total)}.</p>
      <p className={`pi-order-status-note pi-status-${mensaje.tono}`}>{mensaje.texto}</p>
      {estadoMostrado !== order.estado_pago ? (
        <p className="pi-order-status-note">Actualizando estado final del pago... refresca en unos segundos si no cambia.</p>
      ) : null}
      <a className="btn btn-wa" href={waUrl(config.whatsapp, waOrderMessage(waOrder))} target="_blank" rel="noreferrer">
        <IconWhatsapp size={18} /> Confirmar por WhatsApp
      </a>
      <Link href="/" className="btn btn-outline">Volver al inicio</Link>
    </div>
  );
}
