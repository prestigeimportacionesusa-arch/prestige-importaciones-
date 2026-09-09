"use client";

import Link from "next/link";
import { formatCOP, computeFinalPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import ProductThumb from "./ProductThumb";

function Badge({ children, tone = "gold" }) {
  return <span className={`pi-badge tone-${tone}`}>{children}</span>;
}

export default function ProductCard({ product, promotions }) {
  const { addToCart } = useCart();
  const { price, original, isOffer } = computeFinalPrice(product, promotions);
  const pct = isOffer && original > price ? Math.round(100 - (price / original) * 100) : 0;

  return (
    <div className="pi-card">
      <Link href={`/producto/${product.slug}`} className="pi-card-media">
        <ProductThumb product={product} />
        <div className="pi-card-badges">
          {product.nuevo ? <Badge tone="teal">Nuevo</Badge> : null}
          {isOffer && pct > 0 ? <Badge tone="wine">-{pct}%</Badge> : null}
          {!product.disponibilidad ? <Badge tone="muted">Agotado</Badge> : null}
          {product.disponibilidad && Number.isFinite(product.inventario) && product.inventario > 0 && product.inventario <= 5 ? (
            <Badge tone="wine">Últimas unidades</Badge>
          ) : null}
        </div>
      </Link>
      <div className="pi-card-body">
        <div className="pi-card-brand">{product.marca}</div>
        <Link href={`/producto/${product.slug}`} className="pi-card-name">{product.nombre}</Link>
        <div className="pi-card-gender">{product.genero}</div>
        <div className="pi-card-prices">
          {isOffer && original > price ? <span className="was">{formatCOP(original)}</span> : null}
          <span className="now">{formatCOP(price)}</span>
        </div>
        <div className="pi-card-actions">
          <Link href={`/producto/${product.slug}`} className="btn btn-ghost">Ver producto</Link>
          <button
            className="btn btn-primary"
            disabled={!product.disponibilidad}
            onClick={() => addToCart(product, 1)}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
