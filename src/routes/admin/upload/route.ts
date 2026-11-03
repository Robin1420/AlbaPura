import { randomUUID } from "node:crypto";
import { store } from "@/shims/context";
import { requireAdmin } from "@/server/auth";
import { db, media } from "@/server/db";
import { fail, json, rateLimit, sameOrigin } from "@/server/http";
import { inspectImage } from "@/server/image-info";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 8000;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  if (!rateLimit(`upload:${auth.user.id}`, 60, 10 * 60_000)) return fail("Demasiadas subidas seguidas. Espera un momento.", 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("No se pudo leer el archivo.", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Elige una imagen para subir.", 400);
  if (file.size === 0) return fail("El archivo está vacío.", 400);
  if (file.size > MAX_BYTES) return fail("La imagen pesa más de 5 MB. Redúcela y vuelve a subirla.", 413);

  // El tipo y el tamaño en píxeles se leen de los bytes del archivo, no del nombre ni del Content-Type
  const bytes = new Uint8Array(await file.arrayBuffer());
  const info = inspectImage(bytes);
  if (!info) return fail("Solo se aceptan imágenes JPG, PNG o WebP válidas.", 415);
  if (info.width > MAX_SIDE || info.height > MAX_SIDE) return fail(`La imagen mide ${info.width}×${info.height} px. El máximo es ${MAX_SIDE} px por lado.`, 413);

  const bucket = store().env.MEDIA;
  if (!bucket) return fail("El almacén de fotos todavía no está configurado.", 503);
  const name = `${randomUUID()}.${info.ext}`;
  await bucket.put(name, bytes, { httpMetadata: { contentType: info.mime } });
  try {
    await db.insert(media).values({ name, originalName: file.name.slice(0, 120), mime: info.mime, width: info.width, height: info.height, bytes: bytes.length, uploadedBy: auth.user.email });
  } catch {
    await bucket.delete(name).catch(() => {});
    return fail("No pudimos registrar la imagen. Inténtalo de nuevo.", 500);
  }
  return json({ url: `/api/media/${name}`, width: info.width, height: info.height }, 201);
}
