import Image from "next/image";
import { BLUR_PLACEHOLDER } from "@/lib/utils";

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
  const src = product?.imagen;
  if (src) {
    // Las URLs reales (http/https, ej. fotos subidas a postimg.cc) pasan por
    // el optimizador de Next.js: se comprimen, se convierten a WebP, y se
    // sirven en el tamaño justo para cada pantalla — así una foto pesada
    // tomada con el celular no hace lenta la tienda para los clientes.
    // Las fotos originales del catálogo (guardadas como data:image...) se
    // muestran directo, ya vienen livianas desde la importación inicial.
    if (src.startsWith("http")) {
      return (
        <Image
          src={src}
          alt={`${product.nombre} ${product.marca}`}
          fill
          sizes="(max-width: 700px) 50vw, (max-width: 960px) 33vw, 25vw"
          className="pi-thumb-img"
          priority={!!priority}
          quality={65}
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
        />
      );
    }
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={`${product.nombre} ${product.marca}`}
        className="pi-thumb-img"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }
  return <BottleArt genero={product?.genero} />;
}
