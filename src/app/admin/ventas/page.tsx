"use client";

import { useMemo, useState } from "react";
import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { useAdminData } from "@/components/admin/useAdminData";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/useConfirm";
import { api } from "@/lib/api";
import { pct, soles, toNum } from "@/lib/costing";
import { channelLabel, manualChannels, paymentLabel, periodRange } from "@/lib/sales";

type Acc = { key: string; sales: number; units: number; revenue: number; cost: number; fee: number; profit: number; incomplete: number; name?: string };
type Profit = { total: Acc & { margin: number }; channels: Acc[]; products: Acc[] };
type Sale = {
  id: string; channel: string; channelNote: string | null; customerName: string; customerPhone: string | null; customerCompany: string | null; customerDoc: string | null;
  payment: string; paid: boolean; status: "completed" | "cancelled"; total: number; subtotal: number; discount: number; shipping: number; costTotal: number; costComplete: boolean; fee: number; profit: number; soldAt: number;
  items: { id: number; name: string; qty: number; price: number; unitCost: number | null }[];
};
type Stock = { products: { slug: string; name: string; stock: number; price: number; unitCost: number | null }[] };

const input = "h-11 w-full rounded-md border border-line-strong/60 bg-white px-3 text-[16px] outline-none focus:ring-2 focus:ring-leaf-500/50";
const lab = "mb-1.5 block font-display text-[15px] font-medium";
const day = (t: number) => new Date(t * 1000).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
const periods = [["today", "Hoy"], ["month", "Este mes"], ["30d", "30 días"], ["all", "Todo"]] as const;

