import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils";
import { updateOrderStatus, updateOrderPaymentStatus } from "@/lib/actions";

const ESTADOS = ["Nuevo", "Confirmado", "Preparando", "Enviado", "Entregado", "Cancelado"];
const ESTADOS_PAGO = ["Pendiente", "Pagado", "Rechazado", "Cancelado"];

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase.from("orders").select("*").order("fecha", { ascending: false });

  return (
    <div>
      <h2>Pedidos ({orders?.length || 0})</h2>
      <table className="pi-admin-table">
        <thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Teléfono</th><th>Total</th><th>Pago</th><th>Estado de pago</th><th>Estado del pedido</th></tr></thead>
        <tbody>
          {(orders || []).map((o) => (
            <tr key={o.id}>
              <td>{o.numero}</td>
              <td>{new Date(o.fecha).toLocaleDateString("es-CO")}</td>
              <td>{o.cliente_nombre}</td>
              <td>{o.cliente_celular}</td>
              <td>{formatCOP(o.total)}</td>
              <td>{o.metodo_pago}</td>
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
