"use client";

import { useState } from "react";
import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { OrderModal } from "@/components/admin/OrderModal";
import { fmtDate, useAdminData } from "@/components/admin/useAdminData";
import { money } from "@/lib/products";

type Row = { id: string; email: string; status: string; statusLabel: string; total: number; payment: string; shippingMethod: string; createdAt: string; customer: string };

const statuses: [string, string][] = [
  ["", "Todos"],
  ["awaiting_transfer", "Esperando transferencia"],
  ["paid", "Pagados"],
  ["preparing", "Preparando"],
  ["shipped", "En camino"],
  ["delivered", "Entregados"],
  ["cancelled", "Cancelados"],
  ["failed", "Pago rechazado"],
  ["pending_payment", "Pendientes de pago"],
];

const tone = (s: string) => (s === "delivered" ? "bg-leaf-300" : s === "failed" || s === "cancelled" ? "bg-danger/10 text-danger" : s === "shipped" ? "bg-sky-300" : "bg-peach-100");

export default function Orders() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const qs = new URLSearchParams({ ...(status && { status }), ...(q.trim() && { q: q.trim() }) }).toString();
  const { data, error, reload } = useAdminData<{ orders: Row[] }>(`/api/admin/orders${qs ? `?${qs}` : ""}`);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <PageTitle sub="Cambia el estado, agrega el código de seguimiento y revisa el historial de cada pedido.">Pedidos</PageTitle>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="q">Buscar por número o correo</label>
        <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por número o correo" className="h-11 w-72 rounded-full border border-line-strong/60 bg-white px-5 text-[16px] outline-none focus:ring-2 focus:ring-leaf-500/50" />
        <label className="sr-only" htmlFor="st">Estado</label>
        <select id="st" value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-full border border-line-strong/60 bg-white px-4 font-display text-[15px]">
          {statuses.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {!data ? <Loading error={error} /> : data.orders.length === 0 ? (
        <p className="py-10 text-[18px] italic text-faint">No hay pedidos con ese filtro.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-line text-[14px] italic text-faint">
              <tr><th className="px-5 py-3 font-normal">Pedido</th><th className="px-5 py-3 font-normal">Cliente</th><th className="px-5 py-3 font-normal">Estado</th><th className="px-5 py-3 font-normal">Pago</th><th className="px-5 py-3 text-right font-normal">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.orders.map((o) => (
                <tr key={o.id} className="hover:bg-dew-100">
                  <td className="px-5 py-4"><button type="button" onClick={() => setOpenId(o.id)} className="font-display text-[16px] font-medium underline-offset-4 hover:underline">{o.id}</button><span className="block text-[13px] italic text-faint">{fmtDate(o.createdAt)}</span></td>
                  <td className="px-5 py-4 text-[16px]">{o.customer}<span className="block text-[13px] italic text-faint">{o.email}</span></td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 font-display text-[13px] font-medium ${tone(o.status)}`}>{o.statusLabel}</span></td>
                  <td className="px-5 py-4 text-[15px] text-muted">{o.payment === "culqi" ? "Tarjeta / Yape / QR" : "Transferencia"}</td>
                  <td className="px-5 py-4 text-right font-display text-[16px] font-medium">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <OrderModal id={openId} onClose={() => setOpenId(null)} onChanged={() => void reload()} />
    </>
  );
}
