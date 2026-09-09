import Link from "next/link";
import { getConfig, getProducts, getBanners, getPromotions } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import HeroCarousel from "@/components/HeroCarousel";
import { Diamond, IconShield, IconTruck, IconBag, IconCard } from "@/components/Icons";

export default async function HomePage() {
  const [config, products, banners, promotions] = await Promise.all([
    getConfig(),
    getProducts(),
    getBanners(),
    getPromotions(),
  ]);

  const activeBanners = banners.filter((b) => b.activo);
  const destacados = products.filter((p) => p.destacado);
  const featured = (destacados.length ? destacados : products.slice(0, 8)).slice(0, 8);

  return (
    <div>
      <HeroCarousel banners={activeBanners} />

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
