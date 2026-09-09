import { createClient } from "@/lib/supabase/server";

export default async function AdminWholesalePage() {
  const supabase = await createClient();
  const { data: leads } = await supabase.from("wholesale_leads").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <h2>Solicitudes mayoristas ({leads?.length || 0})</h2>
      <table className="pi-admin-table">
        <thead><tr><th>Fecha</th><th>Nombre</th><th>WhatsApp</th><th>Ciudad</th><th>Cantidad</th><th>Productos</th><th>Mensaje</th></tr></thead>
        <tbody>
          {(leads || []).map((w) => (
            <tr key={w.id}>
              <td>{new Date(w.created_at).toLocaleDateString("es-CO")}</td>
              <td>{w.nombre}</td>
              <td>{w.whatsapp}</td>
              <td>{w.ciudad}</td>
              <td>{w.cantidad}</td>
              <td>{w.productos}</td>
              <td>{w.mensaje}</td>
            </tr>
          ))}
          {!leads?.length ? <tr><td colSpan="7" className="pi-empty">Aún no hay solicitudes.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
