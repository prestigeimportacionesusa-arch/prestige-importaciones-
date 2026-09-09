import { createHash } from "node:crypto";

// Envía el evento Purchase directamente desde nuestro servidor a Meta,
// además del que se dispara en el navegador. Esto es más confiable: llega
// aunque el cliente cierre la pestaña de pago antes de volver a la tienda,
// o tenga bloqueadores de anuncios. Usamos el mismo event_id en ambos para
// que Meta los deduplique y no cuente la compra dos veces.
// Documentación: https://developers.facebook.com/docs/marketing-api/conversions-api

function sha256(value) {
  return createHash("sha256").update(String(value).trim().toLowerCase()).digest("hex");
}

export async function sendPurchaseCapiEvent(order) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CONVERSION_API_TOKEN;
  // Si no hay token configurado, esta parte queda inactiva sin romper nada
  // — el evento del navegador sigue funcionando de todas formas.
  if (!pixelId || !token) return { skipped: true };

  const eventId = `order_${order.numero}`;
  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        user_data: {
          em: order.cliente_correo ? [sha256(order.cliente_correo)] : undefined,
          ph: order.cliente_celular ? [sha256(order.cliente_celular.replace(/\D/g, ""))] : undefined,
        },
        custom_data: {
          currency: "COP",
          value: Number(order.total) || 0,
          content_type: "product",
          content_ids: (order.items || []).map((it) => it.product_id || it.id),
          num_items: (order.items || []).reduce((s, it) => s + (it.qty || 0), 0),
        },
      },
    ],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return { ok: res.ok, response: json };
  } catch (e) {
    // No queremos que un fallo de Meta rompa la confirmación del pedido.
    return { ok: false, error: e.message };
  }
}
