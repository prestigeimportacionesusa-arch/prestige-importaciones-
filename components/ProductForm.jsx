import { saveProduct } from "@/lib/actions";
import ImageUploadField from "./ImageUploadField";

export default function ProductForm({ product, brands, categories, error }) {
  const p = product || {
    nombre: "", marca: brands?.[0]?.nombre || "", genero: "Unisex", precio: 0, precio_anterior: 0,
    imagen: "", imagenes_adicionales: [], descripcion: "", familia_olfativa: "", acordes_principales: [], notas_salida: [],
    notas_corazon: [], notas_fondo: [], tamano_ml: "", categoria: "", disponibilidad: true,
    inventario: null, orden: 0, destacado: false, nuevo: false, oferta: false, combo_2x409: false,
  };

  return (
    <form action={saveProduct} className="pi-admin-product-form">
      {error ? <div className="pi-error" style={{ marginBottom: 14 }}>{error}</div> : null}
      {p.id ? <input type="hidden" name="id" value={p.id} /> : null}
      {p.slug ? <input type="hidden" name="slug" value={p.slug} /> : null}
      <div className="pi-form-grid">
        <input name="nombre" placeholder="Nombre" defaultValue={p.nombre} required />
        <select name="marca" defaultValue={p.marca} required>
          {(brands || []).map((b) => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
        </select>
        <select name="genero" defaultValue={p.genero}>
          <option>Hombre</option><option>Mujer</option><option>Unisex</option>
        </select>
        <select name="categoria" defaultValue={p.categoria}>
          <option value="">Sin categoría</option>
          {(categories || []).map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </select>
        <input type="number" name="precio" placeholder="Precio (obligatorio, mayor a $0)" defaultValue={p.precio} required min="1" />
        <input type="number" name="precio_anterior" placeholder="Precio anterior (si hay descuento)" defaultValue={p.precio_anterior} />
        <div className="pi-span-2">
          <ImageUploadField name="imagen" label="Imagen principal" defaultValue={p.imagen} />
        </div>
        <div className="pi-span-2">
          <ImageUploadField name="imagenes_adicionales_0" label="Imagen adicional 1 (opcional)" defaultValue={(p.imagenes_adicionales || [])[0]} />
        </div>
        <div className="pi-span-2">
          <ImageUploadField name="imagenes_adicionales_1" label="Imagen adicional 2 (opcional)" defaultValue={(p.imagenes_adicionales || [])[1]} />
        </div>
        <input name="tamano_ml" placeholder="Tamaño (ml)" defaultValue={p.tamano_ml} />
        <input name="familia_olfativa" placeholder="Familia olfativa" defaultValue={p.familia_olfativa} />
        <input type="number" name="inventario" placeholder="Inventario (unidades disponibles, opcional)" defaultValue={p.inventario ?? ""} />
        <input type="number" name="orden" placeholder="Orden de aparición (0 = normal, menor número aparece primero)" defaultValue={p.orden || 0} />
        <textarea name="descripcion" placeholder="Descripción" defaultValue={p.descripcion} className="pi-span-2" />
        <input name="acordes_principales" placeholder="Acordes principales (separados por coma)" defaultValue={(p.acordes_principales || []).join(", ")} className="pi-span-2" />
        <input name="notas_salida" placeholder="Notas de salida (coma)" defaultValue={(p.notas_salida || []).join(", ")} />
        <input name="notas_corazon" placeholder="Notas de corazón (coma)" defaultValue={(p.notas_corazon || []).join(", ")} />
        <input name="notas_fondo" placeholder="Notas de fondo (coma)" defaultValue={(p.notas_fondo || []).join(", ")} className="pi-span-2" />
      </div>
      <div className="pi-checkbox-row">
        <label className="pi-check"><input type="checkbox" name="disponibilidad" defaultChecked={p.disponibilidad} /> Disponible</label>
        <label className="pi-check"><input type="checkbox" name="destacado" defaultChecked={p.destacado} /> Destacado</label>
        <label className="pi-check"><input type="checkbox" name="nuevo" defaultChecked={p.nuevo} /> Nuevo</label>
        <label className="pi-check"><input type="checkbox" name="oferta" defaultChecked={p.oferta} /> Oferta</label>
        <label className="pi-check"><input type="checkbox" name="combo_2x409" defaultChecked={p.combo_2x409} /> Incluido en 2x$409.000</label>
      </div>
      <p className="pi-config-hint">Si dejas "Inventario" vacío, no se mostrará "últimas unidades" en la tienda — solo aparece cuando pones un número real.</p>
      <button className="btn btn-primary" type="submit">Guardar</button>
    </form>
  );
}
