/** Datos del sitio que usan los metadatos, el sitemap y los datos estructurados. */
export const SITE = {
  name: "Alba Pura",
  tagline: "Productos orgánicos",
  description: "Productos orgánicos hechos en Lima para cuidar tu piel, tu salud y el medio ambiente.",
  locale: "es_PE",
  // En producción define APP_URL con el dominio real (https://tudominio.pe)
  url: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  city: "Lima",
  country: "Perú",
  founder: { name: "Yuleisi Cucho", role: "Bióloga", university: "Universidad Nacional Federico Villarreal" },
  // Datos de contacto reales: se definen por variable de entorno y solo se muestran si existen.
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || undefined,
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || undefined,
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM || undefined,
} as const;

/** URL absoluta a partir de una ruta del sitio. */
export const abs = (path: string) => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;

/** Recorta un texto para una meta descripción (los buscadores muestran unos 155 caracteres). */
export function snippet(text: string, max = 155) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
