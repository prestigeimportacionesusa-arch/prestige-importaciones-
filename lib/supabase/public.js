import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente "ligero" para las páginas PÚBLICAS (inicio, tienda, producto,
// marcas): no depende de cookies() ni de la sesión del usuario, porque el
// catálogo es de lectura pública para cualquiera.
//
// Por qué importa: en Next.js, si una página usa cookies() en cualquier
// punto de su carga de datos, Next.js la trata como 100% dinámica y NUNCA
// la guarda en caché — se reconstruye desde cero en cada visita, golpeando
// la base de datos cada vez. El cliente de admin (lib/supabase/server.js)
// sí necesita cookies() para saber si hay una sesión de administrador
// activa, pero las páginas públicas no necesitan eso para nada — así que
// usan este cliente en su lugar, lo que permite que Next.js SÍ pueda
// guardar esas páginas en caché (ver "export const revalidate" en cada
// página pública) y servirlas casi al instante.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
