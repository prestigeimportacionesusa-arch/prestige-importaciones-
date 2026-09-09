"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/lib/meta-pixel";

export default function TrackViewContent({ product, price }) {
  useEffect(() => {
    trackViewContent({ ...product, precio: price });
    // Solo queremos disparar esto una vez, al montar la página del producto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  return null;
}
