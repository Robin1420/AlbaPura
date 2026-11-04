"use client";

import { useState } from "react";
import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { useAdminData } from "@/components/admin/useAdminData";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { soles } from "@/lib/costing";
import { stockTypeLabel } from "@/lib/sales";

type Product = { slug: string; name: string; stock: number; price: number; unitCost: number | null; value: number | null };
type Movement = { id: number; productSlug: string; productName: string; type: string; qty: number; ref: string | null; note: string | null; createdBy: string | null; createdAt: number };
type Data = { products: Product[]; movements: Movement[] };

const input = "h-11 w-full rounded-md border border-line-strong/60 bg-white px-3 text-[16px] outline-none focus:ring-2 focus:ring-leaf-500/50";
const lab = "mb-1.5 block font-display text-[15px] font-medium";
const when = (t: number) => new Date(t * 1000).toLocaleString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Adjust({ p, onDone, onCancel }: { p: Product; onDone: () => void; onCancel: () => void }) {
  const [stock, setStock] = useState(String(p.stock));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const n = Number(stock);
  const diff = Number.isInteger(n) ? n - p.stock : 0;

  async function save() {
    setBusy(true);
    setError("");
    const r = await api("/api/admin/stock", { body: { slug: p.slug, stock: n, note: note || null } });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    onDone();
  }

  return (
    <div className="grid gap-5">
      <p className="text-[16px] text-muted">Úsalo cuando el conteo físico no coincide. Queda anotado como aumento o reducción manual. Para sumar lo que fabricaste, usa Producción.</p>
      <label className="block"><span className={lab}>Unidades que hay ahora</span><input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} className={input} data-autofocus /></label>
      <label className="block"><span className={lab}>Motivo (opcional)</span><input value={note} onChange={(e) => setNote(e.target.value)} className={input} placeholder="Ej.: conteo del almacén, producto dañado" /></label>
      {diff !== 0 && <p className="font-display text-[17px] font-medium">{diff > 0 ? `Aumento manual de ${diff}` : `Reducción manual de ${-diff}`} unidad(es)</p>}
      {error && <p role="alert" className="text-[16px] text-danger">{error}</p>}
      <ModalActions>
        <Button type="button" disabled={busy || !Number.isInteger(n) || diff === 0} onClick={() => void save()}>{busy ? "Guardando…" : "Guardar ajuste"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>Cancelar</Button>
      </ModalActions>
    </div>
  );
}

export default function Inventario() {
  const [filter, setFilter] = useState("");
  const { data, error, reload } = useAdminData<Data>(`/api/admin/stock${filter ? `?product=${filter}` : ""}`);
  const [adjust, setAdjust] = useState<Product | null>(null);

  const total = data?.products.reduce((t, p) => t + (p.value ?? 0), 0) ?? 0;
  const units = data?.products.reduce((t, p) => t + Math.max(0, p.stock), 0) ?? 0;

  return (
    <>
      <PageTitle sub="Producto terminado: cuántas unidades tienes y de dónde salió o a dónde fue cada una.">Inventario</PageTitle>
      {!data ? <Loading error={error} /> : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-5"><p className="text-[15px] italic text-faint">Unidades en stock</p><p className="mt-1 font-display text-[30px] font-medium leading-none">{units}</p></div>
            <div className="rounded-2xl border border-line bg-white p-5"><p className="text-[15px] italic text-faint">Valor a costo de producción</p><p className="mt-1 font-display text-[30px] font-medium leading-none">{soles(total)}</p></div>
          </div>

          <div className="mb-8 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[640px] text-left">
              <thead className="border-b border-line text-[14px] italic text-faint"><tr><th className="px-5 py-3 font-normal">Producto</th><th className="whitespace-nowrap px-5 py-3 text-right font-normal">Stock</th><th className="whitespace-nowrap px-5 py-3 text-right font-normal">Costo c/u</th><th className="whitespace-nowrap px-5 py-3 text-right font-normal">Valor</th><th className="whitespace-nowrap px-5 py-3 text-right font-normal">Acciones</th></tr></thead>
              <tbody className="divide-y divide-line">
                {data.products.map((p) => (
                  <tr key={p.slug}>
                    <td className="px-5 py-3.5 font-display text-[16px] font-medium">{p.name}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right text-[16px]">{p.stock}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right text-[16px]">{p.unitCost == null ? <span className="italic text-faint">sin receta</span> : soles(p.unitCost)}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right text-[16px]">{p.value == null ? "—" : soles(p.value)}</td>
                    <td className="px-5 py-3.5"><div className="flex justify-end gap-1.5"><Button size="sm" variant="secondary" onClick={() => setAdjust(p)}>Ajustar</Button><Button size="sm" variant="ghost" onClick={() => setFilter(filter === p.slug ? "" : p.slug)}>{filter === p.slug ? "Ver todo" : "Historial"}</Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mb-3 font-display text-[22px] font-medium">Historial de movimientos{filter && ` · ${data.products.find((p) => p.slug === filter)?.name}`}</h2>
          {data.movements.length === 0 ? (
            <p className="rounded-xl border border-line bg-white p-8 text-[18px] text-muted">Aún no hay movimientos. Aparecerán cuando vendas, produzcas o ajustes el stock.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full min-w-[720px] text-left">
                <thead className="border-b border-line text-[14px] italic text-faint"><tr><th className="px-5 py-3 font-normal">Fecha</th><th className="px-5 py-3 font-normal">Producto</th><th className="px-5 py-3 font-normal">Movimiento</th><th className="whitespace-nowrap px-5 py-3 text-right font-normal">Unidades</th><th className="px-5 py-3 font-normal">Detalle</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {data.movements.map((m) => (
                    <tr key={m.id}>
                      <td className="whitespace-nowrap px-5 py-3 text-[15px] text-muted">{when(m.createdAt)}</td>
                      <td className="px-5 py-3 text-[16px]">{m.productName}</td>
                      <td className="px-5 py-3 text-[16px]">{stockTypeLabel[m.type] ?? m.type}</td>
                      <td className={`whitespace-nowrap px-5 py-3 text-right font-display text-[16px] font-medium ${m.qty < 0 ? "text-danger" : "text-leaf-600"}`}>{m.qty > 0 ? `+${m.qty}` : m.qty}</td>
                      <td className="px-5 py-3 text-[15px] text-muted">{m.note ?? m.ref ?? ""}{m.createdBy && <span className="block text-[13px] italic text-faint">{m.createdBy}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <Modal open={!!adjust} onClose={() => setAdjust(null)} size="md" title={adjust ? `Ajustar ${adjust.name}` : ""} description="Corrige el stock a mano.">
        {adjust && <Adjust p={adjust} onCancel={() => setAdjust(null)} onDone={() => { setAdjust(null); void reload(); }} />}
      </Modal>
    </>
  );
}
