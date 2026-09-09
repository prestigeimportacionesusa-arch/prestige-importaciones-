import { waUrl } from "@/lib/whatsapp";
import { IconWhatsapp } from "./Icons";

export default function WhatsAppFloat({ whatsapp }) {
  return (
    <a
      className="pi-wa-float"
      href={waUrl(whatsapp, "Hola, tengo una pregunta sobre sus perfumes.")}
      target="_blank"
      rel="noreferrer"
    >
      <IconWhatsapp />
    </a>
  );
}
