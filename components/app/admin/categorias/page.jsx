import { createClient } from "@/lib/supabase/server";
import { saveCategory, deleteCategory } from "@/lib/actions";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("nombre");

  return (
    <div>
      <h2>Categorías</h2>
      <form action={saveCategory} className="pi-admin-toolbar">
        <input name="nombre" placeholder="Nueva categoría" required />
        <button className="btn btn-primary" type="submit">Agregar</button>
      </form>
      <ul className="pi-simple-list">
        {(categories || []).map((c) => (
          <li key={c.id}>
            <span>{c.nombre}</span>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <button className="btn btn-ghost btn-sm" type="submit">Eliminar</button>
            </form>
          </li>
        ))}
        {!categories?.length ? <li>Aún no hay categorías.</li> : null}
      </ul>
    </div>
  );
}
