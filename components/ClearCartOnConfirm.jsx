"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-context";

// Vacía el carrito cuando el cliente vuelve de Wompi con un pago aprobado o
// en proceso. Si el pago fue rechazado, esta pieza no se usa y el carrito se
// conserva para que pueda intentar de nuevo con otro método.
// Espera a que el carrito termine de cargarse del navegador antes de
// vaciarlo (si no, la carga lo volvería a llenar).
export default function ClearCartOnConfirm({ clear }) {
  const { cart, clearCart } = useCart();
  const done = useRef(false);
  useEffect(() => {
    if (clear && !done.current && cart.length > 0) {
      done.current = true;
      clearCart();
    }
  }, [clear, cart.length, clearCart]);
  return null;
}
