import { createClient } from "@/lib/supabase/server";
import { formatCOP, formatOrderNumber } from "@/lib/utils";
import { updateOrderStatus, updateOrderPaymentStatus, deleteOrder } from "@/lib/actions";
import DeleteOrderButton from "@/components/DeleteOrderButton";
import CopyButton from "@/components/CopyButton";
import { Fragment } from "react";

// Convierte el celular del cliente al formato de WhatsApp (57 + número).
function waCliente(cel) {
  const d = String(cel || "").replace(/\D/g, "");
  if (!d) return null;
  return d.length === 10 ? `57${d}` : d;
}

function datosEnvioTexto(o) {
  return [
    `Pedido #${formatOrderNumber(o.numero)}`,
    `Nombre: ${o.cliente_nombre}`,
    ...(o.cliente_cedula ? [`Cédula: ${o.cliente_cedula}`] : []),
    `Celular: ${o.cliente_celular}`,
    `Dirección: ${o.cliente_direccion}`,
    ...(o.barrio ? [`Barrio: ${o.barrio}`] : []),
    `Ciudad: ${o.cliente_ciudad} (${o.cliente_departamento})`,
    ...(o.info_adicional ? [`Indicaciones: ${o.info_adicional}`] : []),
    "",
    "Productos:",
    ...(o.order_items || []).map((it) => `• ${it.nombre} ${it.marca} x${it.qty}`),
    "",
    `Método de pago: ${o.metodo_pago}`,
    `Total: ${formatCOP(o.total)}`,
  ].join("\n");
}

const ESTADOS = ["Nuevo", "Confirmado", "Preparando", "Enviado", "Entregado", "Cancelado"];
const ESTADOS_PAGO = ["Pendiente", "Pagado", "Rechazado", "Cancelado"];

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase.from("orders").select("*, order_items(*)").order("fecha", { ascending: false });

  // Marca "ahora" como el último momento en que se revisaron los pedidos —
  // así el número de "pedidos nuevos" del menú se reinicia cada vez que
  // entras aquí, en vez de quedarse pegado hasta cambiar el estado de cada
  // uno a mano.
  await supabase.from("store_config").update({ pedidos_last_seen: new Date().toISOString() }).eq("id", 1);

  return (
    <div>
      <h2>Pedidos ({orders?.length || 0})</h2>
      <table className="pi-admin-table">
        <thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Teléfono</th><th>Total</th><th>Pago</th><th>Estado de pago</th><th>Estado del pedido</th><th></th></tr></thead>
        <tbody>
          {(orders || []).map((o) => {
            const items = o.order_items || [];
            const unidades = items.reduce((s, it) => s + Number(it.qty || 0), 0);
            const wa = waCliente(o.cliente_celular);
            return (
            <Fragment key={o.id}>
            <tr className="pi-order-row">
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
              <td>
                <form action={deleteOrder}>
                  <input type="hidden" name="id" value={o.id} />
                  <DeleteOrderButton numero={formatOrderNumber(o.numero)} />
                </form>
              </td>
            </tr>
            <tr className="pi-order-detail-row">
              <td colSpan="9">
                <details className="pi-order-detail" open={o.estado === "Nuevo"}>
                  <summary>
                    Ver pedido — {unidades} {unidades === 1 ? "perfume" : "perfumes"}
                    {items.length ? `: ${items.map((it) => it.nombre).join(", ")}` : ""}
                  </summary>
                  <div className="pi-order-detail-grid">
                    <div>
                      <h4>Perfumes pedidos</h4>
                      {items.length ? (
                        <table className="pi-order-items">
                          <tbody>
                            {items.map((it) => (
                              <tr key={it.id}>
                                <td><b>{it.nombre}</b> <span style={{ color: "var(--muted)" }}>{it.marca}</span></td>
                                <td>x{it.qty}</td>
                                <td style={{ textAlign: "right" }}>{formatCOP(it.subtotal)}</td>
                              </tr>
                            ))}
                            <tr><td colSpan="2">Subtotal</td><td style={{ textAlign: "right" }}>{formatCOP(o.subtotal)}</td></tr>
                            <tr><td colSpan="2">Envío</td><td style={{ textAlign: "right" }}>{Number(o.envio) === 0 ? "Gratis" : formatCOP(o.envio)}</td></tr>
                            {Number(o.recargo) ? <tr><td colSpan="2">Recargo ({o.metodo_pago})</td><td style={{ textAlign: "right" }}>{formatCOP(o.recargo)}</td></tr> : null}
                            <tr className="pi-order-items-total"><td colSpan="2">Total</td><td style={{ textAlign: "right" }}>{formatCOP(o.total)}</td></tr>
                          </tbody>
                        </table>
                      ) : (
                        <p className="pi-config-hint">Este pedido no tiene perfumes registrados.</p>
                      )}
                    </div>
                    <div>
                      <h4>Datos de envío</h4>
                      <dl className="pi-order-ship">
                        <dt>Nombre</dt><dd>{o.cliente_nombre}</dd>
                        {o.cliente_cedula ? <><dt>Cédula</dt><dd>{o.cliente_cedula}</dd></> : null}
                        <dt>Celular</dt><dd>{o.cliente_celular}</dd>
                        <dt>Dirección</dt><dd>{o.cliente_direccion}</dd>
                        {o.barrio ? <><dt>Barrio</dt><dd>{o.barrio}</dd></> : null}
                        <dt>Ciudad</dt><dd>{o.cliente_ciudad} ({o.cliente_departamento})</dd>
                        {o.info_adicional ? <><dt>Indicaciones</dt><dd>{o.info_adicional}</dd></> : null}
                      </dl>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                        <CopyButton text={datosEnvioTexto(o)} label="Copiar datos del pedido" />
                        {wa ? (
                          <a
                            className="btn btn-wa btn-sm"
                            href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola ${o.cliente_nombre.split(" ")[0]}, te escribimos de Prestige Importaciones por tu pedido #${formatOrderNumber(o.numero)}.`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Escribir al cliente por WhatsApp
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </details>
              </td>
            </tr>
            </Fragment>
            );
          })}
          {!orders?.length ? <tr><td colSpan="9" className="pi-empty">Aún no hay pedidos.</td></tr> : null}
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
