import { createClient } from "@/lib/supabase/server";
import { savePromotion, deletePromotion, togglePromotion } from "@/lib/actions";
import { formatCOP } from "@/lib/utils";

export default async function AdminPromotionsPage({ searchParams }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: promotions } = await supabase.from("promotions").select("*");
  const editingId = sp?.editar;
  const editing = editingId ? (promotions || []).find((p) => p.id === editingId) : null;

  return (
    <div>
      <h2>Promociones</h2>

      <form action={savePromotion} className="pi-form-grid" style={{ marginBottom: 24 }}>
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
        <input name="nombre" placeholder="Nombre (ej: $35.000 de descuento)" defaultValue={editing?.nombre || ""} required className="pi-span-2" />
        <select name="tipo" defaultValue={editing?.tipo || "fijo"}>
          <option value="fijo">Descuento fijo ($)</option>
          <option value="porcentaje">Descuento porcentual (%)</option>
          <option value="envio_gratis">Envío gratis</option>
        </select>
        <input type="number" name="valor" placeholder="Valor" defaultValue={editing?.valor || 0} />
        <select name="alcance" defaultValue={editing?.alcance || "todos"}>
          <option value="todos">Todos los productos</option>
          <option value="marca">Una marca</option>
          <option value="categoria">Una categoría</option>
          <option value="producto">Un producto (id)</option>
        </select>
        <input name="alcance_valor" placeholder="Valor del alcance (marca/categoría/id producto)" defaultValue={editing?.alcance_valor || ""} />
        <label className="pi-check"><input type="checkbox" name="activa" defaultChecked={editing ? editing.activa : true} /> Activa</label>
        <button className="btn btn-primary" type="submit">{editing ? "Guardar cambios" : "+ Crear promoción"}</button>
      </form>

      <ul className="pi-simple-list">
        {(promotions || []).map((promo) => (
          <li key={promo.id}>
            <span>
              <b>{promo.nombre}</b> — {promo.tipo === "porcentaje" ? `${promo.valor}%` : promo.tipo === "envio_gratis" ? "Envío gratis" : formatCOP(promo.valor)}
              {" "}({promo.alcance}{promo.alcance_valor ? `: ${promo.alcance_valor}` : ""})
            </span>
            <span>
              <form action={togglePromotion} style={{ display: "inline" }}>
                <input type="hidden" name="id" value={promo.id} />
                <input type="hidden" name="value" value={String(promo.activa)} />
                <button className={promo.activa ? "flag on" : "flag"} type="submit">{promo.activa ? "Activa" : "Inactiva"}</button>
              </form>
              <a href={`/admin/promociones?editar=${promo.id}`} className="btn btn-ghost btn-sm">Editar</a>
              <form action={deletePromotion} style={{ display: "inline" }}>
                <input type="hidden" name="id" value={promo.id} />
                <button className="btn btn-ghost btn-sm" type="submit">Eliminar</button>
              </form>
            </span>
          </li>
        ))}
        {!promotions?.length ? <li>Aún no hay promociones.</li> : null}
      </ul>
    </div>
  );
}
