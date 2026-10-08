import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { getConfig } from "@/lib/data";
import { fetchWompiTransaction } from "@/lib/wompi";
import { formatCOP, formatOrderNumber } from "@/lib/utils";
import { waUrl, waOrderMessage } from "@/lib/whatsapp";
import { IconWhatsapp } from "@/components/Icons";
import TrackPurchaseIfPaid from "@/components/TrackPurchaseIfPaid";
import ClearCartOnConfirm from "@/components/ClearCartOnConfirm";

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

  // Consultamos a Wompi solo para darle al cliente una respuesta inmediata y
  // correcta (el webhook puede tardar unos segundos en llegar). El estado
  // definitivo del pedido en la base de datos (order.estado_pago) solo lo
  // cambia el webhook verificado — nunca esta consulta.
  let estadoCliente = order.estado_pago;
  if (wompiId && order.estado_pago === "Pendiente") {
    try {
      const tx = await fetchWompiTransaction(wompiId);
      if (tx?.reference === order.referencia) {
        if (tx.status === "APPROVED") estadoCliente = "Pagado";
        else if (tx.status === "DECLINED" || tx.status === "ERROR" || tx.status === "VOIDED") estadoCliente = "Rechazado";
      }
    } catch {
      // Si Wompi no responde, mostramos "en proceso" y el webhook hará el resto.
    }
  }
  const rechazado = estadoCliente === "Rechazado";
  const mensaje = ESTADO_MENSAJE[estadoCliente] || { texto: "Estamos confirmando tu pago...", tono: "pendiente" };
  const waOrder = {
    numero: order.numero,
    cliente_nombre: order.cliente_nombre,
    cliente_celular: order.cliente_celular,
    cliente_direccion: order.cliente_direccion,
    cliente_ciudad: order.cliente_ciudad,
    cliente_departamento: order.cliente_departamento,
    barrio: order.barrio,
    items: (order.order_items || []).map((it) => ({ id: it.product_id, nombre: it.nombre, marca: it.marca, qty: it.qty, subtotal: it.subtotal })),
    subtotal: order.subtotal,
    envio: order.envio,
    recargo: order.recargo,
    total: order.total,
    metodo_pago: order.metodo_pago,
    estado_pago: order.estado_pago,
  };

  const waRechazo = [
    `Hola, intenté pagar mi pedido *#${formatOrderNumber(order.numero)}* (${formatCOP(order.total)}) con ${order.metodo_pago} pero el pago fue rechazado.`,
    "¿Me ayudan a pagarlo de otra forma?",
  ].join("\n");

  if (rechazado) {
    return (
      <div className="pi-order-confirm">
        <h1>Tu pago no se completó</h1>
        <p>
          El banco o la pasarela rechazó el pago de tu pedido <b>#{formatOrderNumber(order.numero)}</b> por {formatCOP(order.total)}.
          No te preocupes: tus perfumes siguen en el carrito.
        </p>
        <p className="pi-order-status-note">
          Puedes intentarlo de nuevo con otra tarjeta, elegir <b>pago contra entrega</b> o <b>transferencia</b>, o escribirnos y te ayudamos a pagar.
        </p>
        <Link href="/checkout" className="btn btn-primary">Intentar de nuevo / otro método de pago</Link>
        <a className="btn btn-wa" href={waUrl(config.whatsapp, waRechazo)} target="_blank" rel="noreferrer">
          <IconWhatsapp size={18} /> Pagar con ayuda por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="pi-order-confirm">
      <ClearCartOnConfirm clear />
      <TrackPurchaseIfPaid order={{ ...waOrder, estado_pago: order.estado_pago }} />
      <h1>¡Gracias, {order.cliente_nombre.split(" ")[0]}!</h1>
      <p>Tu pedido <b>#{formatOrderNumber(order.numero)}</b> fue registrado por {formatCOP(order.total)}.</p>
      <p className={`pi-order-status-note pi-status-${mensaje.tono}`}>{mensaje.texto}</p>
      {estadoCliente !== order.estado_pago ? (
        <p className="pi-order-status-note">Estamos registrando la confirmación del pago. No tienes que hacer nada más.</p>
      ) : null}
      <a className="btn btn-wa" href={waUrl(config.whatsapp, waOrderMessage(waOrder))} target="_blank" rel="noreferrer">
        <IconWhatsapp size={18} /> Confirmar por WhatsApp
      </a>
      <Link href="/" className="btn btn-outline">Volver al inicio</Link>
    </div>
  );
}
