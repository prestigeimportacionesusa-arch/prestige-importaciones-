"use client";

import { useState } from "react";
import ProductThumb from "./ProductThumb";

export default function ProductGallery({ product }) {
  const allImages = [product.imagen, ...(product.imagenes_adicionales || [])].filter(Boolean);
  const [selected, setSelected] = useState(0);

  if (!allImages.length) {
    return (
      <div className="pi-product-gallery-col">
        <div className="pi-product-gallery"><ProductThumb product={product} priority /></div>
      </div>
    );
  }

  return (
    <div className="pi-product-gallery-col">
      <div className="pi-product-gallery">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={allImages[selected]} alt={`${product.nombre} ${product.marca}`} className="pi-thumb-img" />
      </div>
      {allImages.length > 1 ? (
        <div className="pi-gallery-thumbs">
          {allImages.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url + i}
              src={url}
              alt={`${product.nombre} vista ${i + 1}`}
              className={`pi-gallery-thumb ${i === selected ? "active" : ""}`}
              onClick={() => setSelected(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
