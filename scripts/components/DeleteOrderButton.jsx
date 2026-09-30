"use client";

// Botón "Eliminar" de la tabla de pedidos. Pide confirmación antes de borrar,
// para que un clic por error no elimine un pedido real.
export default function DeleteOrderButton({ numero }) {
  return (
    <button
      type="submit"
      className="btn btn-ghost btn-sm"
      style={{ color: "#e07a7a", borderColor: "#e07a7a" }}
      onClick={(e) => {
        if (!window.confirm(`¿Eliminar el pedido #${numero}? Esta acción no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      Eliminar
    </button>
  );
}
