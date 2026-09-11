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

      <form action={saveBanner} className="pi-banner-edit" style={{ marginBottom: 20 }}>
        <label className="pi-check"><input type="checkbox" name="activo" defaultChecked /> Activo</label>
        <input name="titulo" placeholder="Título" required />
        <input name="subtitulo" placeholder="Subtítulo" />
        <input name="cta" placeholder="Texto del botón" defaultValue="Comprar ahora" />
        <input name="promo_badge" placeholder='Etiqueta de promoción (ej: "$35.000 de descuento en todos los perfumes") — opcional' />
        <ImageUploadField name="imagen" label="Imagen de fondo (opcional)" />
        <button className="btn btn-primary" type="submit">+ Nuevo banner</button>
      </form>

      {(banners || []).map((b) => (
        <form action={saveBanner} className="pi-banner-edit" key={b.id}>
          <input type="hidden" name="id" value={b.id} />
          <label className="pi-check"><input type="checkbox" name="activo" defaultChecked={b.activo} /> Activo</label>
          <input name="titulo" placeholder="Título" defaultValue={b.titulo} />
          <input name="subtitulo" placeholder="Subtítulo" defaultValue={b.subtitulo} />
          <input name="cta" placeholder="Texto del botón" defaultValue={b.cta} />
          <input name="promo_badge" placeholder="Etiqueta de promoción (opcional)" defaultValue={b.promo_badge} />
          <ImageUploadField name="imagen" label="Imagen de fondo (opcional)" defaultValue={b.imagen} />
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
