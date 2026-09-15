import { createClient } from "@/lib/supabase/server";
import { formatCOP, formatOrderNumber } from "@/lib/utils";
import { updateOrderStatus, updateOrderPaymentStatus } from "@/lib/actions";

const ESTADOS = ["Nuevo", "Confirmado", "Preparando", "Enviado", "Entregado", "Cancelado"];
const ESTADOS_PAGO = ["Pendiente", "Pagado", "Rechazado", "Cancelado"];

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase.from("orders").select("*").order("fecha", { ascending: false });

  // Marca "ahora" como el último momento en que se revisaron los pedidos —
  // así el número de "pedidos nuevos" del menú se reinicia cada vez que
  // entras aquí, en vez de quedarse pegado hasta cambiar el estado de cada
  // uno a mano.
  await supabase.from("store_config").update({ pedidos_last_seen: new Date().toISOString() }).eq("id", 1);

  return (
    <div>
      <h2>Pedidos ({orders?.length || 0})</h2>
      <table className="pi-admin-table">
        <thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Teléfono</th><th>Total</th><th>Pago</th><th>Estado de pago</th><th>Estado del pedido</th></tr></thead>
        <tbody>
          {(orders || []).map((o) => (
            <tr key={o.id}>
              <td>#{formatOrderNumber(o.numero)}</td>
              <td>{new Date(o.fecha).toLocaleDateString("es-CO")}</td>
              <td>{o.cliente_nombre}{o.cliente_cedula ? <div style={{ fontSize: 11, color: "var(--muted)" }}>CC {o.cliente_cedula}</div> : null}</td>
              <td>{o.cliente_celular}</td>
              <td>{formatCOP(o.total)}</td>
              <td>
                {o.metodo_pago}
                {o.addi_nombre ? (
                  <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 4 }}>
                    Titular: {o.addi_nombre}<br />CC {o.addi_cedula}<br />{o.addi_celular}
                  </div>
                ) : null}
              </td>
              <td>
                <form action={updateOrderPaymentStatus} style={{ display: "flex", gap: 6 }}>
                  <input type="hidden" name="id" value={o.id} />
                  <select name="estado_pago" defaultValue={o.estado_pago || "Pendiente"}>
                    {ESTADOS_PAGO.map((es) => <option key={es} value={es}>{es}</option>)}
                  </select>
                  <button className="btn btn-ghost btn-sm" type="submit">✓</button>
                </form>
              </td>
              <td>
                <form action={updateOrderStatus} style={{ display: "flex", gap: 6 }}>
                  <input type="hidden" name="id" value={o.id} />
                  <select name="estado" defaultValue={o.estado}>
                    {ESTADOS.map((es) => <option key={es} value={es}>{es}</option>)}
                  </select>
                  <button className="btn btn-ghost btn-sm" type="submit">✓</button>
                </form>
              </td>
            </tr>
          ))}
          {!orders?.length ? <tr><td colSpan="8" className="pi-empty">Aún no hay pedidos.</td></tr> : null}
        </tbody>
      </table>
      <p className="pi-config-hint">
        "Estado de pago" y "Estado del pedido" son independientes: un pedido puede estar "Confirmado" logísticamente mientras
        el pago sigue "Pendiente" (por ejemplo, en transferencias esperando el comprobante, o contra entrega hasta que se
        entrega).
      </p>
    </div>
  );
}
