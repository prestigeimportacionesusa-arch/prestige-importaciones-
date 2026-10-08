"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { slugify, formatCOP, formatOrderNumber, computeFinalPrice, computeComboDiscount, hasFreeShipping, computeRecargo, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import { getConfig, getPromotions } from "@/lib/data";
import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { buildWompiCheckoutUrl } from "@/lib/wompi";
import { notifyNewOrder } from "@/lib/email";
import { sendWhatsAppToAdmin } from "@/lib/whatsapp-notify";

function listField(formData, name) {
  const raw = formData.get(name) || "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
// Si alguien pega un link de red social sin "https://" (ej: "tiktok.com/@usuario"),
// el botón se ve normal pero no lleva a ningún lado — el navegador lo trata como
// una ruta interna del propio sitio. Esto lo corrige solo, agregando "https://"
// cuando falta, para que el link siempre funcione sin importar cómo se pegue.
function normalizeUrl(value) {
  const v = (value || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

function bool(formData, name) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

/* --------------------------------- Auth --------------------------------- */

export async function signIn(formData) {
  const supabase = await createClient();
  const email = formData.get("email");
  const password = formData.get("password");
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    redirect(`/login?error=${encodeURIComponent(signInError.message)}`);
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/* ------------------------------- Productos ------------------------------- */

/* --------------------------- Subida de imágenes ------------------------------ */

const IMAGE_BUCKET = "product-images";

async function ensureImageBucket(supabase) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === IMAGE_BUCKET)) {
    await supabase.storage.createBucket(IMAGE_BUCKET, { public: true });
  }
}

// Sube un archivo de imagen elegido en el panel directamente a Supabase
// Storage (en vez de depender de pegar un link de postimages.org). Devuelve
// la URL pública real ya lista para guardar en el producto/banner/etc.
export async function uploadImage(formData) {
  const file = formData.get("file");
  if (!file || typeof file === "string" || file.size === 0) {
    return { error: "No se seleccionó ningún archivo." };
  }
  if (!file.type?.startsWith("image/")) {
    return { error: "El archivo debe ser una imagen." };
  }

  const supabase = createServiceClient();
  await ensureImageBucket(supabase);

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: "No se pudo subir la imagen: " + uploadError.message };
  }

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(fileName);
  return { url: data.publicUrl };
}

export async function saveProduct(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  const nombre = (formData.get("nombre") || "").trim();
  const marca = formData.get("marca");
  const precio = Number(formData.get("precio") || 0);
  const imagen = formData.get("imagen") || "";

  // Validaciones comerciales: no dejamos publicar productos con precio $0.
  // Nombre e imagen faltantes no bloquean el guardado (a veces se completan
  // después), pero el producto queda marcado "revisar" para que se note en
  // la lista del panel hasta que se complete.
  if (!nombre) {
    redirect(`/admin/productos/${id || "nuevo"}?error=${encodeURIComponent("El nombre es obligatorio.")}`);
  }
  if (!precio || precio <= 0) {
    redirect(`/admin/productos/${id || "nuevo"}?error=${encodeURIComponent("El precio debe ser mayor a $0. No se puede publicar un producto con precio $0.")}`);
  }

  const inventarioRaw = formData.get("inventario");
  const row = {
    nombre,
    marca,
    genero: formData.get("genero"),
    precio,
    precio_anterior: Number(formData.get("precio_anterior") || 0),
    imagen,
    imagenes_adicionales: [formData.get("imagenes_adicionales_0"), formData.get("imagenes_adicionales_1")].filter(Boolean),
    descripcion: formData.get("descripcion") || "",
    familia_olfativa: formData.get("familia_olfativa") || "",
    acordes_principales: listField(formData, "acordes_principales"),
    notas_salida: listField(formData, "notas_salida"),
    notas_corazon: listField(formData, "notas_corazon"),
    notas_fondo: listField(formData, "notas_fondo"),
    tamano_ml: formData.get("tamano_ml") || "",
    categoria: formData.get("categoria") || "",
    disponibilidad: bool(formData, "disponibilidad"),
    inventario: inventarioRaw === "" || inventarioRaw === null ? null : Number(inventarioRaw),
    orden: Number(formData.get("orden") || 0),
    destacado: bool(formData, "destacado"),
    nuevo: bool(formData, "nuevo"),
    oferta: bool(formData, "oferta"),
    combo_2x409: bool(formData, "combo_2x409"),
    revisar: !imagen, // si no tiene imagen, la dejamos marcada para revisar
  };

  let saveError;
  if (id) {
    const { error } = await supabase.from("products").update(row).eq("id", id);
    saveError = error;
  } else {
    row.slug = slugify(`${nombre}-${marca}-${Date.now().toString(36)}`);
    const { error } = await supabase.from("products").insert(row);
    saveError = error;
  }
  if (saveError) {
    redirect(`/admin/productos/${id || "nuevo"}?error=${encodeURIComponent("No se pudo guardar: " + saveError.message)}`);
  }
  const slug = formData.get("slug") || row.slug;
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
  revalidatePath("/marcas");
  if (slug) revalidatePath(`/producto/${slug}`);
  redirect("/admin/productos");
}

