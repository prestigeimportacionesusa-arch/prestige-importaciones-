"use client";

import { useState } from "react";

const PAGE_SIZE = 5;

export default function ReviewsList({ reviews, defaultProductName }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = reviews.slice(0, visible);
  const hasMore = visible < reviews.length;

  return (
    <>
      <div className="pi-reviews-list">
        {shown.map((r) => (
          <div key={r.id} className="pi-review">
            <div className="pi-review-stars">{"★".repeat(r.estrellas)}{"☆".repeat(5 - r.estrellas)}</div>
            <div className="pi-review-author">{r.nombre} <span className="pi-review-product-tag">· {r.products?.nombre || defaultProductName}</span></div>
            <p>{r.comentario}</p>
            {r.fotos?.length ? (
              <div className="pi-review-photos-list">
                {r.fotos.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt={`Foto de ${r.nombre}`} className="pi-review-photo" />
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {hasMore ? (
        <button className="btn btn-outline" onClick={() => setVisible((v) => v + PAGE_SIZE)} style={{ marginTop: 16 }}>
          Ver más reseñas ({reviews.length - visible} más)
        </button>
      ) : null}
    </>
  );
}
