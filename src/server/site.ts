/** Dirección pública de la tienda (donde vive el front). */
export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
