"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { waUrl, waWholesaleMessage } from "@/lib/whatsapp";
import { IconWhatsapp, Diamond } from "./Icons";

export default function WholesaleClient({ whatsapp }) {
  const [form, setForm] = useState({ nombre: "", whatsapp: "", ciudad: "", cantidad: "", productos: "", mensaje: "" });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from("wholesale_leads").insert({
      nombre: form.nombre,
      whatsapp: form.whatsapp,
      ciudad: form.ciudad,
      cantidad: form.cantidad,
      productos: form.productos,
      mensaje: form.mensaje,
    });
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="pi-order-confirm">
        <h1>¡Gracias!</h1>
        <p>Recibimos tu solicitud mayorista. Te contactaremos pronto.</p>
      </div>
    );
  }

  return (
    <div className="pi-section pi-wholesale-page">
      <div className="pi-section-title align-left">
        <div className="pi-eyebrow">Para negocios</div>
        <h2>Conviértete en cliente mayorista</h2>
        <Diamond />
      </div>
      <p className="pi-wholesale-lead">¡Compra siempre con precio especial! Empieza tu negocio o aumenta tu rentabilidad comprando perfumería 100% original con nosotros.</p>

      <div className="pi-wholesale-highlight">
        <span className="pi-wholesale-highlight-amount">$60.000</span>
        <span>de descuento en cada perfume sobre el precio de venta del catálogo</span>
      </div>

      <h3 className="pi-wholesale-h3">¿Cómo funciona nuestro precio mayorista?</h3>
      <ul className="pi-wholesale-list">
        <li>Compra inicial desde 4 perfumes.</li>
        <li>Recibe $60.000 de descuento en cada perfume sobre el precio de venta del catálogo.</li>
      </ul>

      <h3 className="pi-wholesale-h3">Y lo mejor viene después</h3>
      <p>Una vez realices tu primera compra mayorista de 4 unidades, quedas registrado como <b>cliente mayorista</b>, y en tus próximas compras podrás pedir desde 1 solo perfume manteniendo tu descuento de $60.000 por unidad.</p>
      <p className="pi-wholesale-cta-line">Compra 4 hoy y desbloquea tu precio mayorista para tus próximas compras.</p>

      <ul className="pi-wholesale-terms">
        <li><b>Envío:</b> lo asume el cliente mayorista.</li>
        <li><b>Pago contra entrega disponible:</b> solo debes cancelar previamente el valor del envío; el resto lo pagas al recibir tu pedido.</li>
        <li className="pi-wholesale-warn">Los $60.000 corresponden al descuento aplicado a cada perfume, no al precio final del producto.</li>
      </ul>

      <div className="pi-wholesale-whatsapp">
        <p>¿Quieres empezar como mayorista? Escríbenos y te ayudamos.</p>
        <a className="btn btn-wa" href={waUrl(whatsapp, waWholesaleMessage())} target="_blank" rel="noreferrer">
          <IconWhatsapp size={18} /> Escribir por WhatsApp
        </a>
      </div>

      <h3 className="pi-wholesale-h3">O déjanos tus datos</h3>
      <form className="pi-wholesale-form" onSubmit={handleSubmit}>
        <input required placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <input required placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        <input required placeholder="Ciudad" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} />
        <input placeholder="Cantidad aproximada" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />
        <input placeholder="Productos de interés" value={form.productos} onChange={(e) => setForm({ ...form, productos: e.target.value })} className="pi-span-2" />
        <textarea placeholder="Mensaje" value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} className="pi-span-2" />
        <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Enviar solicitud"}</button>
      </form>
    </div>
  );
}
