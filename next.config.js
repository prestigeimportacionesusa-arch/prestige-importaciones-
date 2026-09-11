/** @type {import('next').NextConfig} */
const nextConfig = {
  // Las fotos que se suben directo desde el panel (celular) suelen pesar
  // varios MB — el límite por defecto de Next.js para Server Actions es de
  // solo 1MB, así que lo subimos para que las subidas no fallen.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    // Antes se usaban los tamaños por defecto de Next.js (hasta 3840px, 4K),
    // pero ningún espacio de la tienda muestra una foto más ancha de ~800px
    // — pedir imágenes de 4K para mostrarlas en 300-500px era la causa
    // principal de que las fotos cargaran lento. Ajustado al rango real que
    // usa el sitio (tarjetas, galería, miniaturas).
    deviceSizes: [360, 480, 640, 750, 828, 1080],
    imageSizes: [56, 96, 128, 256, 384],
    minimumCacheTTL: 2592000,
  },
  async headers() {
    return [
      {
        // Cabeceras de seguridad aplicadas a todo el sitio.
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
