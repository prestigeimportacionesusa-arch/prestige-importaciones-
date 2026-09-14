import { waUrl } from "@/lib/whatsapp";
import { IconWhatsapp, IconInstagram, IconTiktok } from "./Icons";

export default function WhatsAppFloat({ whatsapp, instagram, tiktok }) {
  return (
    <div className="pi-social-float">
      {tiktok ? (
        <a className="pi-social-float-btn pi-social-float-tiktok" href={tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
          <IconTiktok size={20} />
        </a>
      ) : null}
      {instagram ? (
        <a className="pi-social-float-btn pi-social-float-instagram" href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
          <IconInstagram size={20} />
        </a>
      ) : null}
      {whatsapp ? (
        <a
          className="pi-social-float-btn pi-social-float-whatsapp"
          href={waUrl(whatsapp, "Hola, tengo una pregunta sobre sus perfumes.")}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
        >
          <IconWhatsapp />
        </a>
      ) : null}
    </div>
  );
}
