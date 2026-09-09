import { getConfig } from "@/lib/data";
import { saveConfig } from "@/lib/actions";

const METHOD_LABELS = {
  contraentrega: "Pago contra entrega",
  tarjeta: "Tarjeta débito/crédito",
  pse: "PSE",
  transferencia: "Transferencia bancaria (Nequi/Bancolombia)",
};

export default async function AdminConfigPage() {
  const cfg = await getConfig();

  return (
    <div className="pi-admin-config">
      <h2>Configuración</h2>
      <form action={saveConfig}>
        <div className="pi-form-grid">
          <input name="nombre_tienda" placeholder="Nombre de la tienda" defaultValue={cfg.nombre_tienda} />
          <input name="whatsapp" placeholder="WhatsApp (ej: 573001234567)" defaultValue={cfg.whatsapp} />
          <input name="instagram" placeholder="Instagram (URL completa)" defaultValue={cfg.instagram} />
          <input name="tiktok" placeholder="TikTok (URL completa)" defaultValue={cfg.tiktok} />
          <input name="facebook" placeholder="Facebook (opcional)" defaultValue={cfg.facebook} className="pi-span-2" />
          <input type="number" name="costo_envio" placeholder="Costo de envío" defaultValue={cfg.costo_envio} />
          <input type="number" name="envio_gratis_desde" placeholder="Envío gratis desde" defaultValue={cfg.envio_gratis_desde} />
          <input name="ciudades" placeholder="Ciudades de cobertura (texto corto para el inicio)" defaultValue={cfg.ciudades} className="pi-span-2" />
          <textarea name="ciudades_cobertura" placeholder="Detalle de ciudades/zonas de cobertura (para la página de envíos)" defaultValue={cfg.ciudades_cobertura} className="pi-span-2" />
          <input name="tiempo_entrega" placeholder="Tiempo estimado de entrega (ej: 2-5 días hábiles)" defaultValue={cfg.tiempo_entrega} className="pi-span-2" />
        </div>

        <h3>Métodos de pago activos y recargos</h3>
        <p className="pi-config-hint">Activa cada método y define si tiene recargo fijo (en $) o porcentual (%). Déjalo en 0 para "sin recargo".</p>
        <div className="pi-recargo-grid">
          {Object.keys(METHOD_LABELS).map((k) => {
            const r = cfg.recargos?.[k] || { tipo: "fijo", valor: 0 };
            return (
              <div key={k} className="pi-recargo-row">
                <label className="pi-check">
                  <input type="checkbox" name={`metodo_${k}`} defaultChecked={!!cfg.metodos_pago?.[k]} /> {METHOD_LABELS[k]}
                </label>
                <select name={`recargo_tipo_${k}`} defaultValue={r.tipo}>
                  <option value="fijo">Recargo fijo ($)</option>
                  <option value="porcentaje">Recargo %</option>
                </select>
                <input type="number" name={`recargo_valor_${k}`} defaultValue={r.valor} />
              </div>
            );
          })}
        </div>

        <h3>Datos de transferencia bancaria</h3>
        <p className="pi-config-hint">
          Estos datos se muestran al cliente cuando elige "Transferencia bancaria" en el checkout. Déjalos vacíos si
          todavía no los tienes — no se inventa nada, simplemente no se muestran hasta que los completes.
        </p>
        <div className="pi-form-grid">
          <input name="nequi_numero" placeholder="Número de Nequi" defaultValue={cfg.nequi_numero} />
          <input name="nequi_titular" placeholder="Nombre del titular (Nequi)" defaultValue={cfg.nequi_titular} />
          <input name="bancolombia_numero" placeholder="Número de cuenta Bancolombia" defaultValue={cfg.bancolombia_numero} />
          <input name="bancolombia_tipo" placeholder="Tipo de cuenta (Ahorros/Corriente)" defaultValue={cfg.bancolombia_tipo} />
          <input name="bancolombia_titular" placeholder="Nombre del titular (Bancolombia)" defaultValue={cfg.bancolombia_titular} />
          <input name="breb_llave" placeholder="Llave Bre-B (celular, correo o llave)" defaultValue={cfg.breb_llave} />
          <input name="breb_titular" placeholder="Nombre del titular (Bre-B)" defaultValue={cfg.breb_titular} className="pi-span-2" />
        </div>

        <button className="btn btn-primary" type="submit">Guardar configuración</button>
      </form>

      <div className="pi-admin-notice" style={{ marginTop: 24 }}>
        Para crear o cambiar el acceso de administradores, ve a tu proyecto de Supabase → Authentication → Users.
        Ahí puedes agregar un nuevo correo con contraseña, o restablecer la contraseña de uno existente. Esta app no
        guarda contraseñas propias — la seguridad la maneja Supabase.
      </div>
      <div className="pi-admin-notice" style={{ marginTop: 12 }}>
        Las llaves de Wompi (tarjeta y PSE) no se configuran aquí por seguridad — se ponen como variables de entorno
        en Vercel (WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET, WOMPI_EVENTS_SECRET). Así nunca quedan visibles en el
        panel ni en el código.
      </div>
    </div>
  );
}