export async function deleteProduct(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
}

export async function toggleProductFlag(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  const field = formData.get("field");
  const value = formData.get("value") === "true";
  const slug = formData.get("slug");
  await supabase.from("products").update({ [field]: !value }).eq("id", id);
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
  if (slug) revalidatePath(`/producto/${slug}`);
}

/* --------------------------------- Marcas -------------------------------- */

export async function saveBrand(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  const row = {
    nombre: formData.get("nombre"),
    logo: formData.get("logo") || "",
    descripcion: formData.get("descripcion") || "",
  };
  if (id) await supabase.from("brands").update(row).eq("id", id);
  else await supabase.from("brands").insert(row);
  revalidatePath("/admin/marcas");
  revalidatePath("/marcas");
  redirect("/admin/marcas");
}

export async function deleteBrand(formData) {
  const supabase = await createClient();
  await supabase.from("brands").delete().eq("id", formData.get("id"));
  revalidatePath("/admin/marcas");
  revalidatePath("/marcas");
}

/* ------------------------------ Categorías -------------------------------- */

export async function saveCategory(formData) {
  const supabase = await createClient();
  const nombre = formData.get("nombre");
  if (nombre) await supabase.from("categories").insert({ nombre });
  revalidatePath("/admin/categorias");
}

export async function deleteCategory(formData) {
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", formData.get("id"));
  revalidatePath("/admin/categorias");
}

/* ------------------------------ Promociones -------------------------------- */

export async function savePromotion(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  const row = {
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    valor: Number(formData.get("valor") || 0),
    alcance: formData.get("alcance"),
    alcance_valor: formData.get("alcance_valor") || "",
    activa: bool(formData, "activa"),
  };
  if (id) await supabase.from("promotions").update(row).eq("id", id);
  else await supabase.from("promotions").insert(row);
  revalidatePath("/admin/promociones");
  revalidatePath("/tienda");
  redirect("/admin/promociones");
}

export async function deletePromotion(formData) {
  const supabase = await createClient();
  await supabase.from("promotions").delete().eq("id", formData.get("id"));
  revalidatePath("/admin/promociones");
}

export async function togglePromotion(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  const value = formData.get("value") === "true";
  await supabase.from("promotions").update({ activa: !value }).eq("id", id);
  revalidatePath("/admin/promociones");
  revalidatePath("/tienda");
}

/* -------------------------------- Banners ---------------------------------- */

