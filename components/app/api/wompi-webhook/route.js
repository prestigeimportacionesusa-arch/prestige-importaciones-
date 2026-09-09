import { NextResponse } from "next/server";
import { verifyWompiEventChecksum, wompiStatusToEstadoPago } from "@/lib/wompi";
import { createServiceClient } from "@/lib/supabase/service";
import { sendPurchaseCapiEvent } from "@/lib/meta-capi";

// Esta es la URL que se configura en el dashboard de Wompi (Desarrollo ->
// Programadores -> URL de eventos). Wompi envía aquí un POST cada vez que
// una transacción cambia de estado. Esta es la ÚNICA fuente confiable para
// marcar un pedido como pagado — nunca se hace solo porque el cliente
// regresó a la página.
export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const isValid = verifyWompiEventChecksum(payload);
  if (!isValid) {
    // Si la firma no coincide, no confiamos en el evento. No revelamos
    // detalles del error para no ayudar a quien intente falsificar eventos.
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const transaction = payload?.data?.transaction;
  if (!transaction) {
    return NextResponse.json({ ok: true }); // evento sin transacción, lo ignoramos sin error
  }

  const reference = transaction.reference; // este es el order.id (uuid) que usamos como referencia
  const nuevoEstadoPago = wompiStatusToEstadoPago(transaction.status);

  const supabase = createServiceClient();

  // Idempotencia: si ya estaba en "Pagado" o "Rechazado", no lo repetimos
  // (evita procesar el mismo evento dos veces si Wompi reintenta el envío).
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("referencia", reference)
    .single();

  if (!order) {
    return NextResponse.json({ ok: true }); // referencia desconocida, no hacemos nada
  }
  if (order.estado_pago === "Pagado" || order.estado_pago === "Rechazado") {
    return NextResponse.json({ ok: true, already: true });
  }

  await supabase
    .from("orders")
    .update({ estado_pago: nuevoEstadoPago })
    .eq("id", order.id);

  // Reporte a Meta (Conversion API) solo cuando el pago quedó aprobado de
  // verdad. Si falla el envío a Meta, no afecta el pedido — ya está guardado.
  if (nuevoEstadoPago === "Pagado") {
    await sendPurchaseCapiEvent({
      numero: order.numero,
      total: order.total,
      cliente_correo: order.cliente_correo,
      cliente_celular: order.cliente_celular,
      items: order.order_items || [],
    });
  }

  return NextResponse.json({ ok: true });
}
