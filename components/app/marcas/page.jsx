import Link from "next/link";
import { getBrands, getProducts } from "@/lib/data";
import { Diamond } from "@/components/Icons";

export const metadata = { title: "Marcas — Prestige Importaciones" };

export default async function BrandsPage() {
  const [brands, products] = await Promise.all([getBrands(), getProducts()]);

  return (
    <div className="pi-section">
      <div className="pi-section-title align-left">
        <div className="pi-eyebrow">Casas de perfumería</div>
        <h2>Nuestras marcas</h2>
        <Diamond />
      </div>
      <div className="pi-brands-grid">
        {brands.map((b) => {
          const count = products.filter((p) => p.marca === b.nombre).length;
          return (
            <Link key={b.id} href={`/tienda?marca=${encodeURIComponent(b.nombre)}`} className="pi-brand-card">
              <div className="pi-brand-card-name">{b.nombre}</div>
              <div className="pi-brand-card-count">{count} referencias</div>
              {b.descripcion ? <p>{b.descripcion}</p> : null}
            </Link>
          );
        })}
        {!brands.length ? <p style={{ color: "var(--muted)" }}>Aún no hay marcas cargadas.</p> : null}
      </div>
    </div>
  );
}
