import { createClient } from "@/lib/supabase/server";
import { saveBanner, deleteBanner } from "@/lib/actions";
import ImageUploadField from "@/components/ImageUploadField";

export default async function AdminBannersPage() {
  const supabase = await createClient();
  const { data: banners } = await supabase.from("banners").select("*").order("orden");

  return (
    <div>
      <div className="pi-admin-toolbar">
        <h2>Banners</h2>
      </div>
      <p className="pi-config-hint">
        Sube la imagen completa del banner (se muestra a su tamaño real, sin recortar). El título es solo para
        identificarlo internamente y para accesibilidad — no aparece sobre la imagen. Puedes elegir si mostrar el
        botón "Comprar ahora" encima o dejar la imagen 100% limpia.
      </p>

      <form action={saveBanner} className="pi-banner-edit" style={{ marginBottom: 20 }}>
        <label className="pi-check"><input type="checkbox" name="activo" defaultChecked /> Activo</label>
        <input name="titulo" placeholder="Título (solo interno / accesibilidad)" required />
        <ImageUploadField name="imagen" label="Imagen del banner (tamaño real, sin recortar)" />
        <label className="pi-check"><input type="checkbox" name="mostrar_boton" defaultChecked /> Mostrar botón "Comprar ahora" encima</label>
        <input name="cta" placeholder="Texto del botón" defaultValue="Comprar ahora" />
        <button className="btn btn-primary" type="submit">+ Nuevo banner</button>
      </form>

      {(banners || []).map((b) => (
        <form action={saveBanner} className="pi-banner-edit" key={b.id}>
          <input type="hidden" name="id" value={b.id} />
          <label className="pi-check"><input type="checkbox" name="activo" defaultChecked={b.activo} /> Activo</label>
          <input name="titulo" placeholder="Título (solo interno / accesibilidad)" defaultValue={b.titulo} />
          <ImageUploadField name="imagen" label="Imagen del banner (tamaño real, sin recortar)" defaultValue={b.imagen} />
          <label className="pi-check"><input type="checkbox" name="mostrar_boton" defaultChecked={b.mostrar_boton !== false} /> Mostrar botón "Comprar ahora" encima</label>
          <input name="cta" placeholder="Texto del botón" defaultValue={b.cta} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary btn-sm" type="submit">Guardar</button>
            <button
              className="btn btn-ghost btn-sm"
              type="submit"
              formAction={deleteBanner}
              formNoValidate
            >
              Eliminar
            </button>
          </div>
        </form>
      ))}
      {!banners?.length ? <p style={{ color: "var(--muted)" }}>Aún no hay banners.</p> : null}
    </div>
  );
}
