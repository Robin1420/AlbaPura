import { randomUUID } from "node:crypto";
import { store } from "@/shims/context";
import { requireAdmin } from "@/server/auth";
import { fail, json, rateLimit, sameOrigin } from "@/server/http";

const MAX_BYTES = 10 * 1024 * 1024;

/** Sube un PDF (proceso de elaboración o manual de uso) a R2 y devuelve su URL. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  const auth = await requireAdmin();
  if ("res" in auth) return auth.res;
  if (!rateLimit(`upload-doc:${auth.user.id}`, 30, 10 * 60_000)) return fail("Demasiadas subidas seguidas. Espera un momento.", 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("No se pudo leer el archivo.", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Elige un PDF para subir.", 400);
  if (file.size === 0) return fail("El archivo está vacío.", 400);
  if (file.size > MAX_BYTES) return fail("El PDF pesa más de 10 MB. Redúcelo y vuelve a subirlo.", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  // El tipo se lee de los bytes: todo PDF empieza con "%PDF-"
  if (String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") return fail("Solo se aceptan archivos PDF.", 415);

  const bucket = store().env.MEDIA;
  if (!bucket) return fail("El almacén de archivos todavía no está configurado.", 503);
  const name = `${randomUUID()}.pdf`;
  await bucket.put(name, bytes, { httpMetadata: { contentType: "application/pdf" }, customMetadata: { originalName: file.name.slice(0, 120) } });
  return json({ url: `/api/media/${name}`, bytes: bytes.length, name: file.name.slice(0, 120) }, 201);
}
