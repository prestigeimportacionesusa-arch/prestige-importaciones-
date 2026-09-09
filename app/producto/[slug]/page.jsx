import { notFound } from "next/navigation";
import { getProductBySlug, getProducts, getPromotions, getConfig, getApprovedReviews } from "@/lib/data";
import { formatCOP, computeFinalPrice } from "@/lib/utils";
import ProductThumb from "@/components/ProductThumb";
import ProductActions from "@/components/ProductActions";
import TrackViewContent from "@/components/TrackViewContent";
import ProductCard from "@/components/ProductCard";
import { Diamond } from "@/components/Icons";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  const title = `${product.nombre} ${product.marca}`;
  const description = product.descripcion || `${product.nombre} de ${product.marca}, ${product.genero.toLowerCase()}. Perfume 100% original.`;
  // Solo usamos la imagen para compartir en redes si es una URL real
  // (http/https) — las fotos importadas del catálogo original son datos
  // incrustados (data:image/...) y Facebook/WhatsApp no pueden mostrarlas
  // como vista previa.
  const shareImage = product.imagen && product.imagen.startsWith("http") ? product.imagen : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      title: `${title} — Prestige Importaciones`,
      description,
      type: "website",
      images: shareImage ? [{ url: shareImage }] : undefined,
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const [product, allProducts, promotions, config] = await Promise.all([
    getProductBySlug(slug),
    getProducts(),
    getPromotions(),
    getConfig(),
  ]);

  if (!product) notFound();

  const reviews = await getApprovedReviews(product.id);
  const { price, original, isOffer } = computeFinalPrice(product, promotions);
  const related = allProducts
    .filter((p) => p.id !== product.id && (p.marca === product.marca || p.genero === product.genero))
    .slice(0, 4);
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.estrellas, 0) / reviews.length).toFixed(1) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.nombre} ${product.marca}`,
    brand: { "@type": "Brand", name: product.marca },
    description: product.descripcion || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "COP",
      price: price,
      availability: product.disponibilidad ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="pi-product-page">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="pi-product-top">
        <div className="pi-product-gallery-col">
          <div className="pi-product-gallery"><ProductThumb product={product} priority /></div>
          {product.imagenes_adicionales?.length ? (
            <div className="pi-gallery-thumbs">
              {product.imagenes_adicionales.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt={product.nombre} className="pi-gallery-thumb" />
              ))}
            </div>
          ) : null}
        </div>
        <div className="pi-product-info">
          <div className="pi-card-brand">{product.marca}</div>
          <h1>{product.nombre}</h1>
          <div className="pi-card-gender">{product.genero}{product.tamano_ml ? ` · ${product.tamano_ml} ml` : ""}</div>
          {avg ? <div className="pi-rating">★ {avg} ({reviews.length} reseñas)</div> : null}
          <div className="pi-card-prices pi-product-prices">
            {isOffer && original > price ? <span className="was">{formatCOP(original)}</span> : null}
            <span className="now">{formatCOP(price)}</span>
          </div>
          {product.disponibilidad && Number.isFinite(product.inventario) && product.inventario > 0 && product.inventario <= 5 ? (
            <div className="pi-lastunits">Últimas {product.inventario} unidades</div>
          ) : null}
          {product.descripcion ? <p className="pi-product-desc">{product.descripcion}</p> : null}
          {product.acordes_principales?.length ? (
            <div className="pi-accords">
              <label>Acordes principales</label>
              <div className="pi-accord-chips">
                {product.acordes_principales.map((a) => <span key={a} className="pi-chip">{a}</span>)}
              </div>
            </div>
          ) : null}
          <ProductActions product={product} price={price} whatsapp={config.whatsapp} />
          <TrackViewContent product={product} price={price} />
        </div>
      </div>

      {reviews.length ? (
        <div className="pi-section">
          <div className="pi-section-title align-left"><h2>Reseñas de clientes</h2><Diamond /></div>
          <div className="pi-reviews-list">
            {reviews.map((r) => (
              <div key={r.id} className="pi-review">
                <div className="pi-review-stars">{"★".repeat(r.estrellas)}{"☆".repeat(5 - r.estrellas)}</div>
                <div className="pi-review-author">{r.nombre}</div>
                <p>{r.comentario}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {related.length ? (
        <div className="pi-section">
          <div className="pi-section-title align-left"><h2>También te puede interesar</h2><Diamond /></div>
          <div className="pi-grid">
            {related.map((p) => <ProductCard key={p.id} product={p} promotions={promotions} />)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
