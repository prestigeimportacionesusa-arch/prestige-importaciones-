"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { slugify } from "@/lib/utils";
import { buildWompiCheckoutUrl } from "@/lib/wompi";
import { notifyNewOrder } from "@/lib/email";

function listField(formData, name) {
  const raw = formData.get(name) || "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
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

/* -------------------------------- Reseñas ----------------------------------- */

// Cualquier visitante puede enviar una reseña (la política de RLS ya lo
// permite), pero siempre queda "pendiente" hasta que la apruebes en el
// panel — así nunca se publica algo sin que tú lo revises primero.
export async function submitReview(formData) {
  const supabase = await createClient();
  const productId = formData.get("product_id");
  const nombre = (formData.get("nombre") || "").trim();
  const estrellas = Number(formData.get("estrellas") || 0);
  const comentario = (formData.get("comentario") || "").trim();

  if (!productId || !nombre || estrellas < 1 || estrellas > 5) {
    redirect(`/producto/${formData.get("slug")}?reviewError=1`);
  }

  await supabase.from("reviews").insert({
    product_id: productId,
    nombre,
    estrellas,
    comentario,
    aprobada: false,
  });

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
  const metodos = ["contraentrega", "tarjeta", "pse", "transferencia"];
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
    instagram: formData.get("instagram") || "",
    facebook: formData.get("facebook") || "",
    tiktok: formData.get("tiktok") || "",
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
  await supabase.from("store_config").upsert(row, { onConflict: "id" });
  revalidatePath("/", "layout");
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

/* ------------------------------ Notificaciones ------------------------------ */

// Se llama justo después de crear un pedido (desde el checkout, en el
// navegador). Usa la llave de servicio para leer el pedido recién creado y
// enviarte el correo — así el secreto de Resend nunca se expone al cliente.
export async function notifyOrderCreated(orderId) {
  const supabase = createServiceClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order) return { error: "Pedido no encontrado." };
  return notifyNewOrder(order);
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
