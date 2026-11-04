"use client";

import { useState } from "react";
import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { fmtDate, useAdminData } from "@/components/admin/useAdminData";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/useConfirm";
import { api } from "@/lib/api";
import { buyUnits, costPerBig, kindLabel, qty, soles, toNum, type SupplyKind, type Unit } from "@/lib/costing";

type Supply = {
  id: string;
  name: string;
  kind: SupplyKind;
  unit: Unit;
  stock: number;
  minStock: number;
  unitCost: number;
  supplier: string | null;
  notes: string | null;
  active: boolean;
  value: number;
  low: boolean;
};
type Movement = { id: number; type: string; qty: number; unitCost: number; totalCost: number; note: string | null; createdBy: string | null; createdAt: number };

const input = "h-11 w-full rounded-md border border-line-strong/60 bg-white px-3 text-[16px] outline-none focus:ring-2 focus:ring-leaf-500/50";
const label = "mb-1.5 block font-display text-[15px] font-medium";
const typeLabel: Record<string, string> = { purchase: "Compra", production: "Producción", adjustment: "Ajuste", initial: "Stock inicial" };

function Card({ title, value, sub, tone }: { title: string; value: string; sub?: string; tone?: "warn" }) {
  return (
    <div className={`rounded-2xl border p-5 ${tone === "warn" ? "border-peach-100 bg-peach-100/60" : "border-line bg-white"}`}>
      <p className="text-[15px] italic text-faint">{title}</p>
      <p className="mt-1 font-display text-[30px] font-medium leading-none tracking-[-0.03em]">{value}</p>
      {sub && <p className="mt-2 text-[14px] text-muted">{sub}</p>}
    </div>
  );
}

/** Crear o editar un insumo. */
function SupplyForm({ initial, onDone, onCancel }: { initial?: Supply; onDone: () => void; onCancel: () => void }) {
  const editing = Boolean(initial);
  const [d, setD] = useState({
    name: initial?.name ?? "",
    kind: (initial?.kind ?? "materia") as SupplyKind,
    unit: (initial?.unit ?? "g") as Unit,
    minStock: initial ? String(initial.minStock) : "0",
    supplier: initial?.supplier ?? "",
    notes: initial?.notes ?? "",
    active: initial?.active ?? true,
    initialStock: "",
    initialUnit: "g",
    initialTotal: "",
    unitCost: initial ? String(initial.unitCost) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body: Record<string, unknown> = { name: d.name, kind: d.kind, minStock: toNum(d.minStock), supplier: d.supplier || null, notes: d.notes || null, active: d.active };
    if (!editing) body.unit = d.unit;
    if (editing && d.unitCost !== String(initial?.unitCost)) body.unitCost = toNum(d.unitCost);
    if (!editing && toNum(d.initialStock) > 0) {
      const f = { g: 1, kg: 1000, ml: 1, l: 1000, un: 1, docena: 12, ciento: 100 }[d.initialUnit] ?? 1;
      body.initialStock = toNum(d.initialStock) * f;
      body.initialTotalCost = toNum(d.initialTotal);
    }
    const r = await api(editing ? `/api/admin/supplies/${initial!.id}` : "/api/admin/supplies", { method: editing ? "PUT" : "POST", body });
    setSaving(false);
    if (!r.ok) return setError(r.fields.name ?? r.error);
    onDone();
  }

  return (
    <form onSubmit={(e) => void save(e)} className="grid gap-5">
      <label className="block"><span className={label}>Nombre</span><input required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className={input} placeholder="Ej.: Aceite de oliva, Caja kraft, Miel" /></label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Tipo</span>
          <select value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value as SupplyKind })} className={input}>
            {(Object.keys(kindLabel) as SupplyKind[]).map((k) => <option key={k} value={k}>{kindLabel[k]}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={label}>Se mide en</span>
          <select value={d.unit} disabled={editing} onChange={(e) => setD({ ...d, unit: e.target.value as Unit, initialUnit: buyUnits[e.target.value as Unit][0].value })} className={`${input} disabled:opacity-60`}>
            <option value="g">Gramos / kilos</option>
            <option value="ml">Mililitros / litros</option>
            <option value="un">Unidades</option>
          </select>
          {editing && <span className="mt-1 block text-[13px] italic text-faint">La unidad no se cambia después de crear el insumo.</span>}
        </label>
      </div>
      {!editing && (
        <fieldset className="grid gap-4 rounded-xl border border-line bg-dew-100/50 p-4">
          <legend className="px-1 font-display text-[15px] font-medium">Stock inicial (opcional)</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block"><span className={label}>Cantidad</span><input inputMode="decimal" value={d.initialStock} onChange={(e) => setD({ ...d, initialStock: e.target.value })} className={input} placeholder="0" /></label>
            <label className="block">
              <span className={label}>Unidad</span>
              <select value={d.initialUnit} onChange={(e) => setD({ ...d, initialUnit: e.target.value })} className={input}>{buyUnits[d.unit].map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}</select>
            </label>
            <label className="block"><span className={label}>Costo total (S/)</span><input inputMode="decimal" value={d.initialTotal} onChange={(e) => setD({ ...d, initialTotal: e.target.value })} className={input} placeholder="0.00" /></label>
          </div>
          <p className="text-[14px] italic text-faint">Lo que pagaste por esa cantidad. Con eso se calcula cuánto cuesta cada gramo, mililitro o unidad.</p>
        </fieldset>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block"><span className={label}>Avisar cuando queden menos de ({d.unit})</span><input inputMode="decimal" value={d.minStock} onChange={(e) => setD({ ...d, minStock: e.target.value })} className={input} /></label>
        <label className="block"><span className={label}>Proveedor habitual</span><input value={d.supplier} onChange={(e) => setD({ ...d, supplier: e.target.value })} className={input} placeholder="Opcional" /></label>
      </div>
      {editing && (
        <label className="block">
          <span className={label}>Costo por {d.unit} (S/)</span>
          <input inputMode="decimal" value={d.unitCost} onChange={(e) => setD({ ...d, unitCost: e.target.value })} className={input} />
          <span className="mt-1 block text-[13px] italic text-faint">Se actualiza solo con cada compra. Cámbialo a mano solo para corregirlo.</span>
        </label>
      )}
      <label className="block"><span className={label}>Notas</span><textarea rows={2} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} className={`${input} h-auto py-2.5`} /></label>
      {editing && <label className="inline-flex cursor-pointer items-center gap-3 text-[16px]"><input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} className="size-5 accent-ink-800" />Insumo activo</label>}
      {error && <p role="alert" className="text-[16px] text-danger">{error}</p>}
      <ModalActions>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear insumo"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
      </ModalActions>
    </form>
  );
}

