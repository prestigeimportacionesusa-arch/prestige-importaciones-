"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { trackAddToCart } from "./meta-pixel";

const CartContext = createContext(null);
const STORAGE_KEY = "pi_cart";

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {
      // localStorage no disponible (modo privado, etc.) — el carrito solo
      // vive en memoria durante la sesión.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // no-op
    }
  }, [cart, ready]);

  const addToCart = useCallback((product, qty = 1, price) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) {
        return prev.map((c) => (c.id === product.id ? { ...c, qty: c.qty + qty } : c));
      }
      return [...prev, { id: product.id, qty }];
    });
    trackAddToCart(product, qty, price);
  }, []);

  const updateQty = useCallback((id, qty) => {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty } : c)));
  }, []);

  const removeItem = useCallback((id) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
