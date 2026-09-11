// Migra las fotos que YA están en un link externo (postimages.org, imgur,
// etc.) hacia tu propio Supabase Storage — las descarga, las vuelve a subir,
// y actualiza cada producto con el nuevo link. Así dejan de depender de un
// sitio externo y quedan en la misma infraestructura rápida que el resto de
// tu tienda.
//
// Es seguro correrlo varias veces: si una foto ya fue migrada (ya apunta a
// tu propio Supabase), la salta sin tocarla.
//
// Uso:
//   1) Completa .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
//   2) npm run migrate-external-images

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
    // sin .env.local, seguimos con lo que ya esté en el entorno
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
// Si el link ya apunta aquí, quiere decir que ya se migró antes.
const OWN_STORAGE_MARKER = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw error;
    console.log(`Bucket "${BUCKET}" creado.`);
  }
}

function guessExt(url, contentType) {
  const fromType = (contentType || "").split("/")[1];
  if (fromType && fromType !== "octet-stream") return fromType === "jpeg" ? "jpg" : fromType;
  const match = url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i);
  return match ? match[1].toLowerCase() : "jpg";
}

async function downloadAndUpload(url, fileNamePrefix) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar (status ${res.status})`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = guessExt(url, contentType);
  const fileName = `${fileNamePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType, upsert: false });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  await ensureBucket();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, slug, imagen, imagenes_adicionales")
    .like("imagen", "http%");

  if (error) {
    console.error("Error leyendo productos:", error.message);
    process.exit(1);
  }

  const pendientes = products.filter((p) => !p.imagen.startsWith(OWN_STORAGE_MARKER));
  console.log(`Encontrados ${products.length} productos con foto externa, ${pendientes.length} pendientes por migrar.`);

  let migrated = 0;
  let failed = 0;

  for (const p of pendientes) {
    try {
      const newUrl = await downloadAndUpload(p.imagen, p.slug);

      const newAdicionales = [];
      for (const [i, img] of (p.imagenes_adicionales || []).entries()) {
        if (!img) continue;
        if (img.startsWith(OWN_STORAGE_MARKER) || !img.startsWith("http")) {
          newAdicionales.push(img);
          continue;
        }
        try {
          const url = await downloadAndUpload(img, `${p.slug}-extra${i}`);
          newAdicionales.push(url);
          await sleep(300);
        } catch (e) {
          console.error(`  ⚠ No se pudo migrar imagen adicional ${i} de ${p.slug}: ${e.message}`);
          newAdicionales.push(img); // deja la original si falla
        }
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({ imagen: newUrl, imagenes_adicionales: newAdicionales })
        .eq("id", p.id);

      if (updateError) throw updateError;

      migrated++;
      console.log(`  ✓ ${p.slug} migrado (${migrated}/${pendientes.length})`);
    } catch (e) {
      failed++;
      console.error(`  ✗ ${p.slug} falló: ${e.message}`);
    }
    // Pausa breve entre productos para no saturar el sitio de origen.
    await sleep(300);
  }

  console.log(`\nListo. ${migrated} migrados, ${failed} fallidos, de ${pendientes.length} pendientes.`);
  if (failed > 0) {
    console.log("Los que fallaron mantienen su link externo tal como estaba — puedes correr el script de nuevo más tarde para reintentarlos.");
  }
}

run();
