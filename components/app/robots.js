const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prestige-importaciones.vercel.app";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/checkout", "/carrito", "/login", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