/** Registrar una compra: suma stock y recalcula el costo. */
function PurchaseForm({ s, onDone, onCancel }: { s: Supply; onDone: () => void; onCancel: () => void }) {
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState(buyUnits[s.unit][s.unit === "g" || s.unit === "ml" ? 1 : 0].value);
  const [total, setTotal] = useState("");
  const [supplier, setSupplier] = useState(s.supplier ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const f = { g: 1, kg: 1000, ml: 1, l: 1000, un: 1, docena: 12, ciento: 100 }[unit] ?? 1;
  const baseQty = toNum(amount) * f;
  const perBase = baseQty > 0 ? toNum(total) / baseQty : 0;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const r = await api(`/api/admin/supplies/${s.id}/purchase`, { body: { qty: toNum(amount), unit, totalCost: toNum(total), supplier: supplier || null } });
    setSaving(false);
    if (!r.ok) return setError(r.fields.qty ?? r.fields.totalCost ?? r.fields.unit ?? r.error);
    onDone();
  }

  return (
    <form onSubmit={(e) => void save(e)} className="grid gap-5">
      <p className="text-[16px] text-muted">Ahora tienes <b className="font-display font-medium text-ink-900">{qty(s.stock, s.unit)}</b> a {costPerBig(s.unitCost, s.unit)}.</p>
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block"><span className={label}>Cantidad comprada</span><input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={input} placeholder="Ej.: 2" data-autofocus /></label>
        <label className="block"><span className={label}>Unidad</span><select value={unit} onChange={(e) => setUnit(e.target.value)} className={input}>{buyUnits[s.unit].map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}</select></label>
        <label className="block"><span className={label}>Total pagado (S/)</span><input required inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} className={input} placeholder="0.00" /></label>
      </div>
      <label className="block"><span className={label}>Proveedor</span><input value={supplier} onChange={(e) => setSupplier(e.target.value)} className={input} placeholder="Opcional" /></label>
      {baseQty > 0 && toNum(total) > 0 && (
        <p className="rounded-lg bg-leaf-300/35 px-4 py-3 text-[16px]">Esta compra: <b className="font-display font-medium">{costPerBig(perBase, s.unit)}</b>. El costo promedio pasará a <b className="font-display font-medium">{costPerBig((Math.max(0, s.stock) * s.unitCost + toNum(total)) / (Math.max(0, s.stock) + baseQty), s.unit)}</b>.</p>
      )}
      {error && <p role="alert" className="text-[16px] text-danger">{error}</p>}
      <ModalActions>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Registrar compra"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
      </ModalActions>
    </form>
  );
}

