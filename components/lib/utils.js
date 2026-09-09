export function formatCOP(n) {
  const num = Math.round(Number(n) || 0);
  return "$" + num.toLocaleString("es-CO").replace(/,/g, ".");
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Calcula el precio final de un producto aplicando, en este orden de
// prioridad: 1) precio_anterior manual puesto por el admin, 2) la mejor
// promoción activa que aplique (por producto, marca, categoría o todos).
export function computeFinalPrice(product, promotions) {
  const original = Number(product.precio) || 0;
  if (product.precio_anterior && Number(product.precio_anterior) > original) {
    return { price: original, original: Number(product.precio_anterior), isOffer: true };
  }
  let bestDiscount = 0;
  (promotions || []).forEach((promo) => {
    if (!promo.activa) return;
    const applies =
      promo.alcance === "todos" ||
      (promo.alcance === "marca" && promo.alcance_valor === product.marca) ||
      (promo.alcance === "categoria" && promo.alcance_valor === product.categoria) ||
      (promo.alcance === "producto" && promo.alcance_valor === product.id);
    if (!applies) return;
    if (promo.tipo === "porcentaje") {
      const d = (original * Number(promo.valor)) / 100;
      if (d > bestDiscount) bestDiscount = d;
    } else if (promo.tipo === "fijo") {
      if (Number(promo.valor) > bestDiscount) bestDiscount = Number(promo.valor);
    }
  });
  if (bestDiscount > 0) {
    return { price: Math.max(0, Math.round(original - bestDiscount)), original, isOffer: true };
  }
  return { price: original, original, isOffer: !!product.oferta };
}

export function hasFreeShipping(subtotal, config, promotions) {
  if (config.envio_gratis_desde && subtotal >= Number(config.envio_gratis_desde)) return true;
  return (promotions || []).some((p) => p.activa && p.tipo === "envio_gratis" && p.alcance === "todos");
}

// Recargo por método de pago: fijo en pesos o porcentual sobre el total base
// (subtotal + envío), configurable desde el panel administrativo.
export function computeRecargo(config, metodo, baseAmount) {
  const regla = (config.recargos || {})[metodo];
  if (!regla || !Number(regla.valor)) return 0;
  if (regla.tipo === "porcentaje") return Math.round((baseAmount * Number(regla.valor)) / 100);
  return Number(regla.valor);
}

export function recargoLabel(config, metodo) {
  const regla = (config.recargos || {})[metodo];
  if (!regla || !Number(regla.valor)) return "";
  return regla.tipo === "porcentaje" ? `+${regla.valor}%` : `+${formatCOP(regla.valor)}`;
}

export const PAYMENT_METHOD_LABELS = {
  contraentrega: "Pago contra entrega",
  tarjeta: "Tarjeta débito/crédito",
  pse: "PSE",
  transferencia: "Transferencia bancaria (Nequi/Bancolombia)",
};
