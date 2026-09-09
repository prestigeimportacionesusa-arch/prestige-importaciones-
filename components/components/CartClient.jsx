"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatCOP, computeFinalPrice, hasFreeShipping } from "@/lib/utils";
import { waUrl, waCartMessage } from "@/lib/whatsapp";
import { IconWhatsapp, IconClose } from "./Icons";
import ProductThumb from "./ProductThumb";

export default function CartClient({ products, promotions, config }) {
  const { cart, updateQty, removeItem } = useCart();

  const lines = cart
    .map((item) => {
      const p = products.find((x) => x.id === item.id);
      if (!p) return null;
      const { price } = computeFinalPrice(p, promotions);
      return { ...item, product: p, price, lineTotal: price * item.qty };
    })
    .filter(Boolean);

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const free = hasFreeShipping(subtotal, config, promotions);
  const envio = subtotal === 0 ? 0 : free ? 0 : Number(config.costo_envio) || 0;
  const total = subtotal + envio;

  if (!lines.length) {
    return (
      <div className="pi-empty-cart">
        <p>Tu carrito está vacío.</p>
        <Link href="/tienda" className="btn btn-primary">Ver catálogo</Link>
      </div>
    );
  }

  const waLines = lines.map((l) => ({ nombre: l.product.nombre, marca: l.product.marca, qty: l.qty, subtotal: l.lineTotal }));

  return (
    <div className="pi-cart-page">
      <h1>Tu carrito</h1>
      <div className="pi-cart-lines">
        {lines.map((l) => (
          <div className="pi-cart-line" key={l.id}>
            <div className="pi-cart-line-media"><ProductThumb product={l.product} /></div>
            <div className="pi-cart-line-info">
              <div className="pi-card-brand">{l.product.marca}</div>
              <div className="pi-card-name">{l.product.nombre}</div>
              <div className="pi-qty">
                <button onClick={() => updateQty(l.id, Math.max(1, l.qty - 1))}>−</button>
                <span>{l.qty}</span>
                <button onClick={() => updateQty(l.id, l.qty + 1)}>+</button>
              </div>
            </div>
            <div className="pi-cart-line-price">{formatCOP(l.lineTotal)}</div>
            <button className="pi-remove" onClick={() => removeItem(l.id)} aria-label="Eliminar"><IconClose /></button>
          </div>
        ))}
      </div>
      <div className="pi-cart-summary">
        <div className="pi-summary-row"><span>Subtotal</span><span>{formatCOP(subtotal)}</span></div>
        <div className="pi-summary-row"><span>Envío</span><span>{envio === 0 ? "Gratis" : formatCOP(envio)}</span></div>
        <div className="pi-summary-row total"><span>Total</span><span>{formatCOP(total)}</span></div>
        <div className="pi-cart-cta">
          <Link href="/tienda" className="btn btn-outline">Seguir comprando</Link>
          <Link href="/checkout" className="btn btn-primary">Finalizar compra</Link>
        </div>
        <a className="btn btn-wa btn-block" href={waUrl(config.whatsapp, waCartMessage(waLines, subtotal, envio))} target="_blank" rel="noreferrer">
          <IconWhatsapp size={18} /> Realizar pedido por WhatsApp
        </a>
      </div>
    </div>
  );
}
