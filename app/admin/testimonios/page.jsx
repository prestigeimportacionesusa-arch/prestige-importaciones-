import { createClient } from "@/lib/supabase/server";
import { saveTestimonial, toggleTestimonial, deleteTestimonial } from "@/lib/actions";
import ImageUploadField from "@/components/ImageUploadField";

export default async function AdminTestimonialsPage() {
  const supabase = await createClient();
  const { data: testimonials } = await supabase.from("testimonials").select("*").order("orden");

  return (
    <div>
      <h2>Testimonios ({testimonials?.length || 0})</h2>
      <p className="pi-config-hint">
        Sube capturas de conversaciones reales con clientes (WhatsApp, Instagram, etc.). Antes de subirlas, recorta o
        tapa el nombre y número de teléfono del cliente por privacidad. Usa el botón "Subir foto" para elegirla
        directo de tu computador — no hace falta postimages.org ni ningún otro sitio externo.
      </p>

      <form action={saveTestimonial} className="pi-banner-edit" style={{ marginBottom: 24 }}>
        <ImageUploadField name="imagen" label="Captura de conversación" />
        <input type="number" name="orden" placeholder="Orden (0 = primero)" defaultValue={0} />
        <button className="btn btn-primary" type="submit">+ Agregar testimonio</button>
      </form>

      <div className="pi-testimonials-admin-grid">
        {(testimonials || []).map((t) => (
          <div key={t.id} className="pi-testimonial-admin-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.imagen} alt="Testimonio" />
            <div className="pi-testimonial-admin-actions">
              <form action={toggleTestimonial}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="value" value={String(t.activo)} />
                <button className="btn btn-ghost btn-sm" type="submit">{t.activo ? "Ocultar" : "Mostrar"}</button>
              </form>
              <form action={deleteTestimonial}>
                <input type="hidden" name="id" value={t.id} />
                <button className="btn btn-ghost btn-sm" type="submit">Eliminar</button>
              </form>
            </div>
          </div>
        ))}
        {!testimonials?.length ? <p className="pi-empty">Aún no has subido ningún testimonio.</p> : null}
      </div>
    </div>
  );
}
