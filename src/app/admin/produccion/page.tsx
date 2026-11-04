"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { useAdminData } from "@/components/admin/useAdminData";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/useConfirm";
import { api } from "@/lib/api";
import { pct, qty, soles, toNum, type Unit } from "@/lib/costing";

type Batch = { id: string; productSlug: string; productName: string; qty: number; status: "planned" | "done" | "cancelled"; notes: string | null; expiresAt: number | null; costTotal: number | null; costUnit: number | null; createdAt: number; finishedAt: number | null };
type Batches = { batches: Batch[]; summary: { monthUnits: number; monthCost: number; monthBatches: number; planned: number } };
type Costs = { products: { slug: string; name: string; hasRecipe: boolean; stock: number; comingSoon: boolean }[] };
type Need = { supplyId: string; name: string; unit: Unit; need: number; stock: number; short: number; unitCost: number; cost: number };
type Quote = {
  product: { slug: string; name: string; price: number; stock: number };
  qty: number;
  needs: Need[];
  shortages: Need[];
  cost: { materials: number; labor: number; overhead: number; total: number; unit: number };
  sale: { revenue: number; profit: number; margin: number; suggestedPrice: number | null; targetMargin: number };
};

const input = "h-11 w-full rounded-md border border-line-strong/60 bg-white px-3 text-[16px] outline-none focus:ring-2 focus:ring-leaf-500/50";
const label = "mb-1.5 block font-display text-[15px] font-medium";
const statusChip = { planned: ["Planificado", "bg-peach-100"], done: ["Terminado", "bg-leaf-300"], cancelled: ["Cancelado", "bg-dew-100 text-faint"] } as const;
const day = (t: number) => new Date(t * 1000).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });

function Card({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-[15px] italic text-faint">{title}</p>
      <p className="mt-1 font-display text-[30px] font-medium leading-none tracking-[-0.03em]">{value}</p>
      {sub && <p className="mt-2 text-[14px] text-muted">{sub}</p>}
    </div>
  );
}

