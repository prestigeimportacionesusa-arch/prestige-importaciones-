"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { waUrl, waProductMessage } from "@/lib/whatsapp";
import { IconWhatsapp } from "./Icons";

export default function ProductActions({ product, price, whatsapp }) {
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const router = useRouter();

  return (
    <>
      <div className="pi-qty-row">
        <div className="pi-qty">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span>{qty}</span>
          <button onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
        <button className="btn btn-primary" disabled={!product.disponibilidad} onClick={() => addToCart(product, qty)}>
          Agregar al carrito
        </button>
      </div>
      <div className="pi-product-actions-2">
        <button
          className="btn btn-outline"
          disabled={!product.disponibilidad}
          onClick={() => { addToCart(product, qty); router.push("/checkout"); }}
        >
          Comprar ahora
        </button>
        <a className="btn btn-wa" href={waUrl(whatsapp, waProductMessage(product, price))} target="_blank" rel="noreferrer">
          <IconWhatsapp size={18} /> Preguntar por WhatsApp
        </a>
      </div>
      {!product.disponibilidad ? <div className="pi-stock-warn">Agotado temporalmente</div> : null}
    </>
  );
}
