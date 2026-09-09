import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con la llave de servicio (service_role): se salta las reglas de
// seguridad (RLS) por diseño. SOLO se debe usar en código que corre en el
// servidor y que nosotros mismos controlamos por completo (webhook de Wompi,
// generación del link de pago) — JAMÁS se importa desde un componente
// cliente ni se expone al navegador.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
