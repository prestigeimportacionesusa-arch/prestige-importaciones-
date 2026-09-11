import { createPublicClient } from "@/lib/supabase/public";

const DEFAULT_CONFIG = {
  id: 1,
  nombre_tienda: "Prestige Importaciones",
  whatsapp: "573000000000",
  instagram: "",
  facebook: "",
  tiktok: "",
  costo_envio: 12000,
  envio_gratis_desde: 350000,
  ciudades: "Todo Colombia",
  ciudades_cobertura: "",
  tiempo_entrega: "",
  metodos_pago: { contraentrega: true, tarjeta: true, pse: true, transferencia: true },
  recargos: {
    contraentrega: { tipo: "fijo", valor: 15000 },
    tarjeta: { tipo: "porcentaje", valor: 6 },
    pse: { tipo: "porcentaje", valor: 6 },
    transferencia: { tipo: "fijo", valor: 0 },
  },
  nequi_numero: "",
  nequi_titular: "",
  bancolombia_numero: "",
  bancolombia_tipo: "",
  bancolombia_titular: "",
  breb_llave: "",
  breb_titular: "",
};

// Columnas necesarias para mostrar una tarjeta de producto (catálogo,
// destacados, relacionados). Se excluyen a propósito los campos pesados que
// solo hacen falta en la ficha individual (descripción larga, notas
// olfativas detalladas, galería adicional) — así las páginas con muchos
// productos a la vez (inicio, tienda) transfieren mucha menos información.
const LIST_COLUMNS =
  "id, nombre, marca, slug, genero, precio, precio_anterior, imagen, categoria, disponibilidad, inventario, orden, destacado, nuevo, oferta, combo_2x409";

// Todas las funciones atrapan errores y devuelven datos por defecto: si
// Supabase todavía no está configurado (.env.local vacío, tablas sin crear),
// el sitio se sigue viendo en vez de romperse con una pantalla en blanco.
//
// Usan el cliente "público" (sin cookies) para que Next.js pueda guardar
// estas páginas en caché — ver la nota en lib/supabase/public.js.

export async function getConfig() {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("store_config").select("*").eq("id", 1).single();
    if (error || !data) return DEFAULT_CONFIG;
    return data;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function getProducts() {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("products").select(LIST_COLUMNS).order("orden").order("nombre");
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug) {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("products").select("*").eq("slug", slug).single();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getBrands() {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("brands").select("*").order("nombre");
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function getCategories() {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("categories").select("*").order("nombre");
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function getPromotions() {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("promotions").select("*");
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function getBanners() {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("banners").select("*").order("orden");
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function getApprovedReviews(productId) {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("aprobada", true)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function getTestimonials() {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("testimonials").select("*").eq("activo", true).order("orden");
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
