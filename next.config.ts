import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Culqi (tarjeta y Yape) carga su script y su ventana de pago desde *.culqi.com
const culqi = "https://*.culqi.com";
const csp = [
  "default-src 'self'",
  // Next inyecta pequeños scripts en línea para hidratar; 'unsafe-eval' solo en desarrollo (recarga en caliente)
  `script-src 'self' 'unsafe-inline' ${culqi}${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline' ${culqi}`,
  `img-src 'self' data: blob: ${culqi} https://lh3.googleusercontent.com`,
  `font-src 'self' data: ${culqi}`,
  `connect-src 'self' ${culqi}${isDev ? " ws: wss:" : ""}`,
  `frame-src ${culqi}`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Permite abrir el servidor de desarrollo desde otros equipos de la red local (celular, otra laptop)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
