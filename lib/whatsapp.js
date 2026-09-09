import { formatCOP } from "./utils";

export function waUrl(phone, text) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function waProductMessage(product, price) {
  return `Hola, quiero información sobre *${product.nombre} ${product.marca}* (${formatCOP(price)}). ¿Está disponible?`;
}

export function waCartMessage(lines, subtotal, envio, comboDiscount = 0) {
  const out = ["Hola, quiero hacer este pedido:", ""];
  lines.forEach((l) => {
    out.push(`• ${l.nombre} ${l.marca} x${l.qty} — ${formatCOP(l.subtotal)}`);
  });
  out.push("");
  if (comboDiscount > 0) {
    out.push(`Subtotal: ${formatCOP(subtotal + comboDiscount)}`);
    out.push(`Descuento combo 2x$409.000: −${formatCOP(comboDiscount)}`);
  } else {
    out.push(`Subtotal: ${formatCOP(subtotal)}`);
  }
  out.push(`Envío: ${envio === 0 ? "Gratis" : formatCOP(envio)}`);
  out.push(`Total: ${formatCOP(subtotal + envio)}`);
  return out.join("\n");
}

export function waOrderMessage(order) {
  const lines = [
    `Hola, confirmo mi pedido *#${order.numero}*:`,
    "",
    ...order.items.map((it) => `• ${it.nombre} ${it.marca} x${it.qty} — ${formatCOP(it.subtotal)}`),
    "",
    `Subtotal: ${formatCOP(order.subtotal)}`,
    `Envío: ${order.envio === 0 ? "Gratis" : formatCOP(order.envio)}`,
    ...(order.recargo ? [`Recargo (${order.metodo_pago}): ${formatCOP(order.recargo)}`] : []),
    `Total: ${formatCOP(order.total)}`,
    "",
    `Nombre: ${order.cliente_nombre}`,
    `Celular: ${order.cliente_celular}`,
    `Dirección: ${order.cliente_direccion}${order.barrio ? ", barrio " + order.barrio : ""}, ${order.cliente_ciudad} (${order.cliente_departamento})`,
    `Método de pago: ${order.metodo_pago}`,
    ...(order.estado_pago ? [`Estado del pago: ${order.estado_pago}`] : []),
  ];
  return lines.join("\n");
}

export function waWholesaleMessage() {
  return "Hola, quiero información para ser cliente mayorista de Prestige Importaciones.";
}
