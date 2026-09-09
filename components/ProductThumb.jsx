function BottleArt({ genero }) {
  const hue = genero === "Mujer" ? "#7C2B36" : genero === "Hombre" ? "#8C6B32" : "#4B5B52";
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="120" height="160" fill="#141316" />
      <rect x="42" y="48" width="36" height="80" rx="3" fill="none" stroke={hue} strokeWidth="1.4" />
      <rect x="48" y="30" width="24" height="18" rx="2" fill={hue} opacity="0.85" />
      <rect x="46" y="58" width="28" height="55" fill={hue} opacity="0.18" />
      <line x1="60" y1="16" x2="60" y2="30" stroke={hue} strokeWidth="1" opacity="0.6" />
      <circle cx="60" cy="12" r="3" fill="none" stroke={hue} strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

export default function ProductThumb({ product, priority }) {
  if (product?.imagen) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={product.imagen}
        alt={`${product.nombre} ${product.marca}`}
        className="pi-thumb-img"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }
  return <BottleArt genero={product?.genero} />;
}
