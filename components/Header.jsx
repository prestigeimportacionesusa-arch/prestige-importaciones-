"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { IconSearch, IconBag } from "./Icons";

const NAV = [
  ["Inicio", "/"],
  ["Tienda", "/tienda"],
  ["Hombre", "/tienda?genero=Hombre"],
  ["Mujer", "/tienda?genero=Mujer"],
  ["Unisex", "/tienda?genero=Unisex"],
  ["Ofertas", "/tienda?ofertas=1"],
  ["Marcas", "/marcas"],
];

export default function Header({ nombreTienda }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const { cart } = useCart();
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <header className="pi-header">
      <div className="pi-header-top">
        <Link href="/" className="pi-logo">
          <span className="pi-logo-mark">PU</span>
          <span className="pi-logo-text">{nombreTienda}</span>
        </Link>
        <form
          className="pi-search"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/tienda?buscar=${encodeURIComponent(q)}`);
          }}
        >
          <IconSearch />
          <input
            placeholder="Buscar perfumes, marcas, notas..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <div className="pi-header-actions">
          <Link href="/carrito" className="pi-icon-btn" aria-label="Carrito">
            <IconBag />
            {cartCount > 0 ? <span className="pi-cart-count">{cartCount}</span> : null}
          </Link>
        </div>
      </div>
      <nav className="pi-nav">
        {NAV.map(([label, href]) => (
          <Link key={label} href={href} className="pi-nav-link">
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
