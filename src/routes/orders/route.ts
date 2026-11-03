import { z } from "zod";
import { regions } from "@/checkout";
import { currentUser } from "@/server/auth";
import { orderEmail, sendEmail } from "@/server/email";
import { clientIp, fail, json, parseBody, rateLimit, sameOrigin } from "@/server/http";
import { createOrder, OrderError } from "@/server/orders";
import { culqiConfigured, culqiKeys } from "@/server/culqi";
import { appUrl } from "@/server/site";

const schema = z
  .object({
    email: z.string().trim().toLowerCase().email("Escribe un correo válido.").max(200),
    items: z
      .array(z.object({ slug: z.string().min(1).max(120), qty: z.number().int().min(1).max(20) }))
      .min(1, "El carrito está vacío.")
      .max(20),
    gift: z.boolean(),
    shippingMethod: z.enum(["standard", "express", "pickup"]),
    payment: z.enum(["culqi", "transfer"]),
    address: z.object({
      name: z.string().trim().min(2, "Escribe tu nombre.").max(80),
      lastName: z.string().trim().max(80).default(""),
      line: z.string().trim().max(200).default(""),
      region: z.string().trim().max(60).default(""),
      comuna: z.string().trim().max(80).default(""),
      phone: z
        .string()
        .trim()
        .max(25, "Teléfono demasiado largo.")
        .refine((v) => v.replace(/\D/g, "").length >= 8, "Escribe un teléfono de al menos 8 dígitos."),
    }),
  })
  .superRefine((v, ctx) => {
    if (v.shippingMethod === "pickup") return;
    const a = v.address;
    if (a.lastName.length < 2) ctx.addIssue({ code: "custom", path: ["lastName"], message: "Escribe tu apellido." });
    if (a.line.length < 5) ctx.addIssue({ code: "custom", path: ["line"], message: "Escribe la calle, el número y el departamento si corresponde." });
    if (!regions.includes(a.region)) ctx.addIssue({ code: "custom", path: ["region"], message: "Elige una zona." });
    if (a.comuna.length < 2) ctx.addIssue({ code: "custom", path: ["comuna"], message: "Escribe tu distrito." });
  });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido.", 403);
  if (!rateLimit(`order:${clientIp(req)}`, 20, 60 * 60_000)) return fail("Demasiados pedidos seguidos. Espera unos minutos.", 429);
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  if (body.data.payment === "culqi" && !culqiConfigured()) return fail("El pago con tarjeta o Yape todavía no está disponible. Elige transferencia o escríbenos por WhatsApp.", 503);
  const user = await currentUser();

  let order;
  try {
    order = await createOrder(body.data, user?.id ?? null);
  } catch (e) {
    if (e instanceof OrderError) return fail(e.message, e.status);
    console.error("Error al crear el pedido", e);
    return fail("No pudimos crear el pedido. Inténtalo de nuevo.", 500);
  }

  const view = `${appUrl()}/pedido/${order.id}?t=${order.publicToken}`;

  if (body.data.payment === "transfer") {
    const mail = orderEmail({
      id: order.id,
      name: body.data.address.name,
      items: order.lines,
      total: order.total,
      url: view,
      transferInfo: process.env.BANK_INFO ?? "Datos bancarios por confirmar",
    });
    void sendEmail({ to: body.data.email, ...mail });
    return json({ id: order.id, token: order.publicToken }, 201);
  }

  // Pago con tarjeta o Yape: el pedido queda pendiente y el navegador abre el checkout de Culqi.
  // El cobro se hace en /api/payments/culqi/charge con el monto de este pedido.
  return json({ id: order.id, token: order.publicToken, total: order.total, culqi: { publicKey: culqiKeys().pk } }, 201);
}
