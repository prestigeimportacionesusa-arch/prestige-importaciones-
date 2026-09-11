"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";
import { getWompiCheckoutUrl, notifyOrderCreated } from "@/lib/actions";
import { formatCOP, computeFinalPrice, hasFreeShipping, computeRecargo, recargoLabel, computeComboDiscount, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import { waUrl, waOrderMessage } from "@/lib/whatsapp";
import { trackInitiateCheckout, trackPurchase } from "@/lib/meta-pixel";
import { IconWhatsapp } from "./Icons";

function TransferDetails({ config }) {
  const cuentas = [
    config.nequi_numero ? { label: "Nequi", numero: config.nequi_numero, titular: config.nequi_titular } : null,
    config.bancolombia_numero
      ? { label: `Bancolombia${config.bancolombia_tipo ? " · " + config.bancolombia_tipo : ""}`, numero: config.bancolombia_numero, titular: config.bancolombia_titular }
      : null,
    config.breb_llave ? { label: "Bre-B", numero: config.breb_llave, titular: config.breb_titular } : null,
  ].filter(Boolean);

  if (!cuentas.length) {
    return (
      <div className="pi-transfer-box pi-transfer-empty">
        Todavía no hemos configurado nuestros datos de transferencia. Escríbenos por WhatsApp después de confirmar el pedido y te los enviamos directamente.
      </div>
    );
  }

  return (
    <div className="pi-transfer-box">
      <p><b>Datos para transferir:</b></p>
      {cuentas.map((c) => (
        <div key={c.label} className="pi-transfer-account">
          <span className="pi-transfer-label">{c.label}</span>
          <span>{c.numero}{c.titular ? ` — ${c.titular}` : ""}</span>
        </div>
      ))}
      <p className="pi-transfer-note">Envíanos el comprobante por WhatsApp junto con tu número de pedido para confirmar tu compra.</p>
    </div>
  );
}

export default function CheckoutClient({ products, promotions, config }) {
  const { cart, clearCart } = useCart();
  const [form, setForm] = useState({ nombre: "", celular: "", correo: "", direccion: "", ciudad: "", departamento: "", barrio: "", info_adicional: "", metodo_pago: "" });
  const [orderResult, setOrderResult] = useState(null);

  // Se dispara Purchase solo para contraentrega/transferencia (aquí no hay
  // pasarela externa que confirme el pago — el pedido en sí es la conversión
  // completada). Para tarjeta/PSE, Purchase se dispara en la página de
  // confirmación después de volver de Wompi, y solo si el pago quedó
  // realmente "Pagado".
  useEffect(() => {
    if (orderResult) {
      trackPurchase(orderResult, orderResult.numero ? `order_${orderResult.numero}` : undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderResult]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const lines = cart
    .map((item) => {
      const p = products.find((x) => x.id === item.id);
      if (!p) return null;
      const { price } = computeFinalPrice(p, promotions);
      return { id: p.id, nombre: p.nombre, marca: p.marca, qty: item.qty, precio: price, subtotal: price * item.qty, combo: !!p.combo_2x409 };
    })
    .filter(Boolean);

  // Si algún producto del carrito se agotó mientras el cliente compraba,
  // no lo dejamos pagar por algo que ya no hay.
  const agotados = cart
    .map((item) => products.find((x) => x.id === item.id))
    .filter((p) => p && !p.disponibilidad);

  const rawSubtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const { discount: comboDiscount, pairs: comboPairs } = computeComboDiscount(lines);
  const subtotal = rawSubtotal - comboDiscount;
  const free = hasFreeShipping(subtotal, config, promotions);
  const envio = free ? 0 : Number(config.costo_envio) || 0;
  const baseTotal = subtotal + envio;
  const recargo = form.metodo_pago ? computeRecargo(config, form.metodo_pago, baseTotal) : 0;
  const total = baseTotal + recargo;
  const enabledMethods = Object.entries(config.metodos_pago || {}).filter(([, v]) => v).map(([k]) => k);

  const trackedRef = useRef(false);
  useEffect(() => {
    if (!trackedRef.current && lines.length) {
      trackInitiateCheckout(lines, baseTotal);
      trackedRef.current = true;
    }
    // Solo se dispara una vez al entrar al checkout con productos en el carrito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (orderResult) {
    return (
      <div className="pi-order-confirm">
        <h1>¡Gracias, {orderResult.cliente_nombre.split(" ")[0]}!</h1>
        <p>Tu pedido <b>#{orderResult.numero}</b> fue registrado por {formatCOP(orderResult.total)}.</p>
        <p className="pi-order-status-note">
          Estado del pago: <b>{orderResult.estado_pago}</b>
          {orderResult.metodo_pago === PAYMENT_METHOD_LABELS.transferencia ? " — confírmalo enviando tu comprobante por WhatsApp." : ""}
        </p>
        {orderResult.metodo_pago === PAYMENT_METHOD_LABELS.transferencia ? <TransferDetails config={config} /> : null}
        <a className="btn btn-wa" href={waUrl(config.whatsapp, waOrderMessage(orderResult))} target="_blank" rel="noreferrer">
          <IconWhatsapp size={18} /> Confirmar por WhatsApp
        </a>
        <Link href="/" className="btn btn-outline">Volver al inicio</Link>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="pi-empty-cart">
        <p>Tu carrito está vacío.</p>
        <Link href="/tienda" className="btn btn-primary">Ver catálogo</Link>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (agotados.length) { setErrorMsg("Uno o más productos de tu carrito se agotaron. Quítalos para poder continuar."); return; }
    if (!form.metodo_pago) { setErrorMsg("Selecciona un método de pago."); return; }
    setSubmitting(true);
    setErrorMsg("");

    const supabase = createClient();
    const orderId = crypto.randomUUID();
    const numero = Math.floor(1000 + Math.random() * 9000);
    const metodoLabel = PAYMENT_METHOD_LABELS[form.metodo_pago] || form.metodo_pago;
    // Ningún método marca el pedido como pagado automáticamente en este
    // momento: contraentrega se paga al recibir, transferencia se confirma
    // manualmente desde el panel al ver el comprobante, y tarjeta/PSE se
    // confirman solo cuando Wompi notifica el pago vía webhook (más abajo).
    const estado_pago = "Pendiente";
    const esWompi = form.metodo_pago === "tarjeta" || form.metodo_pago === "pse";

    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      numero,
      estado: "Nuevo",
      estado_pago,
      referencia: orderId,
      cliente_nombre: form.nombre,
      cliente_celular: form.celular,
      cliente_correo: form.correo,
      cliente_direccion: form.direccion,
      cliente_ciudad: form.ciudad,
      cliente_departamento: form.departamento,
      barrio: form.barrio,
      info_adicional: form.info_adicional,
      subtotal,
      envio,
      recargo,
      total,
      metodo_pago: metodoLabel,
    });

    if (orderError) {
      setSubmitting(false);
      setErrorMsg("No pudimos registrar tu pedido. Intenta de nuevo o escríbenos por WhatsApp.");
      return;
    }

    // No bloqueamos ni afectamos la compra del cliente si el correo de
    // notificación falla por cualquier motivo — es informativo, no crítico.
    notifyOrderCreated(orderId).catch(() => {});

    const itemRows = lines.map((l) => ({
      order_id: orderId,
      product_id: l.id,
      nombre: l.nombre,
      marca: l.marca,
      qty: l.qty,
      precio: l.precio,
      subtotal: l.subtotal,
    }));
    await supabase.from("order_items").insert(itemRows);

    if (esWompi) {
      // Para tarjeta/PSE, el pago se procesa en la página de Wompi:
      // llevamos al cliente allá y el carrito se vacía solo al confirmar.
      const result = await getWompiCheckoutUrl(orderId);
      if (result?.url) {
        clearCart();
        window.location.href = result.url;
        return;
      }
      setSubmitting(false);
      setErrorMsg(result?.error || "No pudimos conectar con la pasarela de pago. Intenta de nuevo o escríbenos por WhatsApp.");
      return;
    }

    clearCart();
    setSubmitting(false);
    setOrderResult({
      numero,
      estado_pago,
      cliente_nombre: form.nombre,
      cliente_celular: form.celular,
      cliente_direccion: form.direccion,
      cliente_ciudad: form.ciudad,
      cliente_departamento: form.departamento,
      barrio: form.barrio,
      items: lines,
      subtotal,
      envio,
      recargo,
      total,
      metodo_pago: metodoLabel,
    });
  }

  return (
    <div className="pi-checkout">
      <form className="pi-checkout-form" onSubmit={handleSubmit}>
        <h1>Finalizar compra</h1>
        {agotados.length ? (
          <div className="pi-error" style={{ marginBottom: 14 }}>
            {agotados.map((p) => p.nombre).join(", ")} ya no {agotados.length > 1 ? "están disponibles" : "está disponible"}. Vuelve al carrito para quitarlo{agotados.length > 1 ? "s" : ""}.
          </div>
        ) : null}
        <div className="pi-form-grid">
          <input required placeholder="Nombre completo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <input required placeholder="Número de celular" value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} />
          <input required type="email" placeholder="Correo electrónico" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
          <input required placeholder="Ciudad" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} />
          <input required placeholder="Departamento" value={form.departamento} onChange={(e) => setForm({ ...form, departamento: e.target.value })} />
          <input placeholder="Barrio" value={form.barrio} onChange={(e) => setForm({ ...form, barrio: e.target.value })} />
          <input required placeholder="Dirección" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          <textarea placeholder="Información adicional para el envío" value={form.info_adicional} onChange={(e) => setForm({ ...form, info_adicional: e.target.value })} className="pi-span-2" />
        </div>
        <h3>Método de pago</h3>
        <div className="pi-payment-methods">
          {enabledMethods.map((m) => (
            <label key={m} className={`pi-payment-opt ${form.metodo_pago === m ? "active" : ""}`}>
              <input type="radio" name="pago" checked={form.metodo_pago === m} onChange={() => setForm({ ...form, metodo_pago: m })} />
              <span>{PAYMENT_METHOD_LABELS[m]}</span>
              {recargoLabel(config, m) ? <span className="pi-recargo-tag">{recargoLabel(config, m)}</span> : <span className="pi-recargo-tag pi-recargo-none">Sin recargo</span>}
            </label>
          ))}
        </div>
        {form.metodo_pago === "transferencia" ? <TransferDetails config={config} /> : null}
        {errorMsg ? <div className="pi-error">{errorMsg}</div> : null}
        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={submitting || agotados.length > 0}>
          {submitting ? "Enviando..." : `Confirmar pedido — ${formatCOP(total)}`}
        </button>
      </form>
      <div className="pi-checkout-summary">
        <h3>Resumen</h3>
        {lines.map((l) => (
          <div key={l.id} className="pi-summary-row"><span>{l.nombre} x{l.qty}{l.combo ? " · 2x$409.000" : ""}</span><span>{formatCOP(l.subtotal)}</span></div>
        ))}
        {comboDiscount > 0 ? (
          <div className="pi-summary-row pi-summary-combo"><span>Descuento combo 2x$409.000 ({comboPairs} {comboPairs === 1 ? "pareja" : "parejas"})</span><span>−{formatCOP(comboDiscount)}</span></div>
        ) : null}
        <div className="pi-summary-row"><span>Envío</span><span>{envio === 0 ? "Gratis" : formatCOP(envio)}</span></div>
        {form.metodo_pago ? (
          <div className="pi-summary-row"><span>Recargo {PAYMENT_METHOD_LABELS[form.metodo_pago]}</span><span>{recargo === 0 ? "Sin costo" : formatCOP(recargo)}</span></div>
        ) : null}
        <div className="pi-summary-row total"><span>Total</span><span>{formatCOP(total)}</span></div>
        {config.tiempo_entrega ? <div className="pi-summary-row"><span>Tiempo de entrega estimado</span><span>{config.tiempo_entrega}</span></div> : null}
      </div>
    </div>
  );
}
