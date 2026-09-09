"use client";

// Envoltorios seguros sobre window.fbq: si el píxel todavía no cargó (o el
// usuario tiene un bloqueador de anuncios), simplemente no hacen nada en
// vez de lanzar un error que rompa la página.

function fbq(...args) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

export function trackViewContent(product) {
  fbq("track", "ViewContent", {
    content_ids: [product.id],
    content_name: `${product.nombre} ${product.marca}`,
    content_category: product.categoria || product.genero,
    content_type: "product",
    value: Number(product.precio) || 0,
    currency: "COP",
  });
}

export function trackAddToCart(product, qty = 1, price) {
  fbq("track", "AddToCart", {
    content_ids: [product.id],
    content_name: `${product.nombre} ${product.marca}`,
    content_type: "product",
    value: (Number(price ?? product.precio) || 0) * qty,
    currency: "COP",
  });
}

export function trackInitiateCheckout(lines, total) {
  fbq("track", "InitiateCheckout", {
    content_ids: lines.map((l) => l.id),
    content_type: "product",
    num_items: lines.reduce((s, l) => s + l.qty, 0),
    value: total,
    currency: "COP",
  });
}

// eventId: mismo id que usamos en el evento gemelo enviado por el servidor
// (Conversion API) para que Meta pueda deduplicar y no contar la compra dos
// veces si ambos se disparan.
export function trackPurchase(order, eventId) {
  fbq(
    "track",
    "Purchase",
    {
      content_ids: order.items.map((it) => it.id),
      content_type: "product",
      num_items: order.items.reduce((s, it) => s + it.qty, 0),
      value: Number(order.total) || 0,
      currency: "COP",
    },
    { eventID: eventId }
  );
}
