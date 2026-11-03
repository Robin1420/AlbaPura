"use client";

import Link from "next/link";
import { useState } from "react";
import { Loading } from "@/components/admin/AdminShell";
import { fmtDate, useAdminData } from "@/components/admin/useAdminData";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/useConfirm";
import { api, type ApiOrder } from "@/lib/api";
import { money } from "@/lib/products";

type Detail = {
  order: ApiOrder;
  trackingCode: string | null;
  paidAt: string | null;
  webpayAuthCode: string | null;
  allowed: { status: string; label: string }[];
  events: { actor: string; action: string; at: string }[];
};

const actionLabel: Record<string, string> = {
  paid: "Marcar como pagado",
  preparing: "Pasar a preparando",
  shipped: "Marcar como enviado",
  delivered: "Marcar como entregado",
  cancelled: "Cancelar pedido",
};

/** Detalle de un pedido. Con `inModal` va dentro de una ventana (sin enlace de regreso ni título propio). */
export function OrderDetail({ id, inModal = false, onChanged }: { id: string; inModal?: boolean; onChanged?: () => void }) {
  const { data, error, reload: reloadOrder } = useAdminData<Detail>(`/api/admin/orders/${id}`);
  const { confirm, dialog } = useConfirm();
  const reload = async () => {
    await reloadOrder();
    onChanged?.();
  };
  const [tracking, setTracking] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  if (!data) return <Loading error={error} />;
  const { order: o } = data;
  const code = tracking ?? data.trackingCode ?? "";

  async function patch(body: { status?: string; trackingCode?: string }) {
    setBusy(true);
    setMsg("");
    const r = await api<Detail>(`/api/admin/orders/${id}`, { method: "PATCH", body });
    setBusy(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setTracking(null);
    await reload();
  }

  function change(status: string) {
    if (status === "cancelled") {
      confirm({
        title: "¿Cancelar este pedido?",
        message: "Se devolverá el stock. Si ya estaba pagado, el reembolso se hace aparte.",
        confirmLabel: "Cancelar pedido",
        danger: true,
        action: async () => {
          const r = await api<Detail>(`/api/admin/orders/${id}`, { method: "PATCH", body: { status } });
          if (!r.ok) return r.error;
          await reload();
        },
      });
      return;
    }
    void patch({ status, ...(status === "shipped" ? { trackingCode: code } : {}) });
  }

  return (
    <>
      {!inModal && <Link href="/admin/pedidos" className="text-[16px] italic text-muted underline-offset-4 hover:underline">Volver a pedidos</Link>}
      <header className={`mb-8 flex flex-wrap items-baseline justify-between gap-4 ${inModal ? "" : "mt-3"}`}>
        {!inModal && <h1 className="text-[clamp(32px,4vw,48px)] font-semibold tracking-[-0.04em]">Pedido {o.id}</h1>}
        <span className="rounded-full bg-ink-800 px-4 py-1.5 font-display text-[14px] font-medium text-dew-50">{o.statusLabel}</span>
      </header>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid gap-8">
          <section className="rounded-xl border border-line bg-white p-6" aria-labelledby="items">
            <h2 id="items" className="text-[24px]">Productos</h2>
            <ul className="mt-4 divide-y divide-line">
              {o.items.map((i) => (
                <li key={i.slug} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="font-display text-[16px] font-medium">{i.name}<span className="block text-[14px] italic text-faint">{i.meta}, × {i.qty}</span></span>
                  <span className="font-display text-[16px] font-medium">{money(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 grid gap-1.5 border-t border-line pt-4 text-[16px]">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
              {o.gift > 0 && <div className="flex justify-between"><dt className="text-muted">Regalo</dt><dd>{money(o.gift)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Envío</dt><dd>{o.shipping === 0 ? "Gratis" : money(o.shipping)}</dd></div>
              <div className="flex justify-between font-display text-[20px] font-medium"><dt>Total</dt><dd>{money(o.total)}</dd></div>
            </dl>
          </section>

          <section className="rounded-xl border border-line bg-white p-6" aria-labelledby="cliente">
            <h2 id="cliente" className="text-[24px]">Cliente y entrega</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><dt className="text-[15px] italic text-faint">Nombre</dt><dd className="font-display text-[17px] font-medium">{o.address.name} {o.address.lastName}</dd></div>
              <div><dt className="text-[15px] italic text-faint">Correo</dt><dd className="font-display text-[17px] font-medium break-all">{o.email}</dd></div>
              <div><dt className="text-[15px] italic text-faint">Teléfono</dt><dd className="font-display text-[17px] font-medium">{o.address.phone}</dd></div>
              <div><dt className="text-[15px] italic text-faint">Envío</dt><dd className="font-display text-[17px] font-medium">{{ standard: "Delivery en Lima", express: "Delivery express", pickup: "Retiro en tienda" }[o.shippingMethod]}</dd></div>
              {o.shippingMethod !== "pickup" && <div className="sm:col-span-2"><dt className="text-[15px] italic text-faint">Dirección</dt><dd className="font-display text-[17px] font-medium">{o.address.line}, {o.address.comuna}, {o.address.region}</dd></div>}
              <div><dt className="text-[15px] italic text-faint">Pago</dt><dd className="font-display text-[17px] font-medium">{o.payment === "webpay" ? "Webpay" : "Transferencia"}{data.webpayAuthCode ? `, autorización ${data.webpayAuthCode}` : ""}</dd></div>
              <div><dt className="text-[15px] italic text-faint">Pagado</dt><dd className="font-display text-[17px] font-medium">{data.paidAt ? fmtDate(data.paidAt) : "Aún no"}</dd></div>
            </dl>
          </section>
        </div>

        <div className="grid content-start gap-8">
          <section className="rounded-xl border border-line bg-white p-6" aria-labelledby="acciones">
            <h2 id="acciones" className="text-[24px]">Acciones</h2>
            <div className="mt-4 grid gap-2">
              {data.allowed.length === 0 && <p className="text-[16px] italic text-faint">Este pedido ya no admite cambios de estado.</p>}
              {data.allowed.map((a) => (
                <Button key={a.status} variant={a.status === "cancelled" ? "secondary" : "primary"} disabled={busy} onClick={() => change(a.status)}>
                  {actionLabel[a.status] ?? a.label}
                </Button>
              ))}
            </div>
            <div className="mt-6 grid gap-2">
              <label htmlFor="track" className="font-display text-[14px] font-medium">Código de seguimiento</label>
              <div className="flex gap-2">
                <input id="track" value={code} onChange={(e) => setTracking(e.target.value)} placeholder="Ej. CHX-123456" className="h-11 min-w-0 flex-1 rounded-md border border-line-strong/60 bg-white px-4 text-[16px] outline-none focus:ring-2 focus:ring-leaf-500/50" />
                <Button variant="secondary" disabled={busy || code === (data.trackingCode ?? "")} onClick={() => void patch({ trackingCode: code })}>Guardar</Button>
              </div>
              <p className="text-[14px] italic text-faint">Al marcar como enviado, el cliente recibe un correo con este código.</p>
            </div>
            {msg && <p role="alert" className="mt-4 rounded-md bg-peach-100 px-4 py-3 text-[16px] text-danger">{msg}</p>}
          </section>

          <section className="rounded-xl border border-line bg-white p-6" aria-labelledby="historial">
            <h2 id="historial" className="text-[24px]">Historial</h2>
            {data.events.length === 0 ? <p className="mt-3 text-[16px] italic text-faint">Sin cambios registrados.</p> : (
              <ol className="mt-4 grid gap-3">
                {data.events.map((e, i) => (
                  <li key={i} className="border-l-2 border-leaf-500 pl-4">
                    <p className="text-[16px]">{e.action}</p>
                    <p className="text-[13px] italic text-faint">{e.actor}, {fmtDate(e.at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
      {dialog}
    </>
  );
}
