"use client";

import { useState, useMemo, useEffect } from "react";
import ProductCard from "./ProductCard";
import { formatCOP } from "@/lib/utils";

function useFilteredProducts(products, filters) {
  return useMemo(() => {
    let list = products.slice();
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.marca.toLowerCase().includes(q) ||
          (p.acordes_principales || []).some((a) => a.toLowerCase().includes(q))
      );
    }
    if (filters.genero) list = list.filter((p) => p.genero === filters.genero);
    if (filters.marca) list = list.filter((p) => p.marca === filters.marca);
    if (filters.categoria) list = list.filter((p) => p.categoria === filters.categoria);
    if (filters.soloOfertas) list = list.filter((p) => p.oferta || (p.precio_anterior && p.precio_anterior > p.precio));
    if (filters.soloDisponibles) list = list.filter((p) => p.disponibilidad);
    if (filters.precioMax) list = list.filter((p) => Number(p.precio) <= Number(filters.precioMax));

    switch (filters.orden) {
      case "precio_asc":
        list.sort((a, b) => a.precio - b.precio);
        break;
      case "precio_desc":
        list.sort((a, b) => b.precio - a.precio);
        break;
      case "nuevos":
        list.sort((a, b) => (b.nuevo ? 1 : 0) - (a.nuevo ? 1 : 0));
        break;
      case "destacados":
        list.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
        break;
      default:
        break;
    }
    return list;
  }, [products, filters]);
}

const EMPTY_FILTERS = { genero: "", marca: "", categoria: "", precioMax: 0, soloOfertas: false, soloDisponibles: false, search: "", orden: "" };

export default function ShopClient({ products, brands, categories, promotions, initialFilters }) {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, ...initialFilters });
  const [visible, setVisible] = useState(12);
  const filtered = useFilteredProducts(products, filters);

  useEffect(() => { setVisible(12); }, [filters]);

  return (
    <div className="pi-shop">
      <aside className="pi-filters">
        <h3>Filtrar</h3>
        <div className="pi-filter-group">
          <label>Género</label>
          {["", "Hombre", "Mujer", "Unisex"].map((g) => (
            <button key={g || "all"} className={`pi-filter-opt ${filters.genero === g ? "active" : ""}`} onClick={() => setFilters({ ...filters, genero: g })}>
              {g || "Todos"}
            </button>
          ))}
        </div>
        <div className="pi-filter-group">
          <label>Marca</label>
          <select value={filters.marca} onChange={(e) => setFilters({ ...filters, marca: e.target.value })}>
            <option value="">Todas las marcas</option>
            {brands.map((b) => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
          </select>
        </div>
        <div className="pi-filter-group">
          <label>Categoría</label>
          <select value={filters.categoria} onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}>
            <option value="">Todas</option>
            {categories.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="pi-filter-group">
          <label>Precio máximo: {filters.precioMax ? formatCOP(filters.precioMax) : "Sin límite"}</label>
          <input type="range" min="100000" max="400000" step="10000" value={filters.precioMax || 400000}
            onChange={(e) => setFilters({ ...filters, precioMax: Number(e.target.value) })} />
        </div>
        <label className="pi-check"><input type="checkbox" checked={filters.soloOfertas} onChange={(e) => setFilters({ ...filters, soloOfertas: e.target.checked })} /> Solo ofertas</label>
        <label className="pi-check"><input type="checkbox" checked={filters.soloDisponibles} onChange={(e) => setFilters({ ...filters, soloDisponibles: e.target.checked })} /> Solo disponibles</label>
        <button className="btn btn-ghost" onClick={() => setFilters(EMPTY_FILTERS)}>Limpiar filtros</button>
      </aside>
      <div className="pi-shop-main">
        <div className="pi-shop-toolbar">
          <span>{filtered.length} resultados</span>
          <select value={filters.orden} onChange={(e) => setFilters({ ...filters, orden: e.target.value })}>
            <option value="">Ordenar por</option>
            <option value="destacados">Destacados</option>
            <option value="nuevos">Más nuevos</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="pi-empty">No encontramos perfumes con esos filtros. Prueba quitando alguno.</div>
        ) : (
          <div className="pi-grid">
            {filtered.slice(0, visible).map((p) => (
              <ProductCard key={p.id} product={p} promotions={promotions} />
            ))}
          </div>
        )}
        {visible < filtered.length ? (
          <div className="pi-center"><button className="btn btn-outline" onClick={() => setVisible((v) => v + 12)}>Cargar más</button></div>
        ) : null}
      </div>
    </div>
  );
}