export async function saveBanner(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  const row = {
    titulo: formData.get("titulo") || "",
    subtitulo: formData.get("subtitulo") || "",
    cta: formData.get("cta") || "Comprar ahora",
    promo_badge: formData.get("promo_badge") || "",
    imagen: formData.get("imagen") || "",
    mostrar_boton: bool(formData, "mostrar_boton"),
    activo: bool(formData, "activo"),
  };
  if (id) await supabase.from("banners").update(row).eq("id", id);
  else await supabase.from("banners").insert(row);
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function deleteBanner(formData) {
  const supabase = await createClient();
  await supabase.from("banners").delete().eq("id", formData.get("id"));
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

/* -------------------------------- Pedidos ----------------------------------- */

export async function updateOrderStatus(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  const estado = formData.get("estado");
  await supabase.from("orders").update({ estado }).eq("id", id);
  revalidatePath("/admin/pedidos");
}

export async function updateOrderPaymentStatus(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  const estado_pago = formData.get("estado_pago");
  await supabase.from("orders").update({ estado_pago }).eq("id", id);
  revalidatePath("/admin/pedidos");
}

// Borra un pedido (por ejemplo, los de prueba) para que deje de contar en el
// Dashboard. Sus productos (order_items) se borran solos en la base de datos.
export async function deleteOrder(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  if (!id) return;
  await supabase.from("orders").delete().eq("id", id);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  revalidatePath("/admin", "layout");
}

/* -------------------------------- Reseñas ----------------------------------- */

// Cualquier visitante puede enviar una reseña (la política de RLS ya lo
// permite), pero siempre queda "pendiente" hasta que la apruebes en el
// panel — así nunca se publica algo sin que tú lo revises primero.
export async function submitReview(formData) {
  const supabase = await createClient();
  const productId = formData.get("product_id");
  const marca = formData.get("marca");
  const nombre = (formData.get("nombre") || "").trim();
  const estrellas = Number(formData.get("estrellas") || 0);
  const comentario = (formData.get("comentario") || "").trim();
  const fotos = [formData.get("foto_0"), formData.get("foto_1"), formData.get("foto_2")].filter(Boolean);

  if (!productId || !nombre || estrellas < 1 || estrellas > 5) {
    redirect(`/producto/${formData.get("slug")}?reviewError=1`);
  }

  await supabase.from("reviews").insert({
    product_id: productId,
    marca,
    nombre,
    estrellas,
    comentario,
    fotos,
    aprobada: false,
  });

  const waMsg = [
    `⭐ *Nueva reseña* — ${"★".repeat(estrellas)}${"☆".repeat(5 - estrellas)}`,
    `De: ${nombre} — Marca: ${marca}`,
    comentario ? `"${comentario}"` : "(sin comentario escrito)",
    "",
    "Revísala y apruébala en /admin/resenas",
  ].join("\n");
  await sendWhatsAppToAdmin(waMsg).catch(() => {});

  revalidatePath(`/producto/${formData.get("slug")}`);
  redirect(`/producto/${formData.get("slug")}?reviewSent=1`);
}

export async function toggleReviewApproval(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  const value = formData.get("value") === "true";
  await supabase.from("reviews").update({ aprobada: !value }).eq("id", id);
  revalidatePath("/admin/resenas");
}

export async function deleteReview(formData) {
  const supabase = await createClient();
  await supabase.from("reviews").delete().eq("id", formData.get("id"));
  revalidatePath("/admin/resenas");
}

/* ------------------------------ Configuración ------------------------------- */

export async function saveConfig(formData) {
  const supabase = await createClient();
  const metodos = ["contraentrega", "tarjeta", "pse", "transferencia", "addi"];
  const metodos_pago = {};
  const recargos = {};
  metodos.forEach((m) => {
    metodos_pago[m] = bool(formData, `metodo_${m}`);
    recargos[m] = {
      tipo: formData.get(`recargo_tipo_${m}`) || "fijo",
      valor: Number(formData.get(`recargo_valor_${m}`) || 0),
    };
  });

  const row = {
    id: 1,
    nombre_tienda: formData.get("nombre_tienda"),
    whatsapp: formData.get("whatsapp"),
    instagram: normalizeUrl(formData.get("instagram")),
    facebook: normalizeUrl(formData.get("facebook")),
    tiktok: normalizeUrl(formData.get("tiktok")),
    costo_envio: Number(formData.get("costo_envio") || 0),
    envio_gratis_desde: Number(formData.get("envio_gratis_desde") || 0),
    ciudades: formData.get("ciudades") || "",
    ciudades_cobertura: formData.get("ciudades_cobertura") || "",
    tiempo_entrega: formData.get("tiempo_entrega") || "",
    metodos_pago,
    recargos,
    nequi_numero: formData.get("nequi_numero") || "",
    nequi_titular: formData.get("nequi_titular") || "",
    bancolombia_numero: formData.get("bancolombia_numero") || "",
    bancolombia_tipo: formData.get("bancolombia_tipo") || "",
    bancolombia_titular: formData.get("bancolombia_titular") || "",
    breb_llave: formData.get("breb_llave") || "",
    breb_titular: formData.get("breb_titular") || "",
  };
  const { error } = await supabase.from("store_config").upsert(row, { onConflict: "id" });
  if (error) {
    redirect(`/admin/configuracion?error=${encodeURIComponent("No se pudo guardar: " + error.message)}`);
  }
  revalidatePath("/", "layout");
  redirect("/admin/configuracion?saved=1");
}

/* --------------------------------- Wompi --------------------------------- */

// El cliente (sin sesión) no puede leer directamente la tabla "orders" por
// seguridad (RLS), así que esta acción usa la llave de servicio para leer
// el pedido recién creado y generar su link de pago firmado — nunca se
// expone el secreto de integridad al navegador, solo el link ya armado.
export async function getWompiCheckoutUrl(orderId) {
  const supabase = createServiceClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order) return { error: "Pedido no encontrado." };

  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const redirectUrl = `${protocol}://${host}/checkout/confirmacion?ref=${order.id}`;

  try {
    const url = buildWompiCheckoutUrl({
      reference: order.id,
      amountInCents: Math.round(Number(order.total) * 100),
      currency: "COP",
      redirectUrl,
      customerEmail: order.cliente_correo,
    });
    return { url };
  } catch (e) {
    return { error: e.message };
  }
}

/* ------------------------------ Crear pedido ------------------------------- */

// Crea el pedido desde el SERVIDOR (no desde el navegador del cliente).
//
// Por qué: antes el navegador guardaba el pedido directo en Supabase y pedía
// de vuelta el número de pedido. Pero un cliente SIN sesión no tiene permiso
// de leer la tabla "orders" (RLS), así que Supabase rechazaba la operación y
// el cliente veía "No pudimos registrar tu pedido" — con cualquier método de
// pago. Solo funcionaba desde un celular con la sesión de administrador
// abierta. Aquí usamos la llave de servicio, que corre solo en el servidor.
//
// De paso, los precios, el envío y el recargo se recalculan aquí con los
// datos reales de la base de datos: nadie puede cambiar el total desde su
// navegador para pagar menos.
export async function createOrder(input) {
  try {
    const { cart = [], form = {}, addi = {} } = input || {};
    const clean = (v, max = 300) => String(v ?? "").trim().slice(0, max);

    const metodo = clean(form.metodo_pago, 40);
    const nombre = clean(form.nombre, 120);
    const celular = clean(form.celular, 40);
    const direccion = clean(form.direccion);
    const ciudad = clean(form.ciudad, 120);
    const departamento = clean(form.departamento, 120);
    const cedula = clean(form.cedula, 40);

    if (!nombre || !celular || !direccion || !ciudad || !departamento) {
      return { error: "Completa nombre, celular, dirección, ciudad y departamento." };
    }
    if (celular.replace(/\D/g, "").length < 7) {
      return { error: "Revisa tu número de celular." };
    }

    const items = (Array.isArray(cart) ? cart : [])
      .map((c) => ({ id: clean(c?.id, 64), qty: Math.max(1, Math.min(50, parseInt(c?.qty, 10) || 1)) }))
      .filter((c) => c.id);
    if (!items.length) return { error: "Tu carrito está vacío." };

    const [config, promotions] = await Promise.all([getConfig(), getPromotions()]);
    if (!metodo || !(config.metodos_pago || {})[metodo]) {
      return { error: "Selecciona un método de pago válido." };
    }
    if (metodo === "addi" && (!cedula || !clean(addi.nombre) || !clean(addi.cedula) || !clean(addi.celular))) {
      return { error: "Completa tu cédula y los datos de quien paga con Addi (nombre, cédula y celular)." };
    }

    const supabase = createServiceClient();
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, nombre, marca, precio, precio_anterior, categoria, disponibilidad, oferta, combo_2x409")
      .in("id", items.map((i) => i.id));
    if (prodError) {
      console.error("createOrder products:", prodError);
      return { error: "No pudimos verificar los productos. Intenta de nuevo." };
    }

    const lines = [];
    const agotados = [];
    for (const it of items) {
      const p = (products || []).find((x) => x.id === it.id);
      if (!p) continue;
      if (!p.disponibilidad) { agotados.push(p.nombre); continue; }
      const { price } = computeFinalPrice(p, promotions);
      lines.push({ id: p.id, nombre: p.nombre, marca: p.marca, qty: it.qty, precio: price, subtotal: price * it.qty, combo: !!p.combo_2x409 });
    }
    if (agotados.length) {
      return { error: `${agotados.join(", ")} ya no ${agotados.length > 1 ? "están disponibles" : "está disponible"}. Quítalo del carrito para continuar.` };
    }
    if (!lines.length) return { error: "Los productos de tu carrito ya no están disponibles." };

    const rawSubtotal = lines.reduce((s, l) => s + l.subtotal, 0);
    const { discount: comboDiscount } = computeComboDiscount(lines);
    const subtotal = rawSubtotal - comboDiscount;
    const envio = hasFreeShipping(subtotal, config, promotions) ? 0 : Number(config.costo_envio) || 0;
    const baseTotal = subtotal + envio;
    const recargo = computeRecargo(config, metodo, baseTotal);
    const total = baseTotal + recargo;
    const metodoLabel = PAYMENT_METHOD_LABELS[metodo] || metodo;
    const esAddi = metodo === "addi";

    const orderId = randomUUID();
    const row = {
      id: orderId,
      estado: "Nuevo",
      estado_pago: "Pendiente",
      referencia: orderId,
      cliente_nombre: nombre,
      cliente_cedula: cedula,
      cliente_celular: celular,
      cliente_correo: "",
      cliente_direccion: direccion,
      cliente_ciudad: ciudad,
      cliente_departamento: departamento,
      barrio: clean(form.barrio, 120),
      info_adicional: clean(form.info_adicional, 1000),
      subtotal,
      envio,
      recargo,
      total,
      metodo_pago: metodoLabel,
      addi_nombre: esAddi ? clean(addi.nombre, 120) : null,
      addi_cedula: esAddi ? clean(addi.cedula, 40) : null,
      addi_celular: esAddi ? clean(addi.celular, 40) : null,
    };

    const { data: inserted, error: orderError } = await supabase.from("orders").insert(row).select("numero").single();
    if (orderError) {
      console.error("createOrder insert:", orderError);
      return { error: "No pudimos registrar tu pedido. Intenta de nuevo o escríbenos por WhatsApp." };
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      lines.map((l) => ({ order_id: orderId, product_id: l.id, nombre: l.nombre, marca: l.marca, qty: l.qty, precio: l.precio, subtotal: l.subtotal }))
    );
    if (itemsError) console.error("createOrder items:", itemsError);

    // El correo y el WhatsApp de aviso se envían DESPUÉS de responderle al
    // cliente: si tardan o fallan, la compra del cliente no se ve afectada.
    after(async () => {
      try { await notifyOrderCreated(orderId); } catch (e) { console.error("notifyOrderCreated:", e); }
    });
    revalidatePath("/admin/pedidos");

    let paymentUrl = null;
    if (metodo === "tarjeta" || metodo === "pse") {
      const w = await getWompiCheckoutUrl(orderId);
      if (!w?.url) {
        console.error("createOrder wompi:", w?.error);
        return {
          error: "Tu pedido quedó registrado, pero no pudimos abrir la pasarela de pago. Escríbenos por WhatsApp y te ayudamos a pagar.",
          order: { ...row, numero: inserted?.numero, items: lines },
        };
      }
      paymentUrl = w.url;
    }

    return { ok: true, paymentUrl, order: { ...row, numero: inserted?.numero, items: lines } };
  } catch (e) {
    console.error("createOrder:", e);
    return { error: "Ocurrió un error al registrar tu pedido. Intenta de nuevo o escríbenos por WhatsApp." };
  }
}

/* ------------------------------ Notificaciones ------------------------------ */

// Se llama justo después de crear un pedido (desde el checkout, en el
// navegador). Usa la llave de servicio para leer el pedido recién creado y
// enviarte el correo — así el secreto de Resend nunca se expone al cliente.
export async function notifyOrderCreated(orderId) {
  const supabase = createServiceClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order) return { error: "Pedido no encontrado." };

  const esAddi = order.metodo_pago === "Addi (paga a cuotas)";
  const waMsg = [
    `🛍️ *Nuevo pedido #${formatOrderNumber(order.numero)}* — ${formatCOP(order.total)}`,
    `${order.cliente_nombre} — ${order.cliente_celular}`,
    `Pago: ${order.metodo_pago}`,
    ...(esAddi ? [`Titular Addi: ${order.addi_nombre} — ${order.addi_celular}`] : []),
  ].join("\n");

  const [emailResult] = await Promise.all([
    notifyNewOrder(order),
    sendWhatsAppToAdmin(waMsg),
  ]);
  return emailResult;
}

/* ------------------------------ Testimonios ---------------------------------- */

export async function saveTestimonial(formData) {
  const supabase = await createClient();
  const imagen = (formData.get("imagen") || "").trim();
  if (!imagen) return;
  await supabase.from("testimonials").insert({
    imagen,
    orden: Number(formData.get("orden") || 0),
    activo: true,
  });
  revalidatePath("/admin/testimonios");
  revalidatePath("/");
}

export async function toggleTestimonial(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  const value = formData.get("value") === "true";
  await supabase.from("testimonials").update({ activo: !value }).eq("id", id);
  revalidatePath("/admin/testimonios");
  revalidatePath("/");
}

export async function deleteTestimonial(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  await supabase.from("testimonials").delete().eq("id", id);
  revalidatePath("/admin/testimonios");
  revalidatePath("/");
}
