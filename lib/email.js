import { formatCOP } from "@/lib/utils";

// Envía un correo usando Resend (resend.com). Si no está configurado
// (falta la llave o el correo destino), simplemente no hace nada — nunca
// rompe el flujo de compra del cliente por un problema de notificaciones.
async function sendEmail({ subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!apiKey || !to) return { skipped: true };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Prestige Importaciones <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
    const json = await res.json();
    return { ok: res.ok, response: json };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

const METODOS_ONLINE = ["Tarjeta débito/crédito", "PSE"];

// Se llama justo cuando se crea un pedido nuevo (cualquier método de pago).
// El mensaje cambia según qué necesita revisar el vendedor primero.
export async function notifyNewOrder(order) {
  const esOnline = METODOS_ONLINE.includes(order.metodo_pago);
  const accion = esOnline
    ? "Este pedido se paga en línea — revisa en el panel si el 'Estado de pago' ya cambió a 'Pagado' antes de alistarlo."
    : order.metodo_pago === "Transferencia bancaria (Nequi/Bancolombia)"
    ? "El cliente debe enviarte el comprobante por WhatsApp — confírmalo antes de alistar el pedido."
    : "Pago contra entrega — revisa los datos de envío y alista el pedido.";

  const html = `
    <h2>Nuevo pedido #${order.numero}</h2>
    <p><b>Método de pago:</b> ${order.metodo_pago}</p>
    <p><b>Total:</b> ${formatCOP(order.total)}</p>
    <p><b>Cliente:</b> ${order.cliente_nombre} — ${order.cliente_celular}</p>
    <p><b>Dirección:</b> ${order.cliente_direccion}${order.barrio ? ", barrio " + order.barrio : ""}, ${order.cliente_ciudad} (${order.cliente_departamento})</p>
    <p style="margin-top:16px;"><b>Qué hacer ahora:</b> ${accion}</p>
    <p><a href="https://prestige-importaciones.vercel.app/admin/pedidos">Ver en el panel de administración</a></p>
  `;

  return sendEmail({ subject: `🛍️ Nuevo pedido #${order.numero} — ${formatCOP(order.total)}`, html });
}

// Se llama desde el webhook de Wompi cuando un pago con tarjeta/PSE se
// confirma (aprobado o rechazado) — para que sepas que ya puedes alistar
// el pedido, sin tener que estar revisando el panel a cada rato.
export async function notifyPaymentUpdate(order, estadoPago) {
  const aprobado = estadoPago === "Pagado";
  const html = `
    <h2>${aprobado ? "✅ Pago confirmado" : "❌ Pago rechazado"} — Pedido #${order.numero}</h2>
    <p><b>Total:</b> ${formatCOP(order.total)}</p>
    <p><b>Cliente:</b> ${order.cliente_nombre} — ${order.cliente_celular}</p>
    ${aprobado ? "<p>Ya puedes alistar y enviar este pedido.</p>" : "<p>El cliente puede intentar pagar de nuevo o elegir otro método.</p>"}
    <p><a href="https://prestige-importaciones.vercel.app/admin/pedidos">Ver en el panel de administración</a></p>
  `;
  return sendEmail({
    subject: `${aprobado ? "✅" : "❌"} Pedido #${order.numero} — ${aprobado ? "Pago confirmado" : "Pago rechazado"}`,
    html,
  });
}