/** Cotiza y registra una producción. */
function NewBatch({ products, onDone, onCancel }: { products: Costs["products"]; onDone: () => void; onCancel: () => void }) {
  const withRecipe = products.filter((p) => p.hasRecipe);
  const [slug, setSlug] = useState(withRecipe[0]?.slug ?? "");
  const [units, setUnits] = useState("12");
  const [expires, setExpires] = useState("");
  const [notes, setNotes] = useState("");
  const [force, setForce] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [busy, setBusy] = useState<"" | "plan" | "now">("");
  const [error, setError] = useState("");
  const n = Math.round(toNum(units));

  // La cotización se recalcula sola un momento después de escribir
  useEffect(() => {
    if (!slug || n < 1) return;
    let alive = true;
    const t = setTimeout(() => {
      void api<Quote>("/api/admin/production/quote", { body: { productSlug: slug, qty: n } }).then((r) => {
        if (!alive) return;
        if (r.ok) {
          setQuote(r.data);
          setQuoteError("");
        } else {
          setQuote(null);
          setQuoteError(r.error);
        }
      });
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [slug, n]);

  async function submit(produceNow: boolean) {
    setBusy(produceNow ? "now" : "plan");
    setError("");
    const body = { productSlug: slug, qty: n, notes: notes || null, expiresAt: expires ? Math.floor(new Date(`${expires}T12:00:00`).getTime() / 1000) : null, produceNow, force };
    const r = await api("/api/admin/production", { body });
    setBusy("");
    if (!r.ok) return setError(r.error);
    onDone();
  }

  if (withRecipe.length === 0) {
    return (
      <div className="grid gap-4">
        <p className="text-[17px] text-muted">Para producir, primero crea la receta de al menos un producto: qué insumos lleva y cuántas unidades salen por lote.</p>
        <Link href="/admin/costos" className="w-fit font-display text-[16px] font-medium text-leaf-600 underline underline-offset-4">Ir a Costos y crear una receta</Link>
      </div>
    );
  }

  const short = quote?.shortages ?? [];
  const blocked = short.length > 0 && !force;

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <label className="block">
          <span className={label}>Producto</span>
          <select value={slug} onChange={(e) => setSlug(e.target.value)} className={input}>{withRecipe.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}</select>
        </label>
        <label className="block">
          <span className={label}>Unidades a producir</span>
          <input inputMode="numeric" value={units} onChange={(e) => setUnits(e.target.value.replace(/\D/g, ""))} className={input} data-autofocus />
        </label>
      </div>

      {quoteError && <p role="alert" className="rounded-lg bg-peach-100 px-4 py-3 text-[16px] text-danger">{quoteError}</p>}

      {quote && (
        <>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[560px] text-left text-[15px]">
              <thead className="border-b border-line text-[13px] italic text-faint"><tr><th className="px-4 py-2 font-normal">Insumo</th><th className="px-4 py-2 text-right font-normal">Necesitas</th><th className="px-4 py-2 text-right font-normal">Tienes</th><th className="px-4 py-2 text-right font-normal">Falta comprar</th><th className="px-4 py-2 text-right font-normal">Costo</th></tr></thead>
              <tbody className="divide-y divide-line">
                {quote.needs.map((x) => (
                  <tr key={x.supplyId} className={x.short > 0.0001 ? "bg-peach-100/50" : ""}>
                    <td className="px-4 py-2.5 font-display font-medium">{x.name}</td>
                    <td className="px-4 py-2.5 text-right">{qty(x.need, x.unit)}</td>
                    <td className="px-4 py-2.5 text-right text-muted">{qty(x.stock, x.unit)}</td>
                    <td className={`px-4 py-2.5 text-right font-display font-medium ${x.short > 0.0001 ? "text-danger" : "text-faint"}`}>{x.short > 0.0001 ? qty(x.short, x.unit) : "—"}</td>
                    <td className="px-4 py-2.5 text-right">{soles(x.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-ink-800 p-4 text-dew-50">
              <p className="text-[14px] italic text-dew-200/70">Inversión total</p>
              <p className="font-display text-[28px] font-medium leading-tight tracking-[-0.03em]">{soles(quote.cost.total)}</p>
              <p className="text-[13px] text-dew-200/70">{soles(quote.cost.unit)} por unidad</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[14px] italic text-faint">Si lo vendes todo a S/ {quote.product.price}</p>
              <p className="font-display text-[28px] font-medium leading-tight tracking-[-0.03em]">{soles(quote.sale.revenue)}</p>
              <p className="text-[13px] text-muted">Ganancia {soles(quote.sale.profit)} · margen {pct(quote.sale.margin)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[14px] italic text-faint">Desglose del costo</p>
              <p className="text-[14px] text-muted">Materiales {soles(quote.cost.materials)}</p>
              <p className="text-[14px] text-muted">Mano de obra {soles(quote.cost.labor)}</p>
              <p className="text-[14px] text-muted">Indirectos {soles(quote.cost.overhead)}</p>
            </div>
          </div>

          {short.length > 0 && (
            <div className="rounded-xl border border-peach-100 bg-peach-100/60 p-4 text-[16px]">
              <p className="font-display font-medium text-danger">Te faltan insumos para producir esto.</p>
              <p className="mt-1 text-muted">Registra la compra en <Link href="/admin/insumos" className="font-medium underline underline-offset-4">Insumos</Link>, o guarda el lote como planificado y termínalo cuando los tengas.</p>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-3 text-[15px]"><input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="size-5 accent-ink-800" />Producir igual (el stock de esos insumos quedará en negativo)</label>
            </div>
          )}
        </>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block"><span className={label}>Vence el (opcional)</span><input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={input} /></label>
        <label className="block"><span className={label}>Notas del lote</span><input value={notes} onChange={(e) => setNotes(e.target.value)} className={input} placeholder="Ej.: jabón curado 4 semanas" /></label>
      </div>
      {error && <p role="alert" className="text-[16px] text-danger">{error}</p>}
      <ModalActions>
        <Button type="button" disabled={!quote || n < 1 || blocked || busy !== ""} onClick={() => void submit(true)}>{busy === "now" ? "Produciendo…" : "Producir ahora"}</Button>
        <Button type="button" variant="secondary" disabled={!quote || n < 1 || busy !== ""} onClick={() => void submit(false)}>{busy === "plan" ? "Guardando…" : "Guardar como planificado"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy !== ""}>Cancelar</Button>
      </ModalActions>
    </div>
  );
}

export default function Production() {
  const { data, error, reload } = useAdminData<Batches>("/api/admin/production");
  const { data: costs } = useAdminData<Costs>("/api/admin/costs");
  const [open, setOpen] = useState(false);
  const { confirm, dialog } = useConfirm();

  const done = () => {
    setOpen(false);
    void reload();
  };

  return (
    <>
      <PageTitle sub="Cotiza cuánto necesitas y cuánto cuesta, y registra cada lote: descuenta los insumos y suma el stock del producto.">Producción</PageTitle>
      {!data ? <Loading error={error} /> : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card title="Producido en 30 días" value={`${data.summary.monthUnits} un`} sub={`${data.summary.monthBatches} lote(s) terminado(s)`} />
            <Card title="Invertido en 30 días" value={soles(data.summary.monthCost)} sub={data.summary.monthUnits ? `${soles(data.summary.monthCost / data.summary.monthUnits)} por unidad` : undefined} />
            <Card title="Lotes planificados" value={String(data.summary.planned)} sub={data.summary.planned ? "Pendientes de producir" : "Nada pendiente"} />
          </div>

          <div className="mb-5"><Button variant="accent" onClick={() => setOpen(true)}>Nueva producción</Button></div>

          {data.batches.length === 0 ? (
            <p className="rounded-xl border border-line bg-white p-8 text-[18px] text-muted">Aún no hay lotes. Pulsa “Nueva producción” para cotizar y registrar el primero (necesitas tener la receta del producto en Costos).</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full min-w-[860px] text-left">
                <thead className="border-b border-line text-[14px] italic text-faint">
                  <tr><th className="px-5 py-3 font-normal">Lote</th><th className="px-5 py-3 font-normal">Producto</th><th className="whitespace-nowrap px-5 py-3 text-right font-normal">Unidades</th><th className="px-5 py-3 font-normal">Estado</th><th className="whitespace-nowrap px-5 py-3 text-right font-normal">Costo</th><th className="px-5 py-3 font-normal">Fechas</th><th className="whitespace-nowrap px-5 py-3 text-right font-normal">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.batches.map((b) => {
                    const [chip, cls] = statusChip[b.status];
                    return (
                      <tr key={b.id}>
                        <td className="px-5 py-4 font-display text-[16px] font-medium">{b.id}{b.notes && <span className="block text-[13px] font-normal italic text-faint">{b.notes}</span>}</td>
                        <td className="px-5 py-4 text-[16px]">{b.productName}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-display text-[16px] font-medium">{b.qty}</td>
                        <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 font-display text-[13px] font-medium ${cls}`}>{chip}</span></td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-[16px]">{b.costTotal != null ? <>{soles(b.costTotal)}<span className="block text-[13px] italic text-faint">{soles(b.costUnit)} c/u</span></> : "—"}</td>
                        <td className="px-5 py-4 text-[14px] text-muted">
                          {b.status === "done" && b.finishedAt ? `Producido ${day(b.finishedAt)}` : `Creado ${day(b.createdAt)}`}
                          {b.expiresAt && <span className="block italic text-faint">Vence {day(b.expiresAt)}</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {b.status === "planned" && (
                              <Button size="sm" onClick={() => confirm({ title: `¿Producir ${b.id}?`, message: `Se descontarán de Insumos los materiales de ${b.qty} unidades de ${b.productName} y se sumarán al stock del producto.`, confirmLabel: "Producir", action: async () => {
                                const r = await api(`/api/admin/production/${b.id}`, { method: "PATCH", body: { action: "complete" } });
                                if (!r.ok) return r.error;
                                void reload();
                              } })}>Producir</Button>
                            )}
                            {b.status === "planned" && (
                              <Button size="sm" variant="ghost" onClick={() => confirm({ title: `¿Cancelar ${b.id}?`, message: "El lote queda cancelado y no se descuenta nada.", confirmLabel: "Cancelar lote", action: async () => {
                                const r = await api(`/api/admin/production/${b.id}`, { method: "PATCH", body: { action: "cancel" } });
                                if (!r.ok) return r.error;
                                void reload();
                              } })}>Cancelar</Button>
                            )}
                            {b.status !== "done" && (
                              <Button size="sm" variant="ghost" className="text-danger" onClick={() => confirm({ title: `¿Eliminar ${b.id}?`, message: "Se borra el lote. Esto no afecta el stock.", confirmLabel: "Eliminar", danger: true, action: async () => {
                                const r = await api(`/api/admin/production/${b.id}`, { method: "DELETE" });
                                if (!r.ok) return r.error;
                                void reload();
                              } })}>Eliminar</Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} size="xl" title="Nueva producción" description="Elige el producto y cuántas unidades: ves qué necesitas, cuánto cuesta y cuánto ganarías.">
        {open && costs && <NewBatch products={costs.products} onDone={done} onCancel={() => setOpen(false)} />}
      </Modal>
      {dialog}
    </>
  );
}
