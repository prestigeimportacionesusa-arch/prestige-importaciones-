// Migra las fotos del catálogo original (guardadas como texto base64 dentro
// de la base de datos) a Supabase Storage, donde quedan como archivos reales
// con una URL propia — livianas, cacheables, y optimizables por Next.js.
//
// Por qué importa: una foto guardada como base64 va incrustada directo en
// el HTML de cada página que la muestra, así que cada visita descarga ese
// peso completo de nuevo. Como archivo real, se descarga UNA vez y el
// navegador la reutiliza en las siguientes visitas — y además Next.js puede
// comprimirla y servirla en el tamaño exacto que necesita cada pantalla.
//
// Uso:
//   1) Completa .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
//   2) npm run migrate-images
//
// Es seguro correrlo varias veces: solo migra productos cuya foto todavía
// empiece con "data:" (es decir, que sigan en el formato viejo).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

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
    // si no existe .env.local, seguimos con lo que ya esté en el entorno
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "product-images";

function base64ToBuffer(dataUrl) {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const ext = mime.split("/")[1] === "jpeg" ? "jpg" : mime.split("/")[1];
  return { buffer, mime, ext };
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw error;
    console.log(`Bucket "${BUCKET}" creado.`);
  } else {
    console.log(`Bucket "${BUCKET}" ya existía.`);
  }
}

async function migrateField(table, id, field, dataUrl, fileNamePrefix) {
  const decoded = base64ToBuffer(dataUrl);
  if (!decoded) return null;
  const fileName = `${fileNamePrefix}-${field}-${Date.now()}.${decoded.ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, decoded.buffer, { contentType: decoded.mime, upsert: true });
  if (uploadError) {
    console.error(`  Error subiendo ${fileName}:`, uploadError.message);
    return null;
  }
  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

async function run() {
  await ensureBucket();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, slug, imagen, imagenes_adicionales")
    .like("imagen", "data:%");

  if (error) {
    console.error("Error leyendo productos:", error.message);
    process.exit(1);
  }

  console.log(`Encontrados ${products.length} productos con foto en formato viejo (base64).`);

  let migrated = 0;
  for (const p of products) {
    const newUrl = await migrateField("products", p.id, "imagen", p.imagen, p.slug);
    if (!newUrl) continue;

    const newAdicionales = [];
    for (const [i, img] of (p.imagenes_adicionales || []).entries()) {
      if (img && img.startsWith("data:")) {
        const url = await migrateField("products", p.id, `extra${i}`, img, p.slug);
        if (url) newAdicionales.push(url);
      } else if (img) {
        newAdicionales.push(img);
      }
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ imagen: newUrl, imagenes_adicionales: newAdicionales })
      .eq("id", p.id);

    if (updateError) {
      console.error(`  Error actualizando ${p.slug}:`, updateError.message);
      continue;
    }
    migrated++;
    console.log(`  ✓ ${p.slug} migrado (${migrated}/${products.length})`);
  }

  console.log(`\nListo. ${migrated} de ${products.length} productos migrados a Supabase Storage.`);
}

run();
