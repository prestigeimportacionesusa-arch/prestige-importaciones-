"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Diamond } from "./Icons";

const FALLBACK_BANNER = {
  titulo: "PERFUMES 100% ORIGINALES",
  subtitulo: "Encuentra tu próxima fragancia favorita",
  cta: "Comprar ahora",
  promo_badge: "",
  imagen: "",
};

function BottleSilhouettes() {
  return (
    <div className="pi-hero-bg" aria-hidden="true">
      <svg viewBox="0 0 500 500" className="pi-hero-bottle pi-hero-bottle-1">
        <rect x="180" y="130" width="140" height="280" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="205" y="90" width="90" height="46" rx="6" fill="currentColor" opacity="0.9" />
        <line x1="250" y1="60" x2="250" y2="90" stroke="currentColor" strokeWidth="2" />
        <circle cx="250" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg viewBox="0 0 500 500" className="pi-hero-bottle pi-hero-bottle-2">
        <rect x="330" y="220" width="70" height="150" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="345" y="195" width="40" height="28" rx="3" fill="currentColor" opacity="0.7" />
      </svg>
    </div>
  );
}

export default function HeroCarousel({ banners }) {
  const slides = banners && banners.length ? banners : [FALLBACK_BANNER];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const banner = slides[index];

  return (
    <section
      className={`pi-hero ${banner.imagen ? "pi-hero-has-image" : ""}`}
      style={banner.imagen ? { backgroundImage: `url(${banner.imagen})` } : undefined}
    >
      {!banner.imagen ? <BottleSilhouettes /> : null}
      <div className="pi-hero-text">
        {banner.promo_badge ? <span className="pi-hero-badge">{banner.promo_badge}</span> : null}
        <Diamond />
        <h1>{banner.titulo}</h1>
        <p>{banner.subtitulo}</p>
        <Link href="/tienda" className="btn btn-primary btn-lg">{banner.cta || "Comprar ahora"}</Link>
      </div>
      {slides.length > 1 ? (
        <div className="pi-hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`pi-hero-dot ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Ver banner ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
