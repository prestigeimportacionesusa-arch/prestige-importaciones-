import { createClient } from "@/lib/supabase/server";
import { toggleReviewApproval, deleteReview } from "@/lib/actions";

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, products(nombre)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2>Reseñas ({reviews?.length || 0})</h2>
      <table className="pi-admin-table">
        <thead><tr><th>Marca</th><th>Producto reseñado</th><th>Cliente</th><th>Estrellas</th><th>Comentario</th><th>Fotos</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {(reviews || []).map((r) => (
            <tr key={r.id}>
              <td>{r.marca || "—"}</td>
              <td>{r.products?.nombre || "—"}</td>
              <td>{r.nombre}</td>
              <td>{"★".repeat(r.estrellas)}</td>
              <td>{r.comentario}</td>
              <td>
                {r.fotos?.length ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    {r.fotos.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt="" className="pi-review-photo-admin" /></a>
                    ))}
                  </div>
                ) : "—"}
              </td>
              <td>{r.aprobada ? "Aprobada" : "Pendiente"}</td>
              <td>
                <form action={toggleReviewApproval} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="value" value={String(r.aprobada)} />
                  <button className="btn btn-ghost btn-sm" type="submit">{r.aprobada ? "Ocultar" : "Aprobar"}</button>
                </form>
                <form action={deleteReview} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="btn btn-ghost btn-sm" type="submit">Eliminar</button>
                </form>
              </td>
            </tr>
          ))}
          {!reviews?.length ? <tr><td colSpan="8" className="pi-empty">Aún no hay reseñas.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
