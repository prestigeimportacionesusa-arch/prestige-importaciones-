"use client";

import { useState } from "react";
import Image from "next/image";
import ProductThumb from "./ProductThumb";
import { BLUR_PLACEHOLDER } from "@/lib/utils";

function GalleryImage({ src, alt, priority }) {
  if (src.startsWith("http")) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 700px) 90vw, 380px"
        className="pi-thumb-img"
        priority={!!priority}
        quality={70}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="pi-thumb-img" />;
}

function GalleryThumbImage({ src, alt }) {
  if (src.startsWith("http")) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes="56px"
        className="pi-thumb-img"
        quality={45}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="pi-thumb-img" />;
}

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
        <GalleryImage src={allImages[selected]} alt={`${product.nombre} ${product.marca}`} priority />
      </div>
      {allImages.length > 1 ? (
        <div className="pi-gallery-thumbs">
          {allImages.map((url, i) => (
            <button
              key={url + i}
              className={`pi-gallery-thumb-box ${i === selected ? "active" : ""}`}
              onClick={() => setSelected(i)}
              aria-label={`Ver foto ${i + 1}`}
            >
              <GalleryThumbImage src={url} alt={`${product.nombre} vista ${i + 1}`} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