function Card({ title, value, sub, dark }: { title: string; value: string; sub?: string; dark?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${dark ? "border-ink-800 bg-ink-800 text-dew-50" : "border-line bg-white"}`}>
      <p className={`text-[15px] italic ${dark ? "text-dew-200/70" : "text-faint"}`}>{title}</p>
      <p className="mt-1 font-display text-[30px] font-medium leading-none tracking-[-0.03em]">{value}</p>
      {sub && <p className={`mt-2 text-[14px] ${dark ? "text-dew-200/70" : "text-muted"}`}>{sub}</p>}
    </div>
  );
}

type Row = { slug: string; qty: string; price: string };

/** Formulario de venta fuera de la web: WhatsApp, redes, tienda, feria o empresas. */
function NewSale({ products, onDone, onCancel }: { products: Stock["products"]; onDone: () => void; onCancel: () => void }) {
  const [channel, setChannel] = useState<string>("whatsapp");
  const [channelNote, setChannelNote] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [doc, setDoc] = useState("");
  const [company, setCompany] = useState("");
  const [payment, setPayment] = useState("yape");
  const [paid, setPaid] = useState(true);
  const [rows, setRows] = useState<Row[]>([{ slug: products[0]?.slug ?? "", qty: "1", price: "" }]);
  const [discount, setDiscount] = useState("");
  const [shipping, setShipping] = useState("");
  const [fee, setFee] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
  const set = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const lines = rows.map((r) => {
    const p = bySlug.get(r.slug);
    const qty = Math.max(0, Math.round(toNum(r.qty)));
    const price = r.price.trim() === "" ? (p?.price ?? 0) : toNum(r.price);
    return { r, p, qty, price };
  });
  const subtotal = lines.reduce((t, l) => t + l.price * l.qty, 0);
  const revenue = Math.max(0, subtotal - toNum(discount));
  const cost = lines.reduce((t, l) => t + (l.p?.unitCost ?? 0) * l.qty, 0);
  const missingCost = lines.some((l) => l.p && l.p.unitCost == null);
  const profit = revenue - cost - toNum(fee);

  async function submit() {
    setBusy(true);
    setError("");
    setFields({});
    const body = {
      channel, channelNote: channelNote || null, customerName: name, customerPhone: phone || null, customerEmail: email || null, customerDoc: doc || null, customerCompany: company || null,
      payment, paid, discount: toNum(discount), shipping: toNum(shipping), fee: toNum(fee), notes: notes || null,
      items: lines.filter((l) => l.qty > 0).map((l) => ({ slug: l.r.slug, qty: l.qty, ...(l.r.price.trim() === "" ? {} : { price: l.price }) })),
    };
    const res = await api("/api/admin/sales", { body });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return setFields(res.fields);
    }
    onDone();
  }

  const err = (k: string) => fields[k] && <span className="mt-1 block text-[14px] text-danger">{fields[k]}</span>;

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block"><span className={lab}>¿Por dónde vendiste?</span>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className={input}>{manualChannels.map((c) => <option key={c} value={c}>{channelLabel[c]}</option>)}</select>
        </label>
        <label className="block"><span className={lab}>Detalle del canal (opcional)</span>
          <input value={channelNote} onChange={(e) => setChannelNote(e.target.value)} className={input} placeholder={channel === "feria" ? "Ej.: Feria Ecológica de Barranco" : channel === "b2b" ? "Ej.: referido por…" : "Ej.: cuenta o campaña"} />
        </label>
        <label className="block"><span className={lab}>Cliente</span><input value={name} onChange={(e) => setName(e.target.value)} className={input} data-autofocus />{err("customerName")}</label>
        <label className="block"><span className={lab}>Celular</span><input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} /></label>
        {channel === "b2b" && (
          <>
            <label className="block"><span className={lab}>Empresa</span><input value={company} onChange={(e) => setCompany(e.target.value)} className={input} />{err("customerCompany")}</label>
            <label className="block"><span className={lab}>RUC</span><input inputMode="numeric" value={doc} onChange={(e) => setDoc(e.target.value.replace(/\D/g, ""))} className={input} /></label>
          </>
        )}
        <label className="block"><span className={lab}>Correo (opcional)</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
      </div>

      <div className="grid gap-3">
        <span className={lab}>Productos</span>
        {lines.map((l, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_90px_130px_auto]">
            <select value={l.r.slug} onChange={(e) => set(i, { slug: e.target.value })} className={input} aria-label="Producto">
              {products.map((p) => <option key={p.slug} value={p.slug}>{p.name} · {p.stock} en stock</option>)}
            </select>
            <input inputMode="numeric" value={l.r.qty} onChange={(e) => set(i, { qty: e.target.value.replace(/\D/g, "") })} className={input} aria-label="Cantidad" />
            <input inputMode="decimal" value={l.r.price} onChange={(e) => set(i, { price: e.target.value })} className={input} placeholder={`S/ ${l.p?.price ?? 0}`} aria-label="Precio unitario" />
            <Button type="button" variant="ghost" disabled={rows.length === 1} onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>Quitar</Button>
          </div>
        ))}
        <Button type="button" variant="secondary" className="w-fit" onClick={() => setRows((r) => [...r, { slug: products[0]?.slug ?? "", qty: "1", price: "" }])}>Agregar otro producto</Button>
        <p className="text-[14px] italic text-faint">El precio se llena solo con el de la tienda; escribe otro si diste precio especial (por ejemplo, mayorista).</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-4">
        <label className="block"><span className={lab}>Descuento (S/)</span><input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} className={input} /></label>
        <label className="block"><span className={lab}>Envío cobrado (S/)</span><input inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value)} className={input} /></label>
        <label className="block"><span className={lab}>Otros gastos (S/)</span><input inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} className={input} /></label>
        <label className="block"><span className={lab}>Forma de pago</span>
          <select value={payment} onChange={(e) => setPayment(e.target.value)} className={input}>{Object.entries(paymentLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </label>
      </div>
      <label className="flex items-center gap-3 text-[16px]"><input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="size-5 accent-leaf-600" />Ya me pagaron (si no, queda “Por cobrar” y no cuenta en la utilidad hasta cobrarla)</label>
      <label className="block"><span className={lab}>Notas (opcional)</span><input value={notes} onChange={(e) => setNotes(e.target.value)} className={input} /></label>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-4"><p className="text-[14px] italic text-faint">Total a cobrar</p><p className="font-display text-[26px] font-medium leading-tight">{soles(revenue + toNum(shipping))}</p></div>
        <div className="rounded-xl border border-line bg-white p-4"><p className="text-[14px] italic text-faint">Costo de producir</p><p className="font-display text-[26px] font-medium leading-tight">{soles(cost)}</p></div>
        <div className="rounded-xl bg-ink-800 p-4 text-dew-50"><p className="text-[14px] italic text-dew-200/70">Utilidad estimada</p><p className="font-display text-[26px] font-medium leading-tight">{soles(profit)}</p></div>
      </div>
      {missingCost && <p className="text-[15px] text-muted">Algún producto no tiene receta en Costos, así que su costo cuenta como S/ 0 y la utilidad sale incompleta.</p>}
      {error && <p role="alert" className="text-[16px] text-danger">{error}</p>}
      <ModalActions>
        <Button type="button" disabled={busy || !name.trim() || subtotal <= 0} onClick={() => void submit()}>{busy ? "Guardando…" : "Registrar venta"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>Cancelar</Button>
      </ModalActions>
    </div>
  );
}

function Breakdown({ title, rows, label }: { title: string; rows: Acc[]; label: (a: Acc) => string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <p className="px-5 pt-4 font-display text-[18px] font-medium">{title}</p>
      <table className="mt-2 w-full min-w-[480px] text-left">
        <thead className="border-b border-line text-[14px] italic text-faint"><tr><th className="px-5 py-2 font-normal">{title.startsWith("Por canal") ? "Canal" : "Producto"}</th><th className="whitespace-nowrap px-5 py-2 text-right font-normal">{title.startsWith("Por canal") ? "Ventas" : "Unidades"}</th><th className="whitespace-nowrap px-5 py-2 text-right font-normal">Ingresos</th><th className="whitespace-nowrap px-5 py-2 text-right font-normal">Utilidad</th></tr></thead>
        <tbody className="divide-y divide-line">
          {rows.length === 0 && <tr><td colSpan={4} className="px-5 py-4 text-[16px] text-muted">Sin ventas en este periodo.</td></tr>}
          {rows.map((a) => (
            <tr key={a.key}>
              <td className="px-5 py-3 font-display text-[16px] font-medium">{label(a)}{a.incomplete > 0 && <span className="ml-2 text-[13px] font-normal italic text-faint">incompleta</span>}</td>
              <td className="whitespace-nowrap px-5 py-3 text-right text-[16px]">{title.startsWith("Por canal") ? a.sales : a.units}</td>
              <td className="whitespace-nowrap px-5 py-3 text-right text-[16px]">{soles(a.revenue)}</td>
              <td className="whitespace-nowrap px-5 py-3 text-right font-display text-[16px] font-medium">{soles(a.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Ventas() {
  const [period, setPeriod] = useState<(typeof periods)[number][0]>("month");
  const [channel, setChannel] = useState("");
  const range = useMemo(() => periodRange(period), [period]);
  const qs = `from=${range.from}&to=${range.to}`;
  const { data: profit, error } = useAdminData<Profit>(`/api/admin/profit?${qs}`);
  const { data: list, reload } = useAdminData<{ sales: Sale[] }>(`/api/admin/sales?${qs}${channel ? `&channel=${channel}` : ""}`);
  const { data: stock, reload: reloadStock } = useAdminData<Stock>("/api/admin/stock");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Sale | null>(null);
  const { confirm, dialog } = useConfirm();

  const done = () => {
    setOpen(false);
    void reload();
    void reloadStock();
  };
  // Cobrar o anular cambia la utilidad: se vuelve a pedir todo
  const refresh = () => window.location.reload();

  const t = profit?.total;

  return (
    <>
      <PageTitle sub="Utilidad real de cada venta —web y manuales— según lo que costó producirla. Identifica por qué canal vendiste.">Ventas</PageTitle>
      {!profit || !list ? <Loading error={error} /> : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {periods.map(([k, l]) => (
              <button key={k} type="button" onClick={() => setPeriod(k)} aria-pressed={period === k} className={`h-10 rounded-full border px-4 font-display text-[15px] font-medium ${period === k ? "border-ink-800 bg-ink-800 text-dew-50" : "border-line bg-white"}`}>{l}</button>
            ))}
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Ingresos" value={soles(t?.revenue)} sub={`${t?.sales ?? 0} venta(s) · ${t?.units ?? 0} unidades`} />
            <Card title="Costo de producir" value={soles(t?.cost)} />
            <Card title="Otros gastos" value={soles(t?.fee)} sub="Comisión de pasarela y gastos que anotes" />
            <Card dark title="Utilidad real" value={soles(t?.profit)} sub={`Margen ${pct(t?.margin)}`} />
          </div>
          {(t?.incomplete ?? 0) > 0 && (
            <p className="mb-6 rounded-lg bg-peach-100 px-4 py-3 text-[16px]">{t?.incomplete} venta(s) incluyen productos sin receta o vendidos antes de activar este control, así que su costo cuenta como S/ 0 y la utilidad real es menor a la mostrada.</p>
          )}

          <div className="mb-8 grid gap-5 lg:grid-cols-2">
            <Breakdown title="Por canal de venta" rows={profit.channels} label={(a) => channelLabel[a.key] ?? a.key} />
            <Breakdown title="Por producto" rows={profit.products} label={(a) => a.name ?? a.key} />
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Button variant="accent" onClick={() => setOpen(true)} disabled={!stock}>Registrar venta manual</Button>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="h-11 rounded-md border border-line-strong/60 bg-white px-3 text-[16px]" aria-label="Filtrar por canal">
              <option value="">Todos los canales manuales</option>
              {manualChannels.map((c) => <option key={c} value={c}>{channelLabel[c]}</option>)}
            </select>
          </div>
          <p className="mb-3 text-[15px] italic text-faint">Las ventas de la web se ven en Pedidos. Aquí van las que registras tú: WhatsApp, redes, tienda, ferias y empresas.</p>

          {list.sales.length === 0 ? (
            <p className="rounded-xl border border-line bg-white p-8 text-[18px] text-muted">No hay ventas manuales en este periodo.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-line text-[14px] italic text-faint"><tr><th className="px-5 py-3 font-normal">Venta</th><th className="px-5 py-3 font-normal">Canal</th><th className="px-5 py-3 font-normal">Cliente</th><th className="px-5 py-3 font-normal">Estado</th><th className="whitespace-nowrap px-5 py-3 text-right font-normal">Total</th><th className="whitespace-nowrap px-5 py-3 text-right font-normal">Utilidad</th><th className="whitespace-nowrap px-5 py-3 text-right font-normal">Acciones</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {list.sales.map((s) => (
                    <tr key={s.id} className={s.status === "cancelled" ? "opacity-60" : ""}>
                      <td className="px-5 py-4 font-display text-[16px] font-medium">{s.id}<span className="block text-[13px] font-normal italic text-faint">{day(s.soldAt)}</span></td>
                      <td className="px-5 py-4 text-[16px]">{channelLabel[s.channel]}{s.channelNote && <span className="block text-[13px] italic text-faint">{s.channelNote}</span>}</td>
                      <td className="px-5 py-4 text-[16px]">{s.customerCompany ?? s.customerName}{s.customerCompany && <span className="block text-[13px] italic text-faint">{s.customerName}</span>}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 font-display text-[13px] font-medium ${s.status === "cancelled" ? "bg-dew-100 text-faint" : s.paid ? "bg-leaf-300" : "bg-peach-100"}`}>{s.status === "cancelled" ? "Anulada" : s.paid ? "Cobrada" : "Por cobrar"}</span></td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-[16px]">{soles(s.total)}<span className="block text-[13px] italic text-faint">{paymentLabel[s.payment]}</span></td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-display text-[16px] font-medium">{soles(s.profit)}{!s.costComplete && <span className="block text-[13px] font-normal italic text-faint">incompleta</span>}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => setView(s)}>Ver</Button>
                          {s.status === "completed" && !s.paid && (
                            <Button size="sm" onClick={() => confirm({ title: `¿Marcar ${s.id} como cobrada?`, message: `Se registra el cobro de ${soles(s.total)} y la venta pasa a contar en la utilidad.`, confirmLabel: "Marcar cobrada", action: async () => {
                              const r = await api(`/api/admin/sales/${s.id}`, { method: "PATCH", body: { action: "pay" } });
                              if (!r.ok) return r.error;
                              refresh();
                            } })}>Cobrada</Button>
                          )}
                          {s.status === "completed" && (
                            <Button size="sm" variant="ghost" className="text-danger" onClick={() => confirm({ title: `¿Anular ${s.id}?`, message: "Las unidades vuelven al stock y la venta deja de contar en la utilidad.", confirmLabel: "Anular venta", danger: true, action: async () => {
                              const r = await api(`/api/admin/sales/${s.id}`, { method: "PATCH", body: { action: "cancel" } });
                              if (!r.ok) return r.error;
                              refresh();
                            } })}>Anular</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} size="xl" title="Registrar venta manual" description="Para lo que vendes fuera de la web. Descuenta el stock y calcula tu utilidad real.">
        {open && stock && <NewSale products={stock.products} onDone={done} onCancel={() => setOpen(false)} />}
      </Modal>
      <Modal open={!!view} onClose={() => setView(null)} size="lg" title={view ? `Venta ${view.id}` : ""} description={view ? `${channelLabel[view.channel]} · ${day(view.soldAt)}` : ""}>
        {view && (
          <div className="grid gap-4 text-[16px]">
            <p><strong className="font-display font-medium">{view.customerCompany ?? view.customerName}</strong>{view.customerCompany && ` · ${view.customerName}`}{view.customerDoc && ` · RUC ${view.customerDoc}`}{view.customerPhone && ` · ${view.customerPhone}`}</p>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {view.items.map((i) => <li key={i.id} className="flex justify-between gap-4 px-4 py-2.5"><span>{i.qty} × {i.name}</span><span className="whitespace-nowrap">{soles(i.price * i.qty)}<span className="ml-2 text-[13px] italic text-faint">costo {i.unitCost == null ? "—" : soles(i.unitCost * i.qty)}</span></span></li>)}
            </ul>
            <p className="text-muted">Subtotal {soles(view.subtotal)}{view.discount > 0 && ` · Descuento ${soles(view.discount)}`}{view.shipping > 0 && ` · Envío ${soles(view.shipping)}`}{view.fee > 0 && ` · Otros gastos ${soles(view.fee)}`}</p>
            <p className="font-display text-[20px] font-medium">Total {soles(view.total)} · Utilidad {soles(view.profit)}</p>
            <ModalActions><Button variant="ghost" onClick={() => setView(null)}>Cerrar</Button></ModalActions>
          </div>
        )}
      </Modal>
      {dialog}
    </>
  );
}
