import { createClient } from "@/lib/supabase/server";
import { saveBrand, deleteBrand } from "@/lib/actions";

export default async function AdminBrandsPage({ searchParams }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: brands } = await supabase.from("brands").select("*").order("nombre");
  const { count: totalProducts } = await supabase.from("products").select("id", { count: "exact", head: true });

  const editingId = sp?.editar;
  const editing = editingId ? (brands || []).find((b) => b.id === editingId) : null;

  const counts = {};
  const { data: products } = await supabase.from("products").select("marca");
  (products || []).forEach((p) => { counts[p.marca] = (counts[p.marca] || 0) + 1; });

  return (
    <div>
      <h2>Marcas</h2>

      <form action={saveBrand} className="pi-form-grid" style={{ marginBottom: 24 }}>
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
        <input name="nombre" placeholder="Nombre" defaultValue={editing?.nombre || ""} required className="pi-span-2" />
        <input name="logo" placeholder="URL del logo (opcional)" defaultValue={editing?.logo || ""} className="pi-span-2" />
        <textarea name="descripcion" placeholder="Descripción" defaultValue={editing?.descripcion || ""} className="pi-span-2" />
        <button className="btn btn-primary" type="submit">{editing ? "Guardar cambios" : "+ Agregar marca"}</button>
      </form>

      <ul className="pi-simple-list">
        {(brands || []).map((b) => (
          <li key={b.id}>
            <span><b>{b.nombre}</b> — {counts[b.nombre] || 0} productos</span>
            <span>
              <a href={`/admin/marcas?editar=${b.id}`} className="btn btn-ghost btn-sm">Editar</a>
              <form action={deleteBrand} style={{ display: "inline" }}>
                <input type="hidden" name="id" value={b.id} />
                <button className="btn btn-ghost btn-sm" type="submit">Eliminar</button>
              </form>
            </span>
          </li>
        ))}
        {!brands?.length ? <li>Aún no hay marcas.</li> : null}
      </ul>
    </div>
  );
}
