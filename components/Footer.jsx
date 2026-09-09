import Link from "next/link";
import { IconInstagram, IconTiktok } from "./Icons";

export default function Footer({ nombreTienda, instagram, tiktok, facebook }) {
  const socials = [
    instagram ? { href: instagram, label: "Instagram", Icon: IconInstagram } : null,
    tiktok ? { href: tiktok, label: "TikTok", Icon: IconTiktok } : null,
  ].filter(Boolean);

  return (
    <footer className="pi-footer">
      <div className="pi-footer-cols">
        <div>
          <div className="pi-logo-text">{nombreTienda}</div>
          <p>Perfumes 100% originales. Envíos a todo Colombia.</p>
          {socials.length ? (
            <div className="pi-footer-socials">
              {socials.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>
                  <Icon />
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <h4>Tienda</h4>
          <Link href="/tienda">Catálogo</Link>
          <Link href="/marcas">Marcas</Link>
          <Link href="/mayorista">Venta mayorista</Link>
        </div>
        <div>
          <h4>Ayuda</h4>
          <Link href="/faq">Preguntas frecuentes</Link>
          <Link href="/envios">Política de envíos</Link>
          <Link href="/cambios">Cambios y devoluciones</Link>
        </div>
        <div>
          <h4>Legal</h4>
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/terminos">Términos</Link>
          <Link href="/admin">Panel administrativo</Link>
        </div>
      </div>
      <div className="pi-footer-bottom">© {new Date().getFullYear()} {nombreTienda}</div>
    </footer>
  );
}
