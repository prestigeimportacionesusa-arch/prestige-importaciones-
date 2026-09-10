import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils";
import { deleteProduct, toggleProductFlag } from "@/lib/actions";
import ProductThumb from "@/components/ProductThumb";

export default async function AdminProductsPage({ searchParams }) {
  const sp = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("products").select("*").order("orden").order("nombre");
  const { data: products } = await query;

  let list = (products || []).map((p) => ({
    ...p,
    _sinPrecio: !p.precio || Number(p.precio) <= 0,
    _sinImagen: !p.imagen,
  }));
  const q = sp?.q?.toLowerCase();
  const onlyReview = sp?.revisar === "1";
  if (q) list = list.filter((p) => (p.nombre + p.marca).toLowerCase().includes(q));
  if (onlyReview) list = list.filter((p) => p.revisar || p._sinPrecio || p._sinImagen);

  return (
    <div>
      <div className="pi-admin-toolbar">
        <h2>Productos ({products?.length || 0})</h2>
        <Link href="/admin/productos/nuevo" className="btn btn-primary">+ Nuevo producto</Link>
      </div>
      <form className="pi-admin-filters-row" method="get">
        <input name="q" placeholder="Buscar por nombre o marca..." defaultValue={sp?.q || ""} />
        <label className="pi-check">
          <input type="checkbox" name="revisar" value="1" defaultChecked={onlyReview} /> Solo por revisar
        </label>
        <button className="btn btn-outline btn-sm" type="submit">Filtrar</button>
      </form>
      <table className="pi-admin-table">
        <thead><tr><th></th><th>Nombre</th><th>Marca</th><th>Género</th><th>Precio</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id} className={(p.revisar || p._sinPrecio || p._sinImagen) ? "row-review" : ""}>
              <td><div className="pi-thumb-box"><ProductThumb product={p} /></div></td>
              <td>
                {p.nombre}
                {p.revisar ? <span className="pi-tag-review">revisar</span> : null}
                {p._sinPrecio ? <span className="pi-tag-review pi-tag-warn">sin precio</span> : null}
                {p._sinImagen ? <span className="pi-tag-review pi-tag-warn">sin imagen</span> : null}
              </td>
              <td>{p.marca}</td>
              <td>{p.genero}</td>
              <td>{formatCOP(p.precio)}</td>
              <td className="pi-flags">
                <form action={toggleProductFlag}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="slug" value={p.slug} />
                  <input type="hidden" name="field" value="destacado" />
                  <input type="hidden" name="value" value={String(p.destacado)} />
                  <button className={p.destacado ? "flag on" : "flag"} type="submit">Destacado</button>
                </form>
                <form action={toggleProductFlag}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="slug" value={p.slug} />
                  <input type="hidden" name="field" value="nuevo" />
                  <input type="hidden" name="value" value={String(p.nuevo)} />
                  <button className={p.nuevo ? "flag on" : "flag"} type="submit">Nuevo</button>
                </form>
                <form action={toggleProductFlag}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="slug" value={p.slug} />
                  <input type="hidden" name="field" value="oferta" />
                  <input type="hidden" name="value" value={String(p.oferta)} />
                  <button className={p.oferta ? "flag on" : "flag"} type="submit">Oferta</button>
                </form>
                <form action={toggleProductFlag}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="slug" value={p.slug} />
                  <input type="hidden" name="field" value="disponibilidad" />
                  <input type="hidden" name="value" value={String(p.disponibilidad)} />
                  <button className={p.disponibilidad ? "flag on" : "flag"} type="submit">{p.disponibilidad ? "Disponible" : "Agotado"}</button>
                </form>
              </td>
              <td>
                <Link href={`/admin/productos/${p.id}`} className="btn btn-ghost btn-sm">Editar</Link>
                <form action={deleteProduct} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn btn-ghost btn-sm" type="submit">Eliminar</button>
                </form>
              </td>
            </tr>
          ))}
          {!list.length ? <tr><td colSpan="7" className="pi-empty">No hay productos que coincidan.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
