"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Diamond } from "./Icons";

const FALLBACK_BANNER = {
  titulo: "PERFUMES 100% ORIGINALES",
  subtitulo: "Encuentra tu próxima fragancia favorita",
  cta: "Comprar ahora",
  imagen: "",
  mostrar_boton: true,
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
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const banner = slides[index];
  const hasImage = !!banner.imagen;
  const goPrev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const goNext = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <section className="pi-hero">
      {hasImage ? (
        <div className="pi-hero-image-wrap">
          <Image
            src={banner.imagen}
            alt={banner.titulo || "Promoción"}
            width={1600}
            height={900}
            sizes="100vw"
            className="pi-hero-image"
            priority={index === 0}
            quality={78}
          />
          {banner.mostrar_boton ? (
            <div className="pi-hero-image-cta">
              <Link href="/tienda" className="btn btn-primary btn-lg">{banner.cta || "Comprar ahora"}</Link>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="pi-hero-fallback">
          <BottleSilhouettes />
          <div className="pi-hero-text">
            <Diamond />
            <h1>{banner.titulo}</h1>
            <p>{banner.subtitulo}</p>
            {banner.mostrar_boton !== false ? (
              <Link href="/tienda" className="btn btn-primary btn-lg">{banner.cta || "Comprar ahora"}</Link>
            ) : null}
          </div>
        </div>
      )}
      {slides.length > 1 ? (
        <>
          <button className="pi-hero-arrow pi-hero-arrow-prev" onClick={goPrev} aria-label="Banner anterior">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button className="pi-hero-arrow pi-hero-arrow-next" onClick={goNext} aria-label="Siguiente banner">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </>
      ) : null}
    </section>
  );
}
