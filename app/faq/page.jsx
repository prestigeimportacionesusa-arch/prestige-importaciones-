import { Diamond } from "@/components/Icons";

export const metadata = { title: "Preguntas frecuentes — Prestige Importaciones" };

export default function FaqPage() {
  return (
    <div className="pi-section pi-static-page">
      <div className="pi-section-title align-left"><h2>Preguntas frecuentes</h2><Diamond /></div>
      <p>¿Los perfumes son originales? Sí, todos nuestros productos son 100% originales y garantizados.</p>
      <p>¿Hacen envíos a todo el país? Sí, llegamos a todo Colombia.</p>
      <p>¿Puedo pagar contra entrega? Sí, es uno de nuestros métodos de pago disponibles.</p>
      <p>¿Cuánto tarda el envío? Los tiempos varían según tu ciudad; te confirmamos el estimado al procesar tu pedido.</p>
    </div>
  );
}
