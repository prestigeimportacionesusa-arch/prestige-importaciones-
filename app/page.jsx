import Link from "next/link";
import { getConfig, getProducts, getBrands, getBanners, getPromotions } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { Diamond, IconShield, IconTruck, IconBag, IconCard } from "@/components/Icons";

export default async function HomePage() {
  const [config, products, brands, banners, promotions] = await Promise.all([
    getConfig(),
    getProducts(),
    getBrands(),
    getBanners(),
    getPromotions(),
  ]);

  const activeBanners = banners.filter((b) => b.activo);
  const banner = activeBanners[0] || {
    titulo: "PERFUMES 100% ORIGINALES",
    subtitulo: "Encuentra tu próxima fragancia favorita",
    cta: "Comprar ahora",
  };
  const destacados = products.filter((p) => p.destacado);
  const featured = (destacados.length ? destacados : products.slice(0, 8)).slice(0, 8);

  const brandCounts = {};
  products.forEach((p) => { brandCounts[p.marca] = (brandCounts[p.marca] || 0) + 1; });
  const topBrands = brands.slice().sort((a, b) => (brandCounts[b.nombre] || 0) - (brandCounts[a.nombre] || 0)).slice(0, 8);

  return (
    <div>
      <section className="pi-hero">
        <div className="pi-hero-text">
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

      {topBrands.length ? (
        <section className="pi-section pi-brands-strip">
          <div className="pi-section-title align-left">
            <div className="pi-eyebrow">Casas de perfumería</div>
            <h2>Marcas que manejamos</h2>
            <Diamond />
          </div>
          <div className="pi-brand-row">
            {topBrands.map((b) => (
              <Link key={b.id} href={`/tienda?marca=${encodeURIComponent(b.nombre)}`} className="pi-brand-chip">
                {b.nombre}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

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
