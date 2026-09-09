import Link from "next/link";
import { getConfig, getProducts, getBanners, getPromotions } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { Diamond, IconShield, IconTruck, IconBag, IconCard } from "@/components/Icons";

export default async function HomePage() {
  const [config, products, banners, promotions] = await Promise.all([
    getConfig(),
    getProducts(),
    getBanners(),
    getPromotions(),
  ]);

  const activeBanners = banners.filter((b) => b.activo);
  const banner = activeBanners[0] || {
    titulo: "PERFUMES 100% ORIGINALES",
    subtitulo: "Encuentra tu próxima fragancia favorita",
    cta: "Comprar ahora",
    promo_badge: "",
  };
  const destacados = products.filter((p) => p.destacado);
  const featured = (destacados.length ? destacados : products.slice(0, 8)).slice(0, 8);

  return (
    <div>
      <section className="pi-hero">
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
        <div className="pi-hero-text">
          {banner.promo_badge ? <span className="pi-hero-badge">{banner.promo_badge}</span> : null}
          <Diamond />
          <h1>{banner.titulo}</h1>
          <p>{banner.subtitulo}</p>
          <Link href="/tienda" className="btn btn-primary btn-lg">{banner.cta || "Comprar ahora"}</Link>
        </div>
      </section>

      <section className="pi-benefits">
        <div className="pi-benefit"><IconShield /><div><b>100% originales</b><span>Garantía de autenticidad</span></div></div>
        <div className="pi-benefit"><IconTruck /><div><b>Envíos a todo Colombia</b><span>{config.ciudades}</span></div></div>
        <div className="pi-benefit"><IconBag /><div><b>Pago contra entrega</b><span>Paga cuando lo recibes</span></div></div>
        <div className="pi-benefit"><IconCard /><div><b>Todos los medios de pago</b><span>Tarjetas, PSE, transferencia</span></div></div>
      </section>

      {(config.instagram || config.tiktok) ? (
        <section className="pi-social-banner">
          <span className="pi-social-banner-label">Síguenos</span>
          <div className="pi-social-banner-links">
            {config.instagram ? (
              <a href={config.instagram} target="_blank" rel="noreferrer">📸 Instagram</a>
            ) : null}
            {config.tiktok ? (
              <a href={config.tiktok} target="_blank" rel="noreferrer">🎵 TikTok</a>
            ) : null}
          </div>
        </section>
      ) : null}

      {featured.length ? (
        <section className="pi-section">
          <div className="pi-section-title align-left">
            <div className="pi-eyebrow">Selección</div>
            <h2>Destacados</h2>
            <Diamond />
          </div>
          <div className="pi-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} promotions={promotions} />
            ))}
          </div>
          <div className="pi-center"><Link href="/tienda" className="btn btn-outline">Ver todo el catálogo</Link></div>
        </section>
      ) : (
        <section className="pi-section">
          <p style={{ color: "var(--muted)" }}>
            Aún no hay productos cargados. Corre <code>npm run seed</code> para importar el catálogo, o agrega
            productos desde <Link href="/admin" style={{ color: "var(--gold)" }}>el panel administrativo</Link>.
          </p>
        </section>
      )}


      <section className="pi-section pi-wholesale-cta">
        <div>
          <div className="pi-section-title align-left">
            <div className="pi-eyebrow">Para negocios</div>
            <h2>Venta mayorista</h2>
            <Diamond />
          </div>
          <p>Precios especiales por volumen para tiendas y distribuidores.</p>
        </div>
        <Link href="/mayorista" className="btn btn-outline">Solicitar información</Link>
      </section>
    </div>
  );
}