/** Ajustar el stock: contar lo que hay o registrar una pérdida. */
function AdjustForm({ s, onDone, onCancel }: { s: Supply; onDone: () => void; onCancel: () => void }) {
  const [mode, setMode] = useState<"count" | "delta">("count");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState(buyUnits[s.unit][0].value);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const r = await api(`/api/admin/supplies/${s.id}/adjust`, { body: { mode, qty: toNum(amount), unit, reason } });
    setSaving(false);
    if (!r.ok) return setError(r.fields.qty ?? r.error);
    onDone();
  }

  return (
    <form onSubmit={(e) => void save(e)} className="grid gap-5">
      <p className="text-[16px] text-muted">Stock registrado: <b className="font-display font-medium text-ink-900">{qty(s.stock, s.unit)}</b></p>
      <div role="radiogroup" aria-label="Tipo de ajuste" className="grid gap-2 sm:grid-cols-2">
        {([["count", "Conté lo que hay", "Escribe la cantidad real y el sistema la corrige."], ["delta", "Registrar pérdida o ganancia", "Usa un número negativo para una merma (−50)."]] as const).map(([v, t, h]) => (
          <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${mode === v ? "border-ink-800 bg-dew-100 ring-1 ring-ink-800" : "border-line"}`}>
            <input type="radio" name="mode" checked={mode === v} onChange={() => setMode(v)} className="mt-1 size-4 accent-ink-800" />
            <span><span className="block font-display text-[15px] font-medium">{t}</span><span className="block text-[13px] italic text-faint">{h}</span></span>
          </label>
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block"><span className={label}>{mode === "count" ? "Cantidad real" : "Cantidad (+ suma, − resta)"}</span><input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={input} data-autofocus /></label>
        <label className="block"><span className={label}>Unidad</span><select value={unit} onChange={(e) => setUnit(e.target.value)} className={input}>{buyUnits[s.unit].map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}</select></label>
      </div>
      <label className="block"><span className={label}>Motivo</span><input value={reason} onChange={(e) => setReason(e.target.value)} className={input} placeholder="Ej.: se derramó, conteo del mes, vencido" /></label>
      {error && <p role="alert" className="text-[16px] text-danger">{error}</p>}
      <ModalActions>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar ajuste"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
      </ModalActions>
    </form>
  );
}

function History({ s }: { s: Supply }) {
  const { data, error } = useAdminData<{ movements: Movement[]; usedIn: { slug: string; name: string }[] }>(`/api/admin/supplies/${s.id}`);
  if (!data) return <Loading error={error} />;
  return (
    <div className="grid gap-4">
      {data.usedIn.length > 0 && <p className="text-[15px] text-muted">Se usa en: {data.usedIn.map((p) => p.name).join(", ")}.</p>}
      {data.movements.length === 0 ? <p className="italic text-faint">Sin movimientos todavía.</p> : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[480px] text-left text-[15px]">
            <thead className="border-b border-line text-[13px] italic text-faint"><tr><th className="px-3 py-2 font-normal">Fecha</th><th className="px-3 py-2 font-normal">Tipo</th><th className="px-3 py-2 text-right font-normal">Cantidad</th><th className="px-3 py-2 text-right font-normal">Costo</th><th className="px-3 py-2 font-normal">Detalle</th></tr></thead>
            <tbody className="divide-y divide-line">
              {data.movements.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 text-muted">{fmtDate(new Date(m.createdAt * 1000).toISOString())}</td>
                  <td className="px-3 py-2">{typeLabel[m.type] ?? m.type}</td>
                  <td className={`px-3 py-2 text-right font-display font-medium ${m.qty < 0 ? "text-danger" : "text-leaf-600"}`}>{m.qty > 0 ? "+" : ""}{qty(m.qty, s.unit)}</td>
                  <td className="px-3 py-2 text-right">{soles(Math.abs(m.totalCost))}</td>
                  <td className="px-3 py-2 text-muted">{m.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type Dialog = { kind: "new" } | { kind: "edit" | "buy" | "adjust" | "history"; s: Supply } | null;

export default function Supplies() {
  const { data, error, reload } = useAdminData<{ supplies: Supply[]; totals: { value: number; low: number } }>("/api/admin/supplies");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [filter, setFilter] = useState<"todos" | "bajo">("todos");
  const { confirm, dialog: confirmDialog } = useConfirm();

  const done = () => {
    setDialog(null);
    void reload();
  };

  const shown = data?.supplies.filter((s) => (filter === "bajo" ? s.low && s.active : true)) ?? [];
  const title = dialog?.kind === "new" ? "Nuevo insumo" : dialog?.kind === "edit" ? "Editar insumo" : dialog?.kind === "buy" ? "Registrar compra" : dialog?.kind === "adjust" ? "Ajustar stock" : "Historial";

  return (
    <>
      <PageTitle sub="Materias primas y empaques que usas para producir: cuánto tienes, cuánto te costó y cuándo comprar.">Insumos</PageTitle>
      {!data ? <Loading error={error} /> : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card title="Valor del inventario" value={soles(data.totals.value)} sub="Lo que tienes guardado, a su costo" />
            <Card title="Insumos activos" value={String(data.supplies.filter((s) => s.active).length)} />
            <Card title="Por reponer" value={String(data.totals.low)} sub={data.totals.low ? "Stock en el mínimo o por debajo" : "Todo con stock suficiente"} tone={data.totals.low ? "warn" : undefined} />
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Button variant="accent" onClick={() => setDialog({ kind: "new" })}>Nuevo insumo</Button>
            <div role="tablist" aria-label="Filtro" className="flex gap-2">
              {([["todos", "Todos"], ["bajo", `Por reponer (${data.totals.low})`]] as const).map(([v, t]) => (
                <button key={v} role="tab" aria-selected={filter === v} onClick={() => setFilter(v)} className={`rounded-full px-4 py-2 font-display text-[15px] font-medium ${filter === v ? "bg-ink-800 text-dew-50" : "hover:bg-ink-800/8"}`}>{t}</button>
              ))}
            </div>
          </div>

          {data.supplies.length === 0 ? (
            <p className="rounded-xl border border-line bg-white p-8 text-[18px] text-muted">Aún no tienes insumos. Crea el primero con “Nuevo insumo” (por ejemplo, el aceite, la miel o las cajas que usas).</p>
          ) : shown.length === 0 ? (
            <p className="py-8 text-[18px] italic text-faint">No hay insumos por reponer.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full min-w-[820px] text-left">
                <thead className="border-b border-line text-[14px] italic text-faint">
                  <tr><th className="px-5 py-3 font-normal">Insumo</th><th className="px-5 py-3 font-normal">Stock</th><th className="px-5 py-3 font-normal">Costo</th><th className="whitespace-nowrap px-5 py-3 text-right font-normal">Valor</th><th className="whitespace-nowrap px-5 py-3 text-right font-normal">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((s) => (
                    <tr key={s.id} className={s.active ? "" : "bg-dew-100/60 text-faint"}>
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => setDialog({ kind: "edit", s })} className="text-left font-display text-[16px] font-medium underline-offset-4 hover:underline">{s.name}</button>
                        <span className="block text-[13px] italic text-faint">{kindLabel[s.kind]}{s.supplier ? ` · ${s.supplier}` : ""}{s.active ? "" : " · inactivo"}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-display text-[16px] font-medium ${s.low ? "text-danger" : ""}`}>{qty(s.stock, s.unit)}</span>
                        {s.minStock > 0 && <span className="block text-[13px] italic text-faint">{s.low ? "Por reponer · " : ""}mínimo {qty(s.minStock, s.unit)}</span>}
                      </td>
                      <td className="px-5 py-4 text-[15px] text-muted">{costPerBig(s.unitCost, s.unit)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-display text-[16px] font-medium">{soles(s.value)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: "buy", s })}>Compra</Button>
                          <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "adjust", s })}>Ajustar</Button>
                          <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "history", s })}>Historial</Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger"
                            onClick={() => confirm({ title: "¿Eliminar este insumo?", message: `“${s.name}” se elimina con su historial. Si ya está en una receta o se usó en la producción, mejor desactívalo.`, confirmLabel: "Eliminar", danger: true, action: async () => {
                              const r = await api(`/api/admin/supplies/${s.id}`, { method: "DELETE" });
                              if (!r.ok) return r.error;
                              void reload();
                            } })}
                          >
                            Eliminar
                          </Button>
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

      <Modal open={dialog !== null} onClose={() => setDialog(null)} size={dialog?.kind === "history" ? "lg" : "md"} title={title} description={dialog && dialog.kind !== "new" ? dialog.s.name : undefined}>
        {dialog?.kind === "new" && <SupplyForm onDone={done} onCancel={() => setDialog(null)} />}
        {dialog?.kind === "edit" && <SupplyForm key={dialog.s.id} initial={dialog.s} onDone={done} onCancel={() => setDialog(null)} />}
        {dialog?.kind === "buy" && <PurchaseForm key={dialog.s.id} s={dialog.s} onDone={done} onCancel={() => setDialog(null)} />}
        {dialog?.kind === "adjust" && <AdjustForm key={dialog.s.id} s={dialog.s} onDone={done} onCancel={() => setDialog(null)} />}
        {dialog?.kind === "history" && <History key={dialog.s.id} s={dialog.s} />}
      </Modal>
      {confirmDialog}
    </>
  );
}
