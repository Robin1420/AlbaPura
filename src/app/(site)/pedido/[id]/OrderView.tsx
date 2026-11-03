"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { ButtonLink } from "@/components/ui/Button";
import { api, type ApiOrder } from "@/lib/api";
import { estimateDelivery, shippingLabel } from "@/lib/checkout";
import { money } from "@/lib/products";

const stages = ["Confirmado", "Preparando", "En camino", "Entregado"] as const;
const stageOf: Record<ApiOrder["status"], number> = { pending_payment: 0, awaiting_transfer: 0, failed: 0, cancelled: 0, paid: 1, preparing: 1, shipped: 2, delivered: 3 };
const paymentLabel = { culqi: "Tarjeta o Yape", transfer: "Transferencia, Yape o Plin" } as const;

type Loaded = { order: ApiOrder; bankInfo: string | null } | "missing";

export function OrderView({ id, token }: { id: string; token: string; pago?: string }) {
  const cart = useCart();
  const [data, setData] = useState<Loaded | null>(null);
  const cleared = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void api<{ order: ApiOrder; bankInfo: string | null }>(`/api/orders/${id}${token ? `?t=${encodeURIComponent(token)}` : ""}`).then((r) => {
      if (!cancelled) setData(r.ok ? r.data : "missing");
    });
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  // El carrito solo se vacía cuando el pedido quedó pagado o esperando transferencia
  useEffect(() => {
    if (cleared.current || data === null || data === "missing") return;
    if (data.order.status === "paid" || data.order.status === "awaiting_transfer") {
      cleared.current = true;
      cart.clear();
    }
  }, [data, cart]);

  if (data === null) return <div className="min-h-[60vh]" aria-busy="true" />;

  if (data === "missing") {
    return (
      <div className="mx-auto max-w-[1440px] px-6 pb-16 pt-36 sm:pb-24 sm:pt-48 lg:px-20">
        <h1 className="text-[clamp(30px,6vw,80px)] font-semibold tracking-[-0.04em]">No encontramos este pedido</h1>
        <p className="mt-4 max-w-[48ch] text-[20px] text-muted">Revisa que el enlace esté completo o ingresa a tu cuenta para ver tus pedidos.</p>
        <ButtonLink href="/cuenta" size="lg" className="mt-8">Ir a mi cuenta</ButtonLink>
      </div>
    );
  }

  const { order, bankInfo } = data;
  const current = stageOf[order.status];
  const first = order.address.name.split(" ")[0];
  const failed = order.status === "failed" || order.status === "cancelled";
  const transfer = order.status === "awaiting_transfer";

  const heading = failed ? "No se completó el pago." : transfer ? `Casi listo, ${first}.` : `Gracias por tu compra, ${first}.`;
  const lead = failed
    ? "No se hizo ningún cargo. Puedes volver a la tienda e intentarlo de nuevo."
    : transfer
      ? "Para confirmar tu pedido, transfiere el total con los datos de abajo. Te los enviamos también a tu correo."
      : `Te enviamos la confirmación a ${order.email}. Te escribiremos para coordinar la entrega.`;

  return (
    <>
      <header className="bg-dawn pb-10 pt-36 sm:pb-16 sm:pt-44">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-20">
          <p className={`inline-flex items-center gap-3 rounded-full py-1.5 pl-2 pr-4 font-display text-[14px] font-medium ${failed ? "bg-danger text-white" : "bg-ink-800 text-dew-50"}`}>
            <span className={`grid size-6 place-items-center rounded-full ${failed ? "bg-white text-danger" : "bg-leaf-500 text-ink-900"}`} aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">{failed ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M20 6 9 17l-5-5" />}</svg>
            </span>
            Pedido {order.id}: {order.statusLabel.toLowerCase()}
          </p>
          <h1 className="mt-6 max-w-[16ch] text-[clamp(34px,6.5vw,96px)] font-semibold tracking-[-0.04em]">{heading}</h1>
          <p className="mt-4 max-w-[52ch] text-[20px] text-muted">{lead}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-14 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-20">
        <div className="grid gap-12">
          {transfer && bankInfo && (
            <section className="rounded-xl border border-ink-800 p-6" aria-labelledby="banco">
              <h2 id="banco" className="text-[26px]">Datos para la transferencia</h2>
              <p className="mt-3 text-[19px]">{bankInfo}</p>
              <p className="mt-3 text-[16px] italic text-faint">Monto exacto: {money(order.total)}. Indica el número de pedido {order.id} en el comentario.</p>
            </section>
          )}

          {!failed && (
            <section aria-labelledby="estado">
              <h2 id="estado" className="text-[28px]">Estado del pedido</h2>
              <ol className="mt-6 grid grid-cols-4 gap-2">
                {stages.map((s, i) => (
                  <li key={s} className="relative pt-5" aria-current={i === current ? "step" : undefined}>
                    <span className={`absolute left-0 top-0 h-1 w-full rounded-full ${i <= current && !(transfer && i === 0) ? "bg-ink-800" : "bg-line"}`} />
                    <span className={`font-display text-[15px] font-medium ${i <= current && !(transfer && i === 0) ? "text-ink-900" : "text-faint"}`}>{s}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section aria-labelledby="entrega" className="grid gap-8 sm:grid-cols-3">
            <h2 id="entrega" className="sr-only">Detalles de entrega y pago</h2>
            <div>
              <h3 className="text-[16px] italic text-leaf-600" style={{ fontFamily: "var(--font-text)", fontWeight: 400, letterSpacing: 0 }}>Entrega estimada</h3>
              <p className="mt-1 font-display text-[18px] font-medium capitalize">{estimateDelivery(order.shippingMethod, new Date(order.date))}</p>
              <p className="text-[15px] italic text-faint">{shippingLabel(order.shippingMethod)}</p>
            </div>
            <div>
              <h3 className="text-[16px] italic text-leaf-600" style={{ fontFamily: "var(--font-text)", fontWeight: 400, letterSpacing: 0 }}>{order.shippingMethod === "pickup" ? "Retiro en" : "Dirección"}</h3>
              <p className="mt-1 font-display text-[18px] font-medium">{order.shippingMethod === "pickup" ? "Lima, a coordinar" : order.address.line}</p>
              <p className="text-[15px] italic text-faint">{order.shippingMethod === "pickup" ? "Te escribiremos para acordar el punto" : `${order.address.comuna}, ${order.address.region}`}</p>
            </div>
            <div>
              <h3 className="text-[16px] italic text-leaf-600" style={{ fontFamily: "var(--font-text)", fontWeight: 400, letterSpacing: 0 }}>Pago</h3>
              <p className="mt-1 font-display text-[18px] font-medium">{paymentLabel[order.payment]}</p>
              <p className="text-[15px] italic text-faint">{money(order.total)}</p>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            {failed ? <ButtonLink href="/checkout" size="lg">Intentar de nuevo</ButtonLink> : <ButtonLink href="/cuenta" size="lg">Ver mis pedidos</ButtonLink>}
            <ButtonLink href="/tienda" size="lg" variant="secondary">Seguir comprando</ButtonLink>
          </div>
        </div>

        <aside className="h-fit rounded-xl bg-dew-100 p-8" aria-label="Resumen del pedido">
          <h2 className="text-[28px]">Resumen</h2>
          <ul className="mt-6 divide-y divide-line-strong/30">
            {order.items.map((i) => (
              <li key={i.slug} className="flex items-baseline justify-between gap-4 py-3">
                <span>
                  <Link href={`/producto/${i.slug}`} className="font-display text-[16px] font-medium hover:underline">{i.name}</Link>
                  <span className="block text-[14px] italic text-faint">{i.meta}, × {i.qty}</span>
                </span>
                <span className="font-display text-[16px] font-medium">{money(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid gap-2 border-t border-line-strong/40 pt-4 text-[17px]">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-display font-medium">{money(order.subtotal)}</dd></div>
            {order.gift > 0 && <div className="flex justify-between"><dt className="text-muted">Envoltorio de regalo</dt><dd className="font-display font-medium">{money(order.gift)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Envío</dt><dd className="font-display font-medium">{order.shipping === 0 ? "Gratis" : money(order.shipping)}</dd></div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-line-strong/40 pt-4">
            <span className="font-display text-[20px] font-medium">Total</span>
            <span className="font-display text-[34px] font-medium tracking-[-0.04em]">{money(order.total)}</span>
          </div>
        </aside>
      </div>
    </>
  );
}
