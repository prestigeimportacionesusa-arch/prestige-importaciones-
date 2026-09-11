"use client";

import { useState } from "react";
import { submitReview } from "@/lib/actions";

export default function ReviewForm({ productId, slug, sent, error }) {
  const [stars, setStars] = useState(5);
  const [hover, setHover] = useState(0);

  if (sent) {
    return (
      <div className="pi-review-thanks">
        ¡Gracias por tu reseña! Se publicará en cuanto la revisemos.
      </div>
    );
  }

  return (
    <form action={submitReview} className="pi-review-form">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="estrellas" value={stars} />
      <h3>Deja tu reseña</h3>
      {error ? <div className="pi-error">Completa tu nombre y una calificación antes de enviar.</div> : null}
      <div className="pi-review-star-picker">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="pi-review-star-btn"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setStars(n)}
            aria-label={`${n} estrellas`}
          >
            {(hover || stars) >= n ? "★" : "☆"}
          </button>
        ))}
      </div>
      <input name="nombre" placeholder="Tu nombre" required />
      <textarea name="comentario" placeholder="Cuéntanos tu experiencia (opcional)" />
      <button className="btn btn-outline" type="submit">Enviar reseña</button>
    </form>
  );
}
