import Link from "next/link";
import { signOut } from "@/lib/actions";

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
  ["Configuración", "/admin/configuracion"],
];

export default function AdminLayout({ children }) {
  return (
    <div className="pi-admin">
      <div className="pi-admin-sidebar">
        <div className="pi-logo-text">Admin</div>
        {TABS.map(([label, href]) => (
          <Link key={label} href={href} className="pi-admin-tab">{label}</Link>
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
