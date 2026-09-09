import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: productCount }, { count: revisarCount }, { count: brandCount }, { data: orders }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("revisar", true),
    supabase.from("brands").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total, estado, estado_pago"),
  ]);

  const totalOrders = orders?.length || 0;
  const nuevos = orders?.filter((o) => o.estado === "Nuevo").length || 0;
  const pagosPendientes = orders?.filter((o) => o.estado_pago === "Pendiente").length || 0;
  const ventas = orders?.reduce((s, o) => s + Number(o.total || 0), 0) || 0;

  return (
    <div>
      <h2>Resumen</h2>
      <div className="pi-stat-grid">
        <div className="pi-stat"><b>{productCount || 0}</b><span>Productos</span></div>
        <div className="pi-stat"><b>{revisarCount || 0}</b><span>Por revisar (datos incompletos del catálogo)</span></div>
        <div className="pi-stat"><b>{totalOrders}</b><span>Pedidos totales</span></div>
        <div className="pi-stat"><b>{nuevos}</b><span>Pedidos nuevos</span></div>
        <div className="pi-stat"><b>{pagosPendientes}</b><span>Pagos pendientes de confirmar</span></div>
        <div className="pi-stat"><b>{formatCOP(ventas)}</b><span>Ventas registradas</span></div>
        <div className="pi-stat"><b>{brandCount || 0}</b><span>Marcas</span></div>
      </div>
      {revisarCount > 0 ? (
        <div className="pi-admin-notice">
          {revisarCount} productos importados del catálogo PDF tienen precio o acordes incompletos (el OCR no pudo
          leerlos con certeza). Ve a <Link href="/admin/productos" style={{ color: "var(--gold)" }}>Productos</Link> y
          revísalos.
        </div>
      ) : null}
    </div>
  );
}
