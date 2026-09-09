// Importa el catálogo (128 perfumes extraídos del PDF original) a Supabase.
//
// Uso:
//   1) Completa .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
//   2) npm run seed
//
// Es seguro volver a correrlo: no duplica marcas ni categorías (usa upsert
// por nombre), y solo inserta productos si la tabla está vacía.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { config as loadEnv } from "node:process";

// Carga variables desde .env.local manualmente (sin dependencias extra)
function loadEnvLocal() {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const envPath = path.join(dir, "..", ".env.local");
    const content = readFileSync(envPath, "utf8");
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    });
  } catch {
    // Si no existe .env.local, asumimos que las variables ya están en el entorno.
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const dir = path.dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(readFileSync(path.join(dir, "products.json"), "utf8"));
const images = JSON.parse(readFileSync(path.join(dir, "images.json"), "utf8"));

async function main() {
  console.log(`Productos a importar: ${products.length}`);

  // 1) Marcas únicas
  const brandNames = [...new Set(products.map((p) => p.marca).filter(Boolean))];
  console.log(`Marcas: ${brandNames.length}`);
  const { error: brandsError } = await supabase
    .from("brands")
    .upsert(brandNames.map((nombre) => ({ nombre })), { onConflict: "nombre", ignoreDuplicates: true });
  if (brandsError) console.error("Error creando marcas:", brandsError.message);

  // 2) Categorías base (el catálogo original no las incluye; el admin las
  //    asigna después producto por producto desde el panel).
  const { error: catError } = await supabase
    .from("categories")
    .upsert([{ nombre: "Árabes" }, { nombre: "Diseñador" }, { nombre: "Nicho" }], {
      onConflict: "nombre",
      ignoreDuplicates: true,
    });
  if (catError) console.error("Error creando categorías:", catError.message);

  // 3) ¿Ya hay productos? Si sí, no reimportamos para evitar duplicados.
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true });
  if (count && count > 0) {
    console.log(`La tabla products ya tiene ${count} filas — no se reimporta.`);
    console.log("Si quieres reimportar desde cero, borra los datos de la tabla 'products' en Supabase primero.");
    return;
  }

  // 4) Insertar productos con su imagen (recorte del catálogo, base64)
  const rows = products.map((p) => ({
    nombre: p.nombre,
    marca: p.marca,
    slug: p.slug,
    genero: p.genero,
    precio: p.precio,
    precio_anterior: p.precio_anterior || 0,
    imagen: images[p.id] || "",
    descripcion: p.descripcion || "",
    familia_olfativa: p.familia_olfativa || "",
    acordes_principales: p.acordes_principales || [],
    notas_salida: p.notas_salida || [],
    notas_corazon: p.notas_corazon || [],
    notas_fondo: p.notas_fondo || [],
    tamano_ml: p.tamano_ml || "",
    categoria: p.categoria || "",
    disponibilidad: p.disponibilidad !== false,
    destacado: !!p.destacado,
    nuevo: !!p.nuevo,
    oferta: !!p.oferta,
    revisar: !!p.revisar,
    pagina_catalogo: p.pagina_catalogo || null,
  }));

  // Insertamos en lotes para no exceder límites de tamaño de request
  const BATCH = 25;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("products").insert(batch);
    if (error) {
      console.error(`Error insertando lote ${i}-${i + batch.length}:`, error.message);
    } else {
      console.log(`Importados ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    }
  }

  console.log("¡Listo! Catálogo importado.");
  const revisar = products.filter((p) => p.revisar).length;
  if (revisar) {
    console.log(
      `${revisar} productos quedaron marcados como "revisar" (precio o acordes que el OCR no pudo leer con certeza). Complétalos desde /admin/productos.`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
