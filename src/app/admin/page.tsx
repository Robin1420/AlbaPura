"use client";

import Link from "next/link";
import { useState } from "react";
import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { OrderModal } from "@/components/admin/OrderModal";
import { fmtDate, useAdminData } from "@/components/admin/useAdminData";
import { money } from "@/lib/products";

type Summary = {
  byStatus: Record<string, { n: number; total: number }>;
  month: { orders: number; revenue: number };
  daily: { day: string; total: number }[];
  lowStock: { slug: string; name: string; stock: number }[];
  unreadMessages: number;
  subscribers: number;
  toAttend: { id: string; status: string; total: number; email: string; createdAt: string }[];
};

const label: Record<string, string> = { awaiting_transfer: "Esperando transferencia", paid: "Pagado, por preparar", preparing: "Preparando" };

/** Barras de ventas de los últimos 14 días. Los días sin ventas quedan en cero. */
function SalesChart({ daily }: { daily: Summary["daily"] }) {
  const days = daily.map((d) => ({ key: d.day, label: new Date(`${d.day}T12:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short" }), total: d.total }));
  const max = Math.max(1, ...days.map((d) => d.total));
  const sum = days.reduce((a, d) => a + d.total, 0);
  return (
    <section aria-labelledby="ventas" className="rounded-2xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ventas" className="text-[26px]">Ventas, últimos 14 días</h2>
        <p className="font-display text-[20px] font-medium">{money(sum)}</p>
      </div>
      {sum === 0 ? (
        <p className="mt-6 text-[17px] italic text-faint">Aún no hay ventas en este período.</p>
      ) : (
        <ul className="mt-6 flex h-44 items-end gap-2" role="img" aria-label={`Ventas por día, total ${money(sum)}`}>
          {days.map((d) => (
            <li key={d.key} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.label}: ${money(d.total)}`}>
              <span className="block w-full rounded-t-md bg-leaf-400 transition-colors group-hover:bg-ink-800" style={{ height: `${Math.max(d.total > 0 ? 6 : 2, (d.total / max) * 100)}%`, opacity: d.total > 0 ? 1 : 0.35 }} />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex justify-between text-[13px] italic text-faint" aria-hidden="true"><span>{days[0].label}</span><span>{days[13].label}</span></div>
    </section>
  );
}

export default function AdminHome() {
  const { data, error, reload } = useAdminData<Summary>("/api/admin/summary");
  const [openId, setOpenId] = useState<string | null>(null);
  if (!data) return <Loading error={error} />;
  const attend = (data.byStatus.awaiting_transfer?.n ?? 0) + (data.byStatus.paid?.n ?? 0) + (data.byStatus.preparing?.n ?? 0);

  const cards = [
    { k: "Pedidos por atender", v: String(attend), href: "/admin/pedidos" },
    { k: "Ventas de los últimos 30 días", v: money(data.month.revenue), sub: `${data.month.orders} pedidos`, href: "/admin/pedidos" },
    { k: "Mensajes sin leer", v: String(data.unreadMessages), href: "/admin/mensajes" },
    { k: "Suscriptores", v: String(data.subscribers), href: "/admin/suscriptores" },
  ];

  return (
    <>
      <PageTitle sub="Lo que necesita tu atención hoy.">Resumen</PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.k} href={c.href} className="group rounded-2xl border border-line bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-800 hover:shadow-[0_18px_40px_-24px_rgb(8_24_15/0.4)]">
            <p className="text-[16px] italic text-faint">{c.k}</p>
            <p className="mt-1 font-display text-[36px] font-medium leading-none tracking-[-0.04em]">{c.v}</p>
            {c.sub && <p className="mt-2 text-[15px] text-muted">{c.sub}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-8"><SalesChart daily={data.daily} /></div>

      <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="atender">
          <h2 id="atender" className="text-[26px]">Para atender</h2>
          {data.toAttend.length === 0 ? (
            <p className="mt-4 text-[18px] italic text-faint">No hay pedidos pendientes.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
              {data.toAttend.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => setOpenId(o.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-dew-100">
                    <span>
                      <span className="font-display text-[17px] font-medium">{o.id}</span>
                      <span className="block text-[14px] italic text-faint">{o.email}, {fmtDate(o.createdAt)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-display text-[17px] font-medium">{money(o.total)}</span>
                      <span className="text-[14px] text-muted">{label[o.status] ?? o.status}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="stock">
          <h2 id="stock" className="text-[26px]">Stock bajo</h2>
          {data.lowStock.length === 0 ? (
            <p className="mt-4 text-[18px] italic text-faint">Todos los productos tienen stock suficiente.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
              {data.lowStock.map((p) => (
                <li key={p.slug} className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="font-display text-[16px] font-medium">{p.name}</span>
                  <span className={`rounded-full px-3 py-1 font-display text-[13px] font-medium ${p.stock === 0 ? "bg-danger text-white" : "bg-peach-100"}`}>{p.stock === 0 ? "Agotado" : `Quedan ${p.stock}`}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/productos" className="mt-4 inline-block font-display text-[15px] font-medium text-leaf-600 underline-offset-4 hover:underline">Ajustar stock</Link>
        </section>
      </div>
      <OrderModal id={openId} onClose={() => setOpenId(null)} onChanged={() => void reload()} />
    </>
  );
}
