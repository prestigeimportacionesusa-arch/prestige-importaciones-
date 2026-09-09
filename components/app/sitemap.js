import { getProducts, getBrands } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prestige-importaciones.vercel.app";

const STATIC_PAGES = [
  "", "tienda", "marcas", "mayorista", "nosotros", "contacto", "faq",
  "envios", "cambios", "privacidad", "terminos",
];

export default async function sitemap() {
  const [products] = await Promise.all([getProducts()]);

  const staticEntries = STATIC_PAGES.map((path) => ({
    url: `${SITE_URL}/${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  const productEntries = products
    .filter((p) => p.disponibilidad)
    .map((p) => ({
      url: `${SITE_URL}/producto/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticEntries, ...productEntries];
}
