import { culqiConfigured, culqiQrEnabled } from "@/server/culqi";
import { json } from "@/server/http";

/** Qué formas de pago están activas. La tienda muestra "Tarjeta o Yape" solo cuando Culqi está configurado. */
export async function GET() {
  const res = json({ culqi: culqiConfigured(), qr: culqiQrEnabled() });
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
}
