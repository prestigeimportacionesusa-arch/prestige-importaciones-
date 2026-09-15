import Link from "next/link";
import { signOut } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

const TABS = [
  ["Dashboard", "/admin"],
  ["Productos", "/admin/productos"],
  ["Categorías", "/admin/categorias"],
  ["Marcas", "/admin/marcas"],
  ["Promociones", "/admin/promociones"],
  ["Banners", "/admin/banners"],
  ["Pedidos", "/admin/pedidos"],
  ["Mayoristas", "/admin/mayoristas"],
  ["Reseñas", "/admin/resenas"],
  ["Testimonios", "/admin/testimonios"],
  ["Configuración", "/admin/configuracion"],
];

async function getAdminBadgeCounts() {
  try {
    const supabase = await createClient();

    const { data: cfg } = await supabase.from("store_config").select("pedidos_last_seen").eq("id", 1).single();
    const lastSeen = cfg?.pedidos_last_seen || new Date(0).toISOString();

    const [{ count: pedidosNuevos }, { count: resenasPendientes }, { data: productosCheck }] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).gt("fecha", lastSeen),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("aprobada", false),
      supabase.from("products").select("revisar, precio, imagen"),
    ]);

    const productosRevisar = (productosCheck || []).filter(
      (p) => p.revisar || !p.precio || Number(p.precio) <= 0 || !p.imagen
    ).length;

    return {
      "/admin/pedidos": pedidosNuevos || 0,
      "/admin/resenas": resenasPendientes || 0,
      "/admin/productos": productosRevisar,
    };
  } catch {
    return {};
  }
}

export default async function AdminLayout({ children }) {
  const badges = await getAdminBadgeCounts();

  return (
    <div className="pi-admin">
      <div className="pi-admin-sidebar">
        <div className="pi-logo-text">Admin</div>
        {TABS.map(([label, href]) => (
          <Link key={label} href={href} className="pi-admin-tab">
            {label}
            {badges[href] ? <span className="pi-admin-badge">{badges[href]}</span> : null}
          </Link>
        ))}
        <form action={signOut}>
          <button className="pi-admin-tab pi-admin-exit" type="submit">Cerrar sesión</button>
        </form>
        <Link href="/" className="pi-admin-tab">Ver tienda</Link>
      </div>
      <div className="pi-admin-content">{children}</div>
    </div>
  );
}
