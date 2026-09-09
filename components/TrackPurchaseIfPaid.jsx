"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/meta-pixel";

export default function TrackPurchaseIfPaid({ order }) {
  useEffect(() => {
    if (order.estado_pago === "Pagado") {
      // Mismo event_id que usamos en el envío por Conversion API desde el
      // webhook, para que Meta pueda deduplicar si ambos llegan.
      trackPurchase(order, `order_${order.numero}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.estado_pago]);

  return null;
}
