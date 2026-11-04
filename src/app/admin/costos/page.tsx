"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { useAdminData } from "@/components/admin/useAdminData";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { computeCost, pct, pricing, soles, toNum, type CostSettings, type Unit } from "@/lib/costing";

type Row = {
  slug: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  comingSoon: boolean;
  hasRecipe: boolean;
  status: "sin-receta" | "bajo" | "ok";
  yieldUnits?: number;
  targetMargin?: number;
  unitCost?: number;
  profit?: number;
  margin?: number;
  suggested?: number | null;
};
type Costs = { products: Row[]; settings: CostSettings; summary: { inventory: number; lowStock: number; avgMargin: number | null; belowTarget: number; withoutRecipe: number } };
type SupplyOpt = { id: string; name: string; unit: Unit; kind: string; unitCost: number; stock: number; active: boolean };
type Detail = {
  product: { slug: string; name: string; price: number; stock: number };
  recipe: { yieldUnits: number; laborHours: number; laborRate: number | null; overheadPct: number | null; wastePct: number; targetMargin: number; notes: string | null };
  lines: { supplyId: string; qty: number }[];
  settings: CostSettings;
};

const input = "h-11 w-full rounded-md border border-line-strong/60 bg-white px-3 text-[16px] outline-none focus:ring-2 focus:ring-leaf-500/50";
const label = "mb-1.5 block font-display text-[15px] font-medium";

function Card({ title, value, sub, tone }: { title: string; value: string; sub?: string; tone?: "warn" | "good" }) {
  return (
    <div className={`rounded-2xl border p-5 ${tone === "warn" ? "border-peach-100 bg-peach-100/60" : tone === "good" ? "border-leaf-300 bg-leaf-300/25" : "border-line bg-white"}`}>
      <p className="text-[15px] italic text-faint">{title}</p>
      <p className="mt-1 font-display text-[30px] font-medium leading-none tracking-[-0.03em]">{value}</p>
      {sub && <p className="mt-2 text-[14px] text-muted">{sub}</p>}
    </div>
  );
}

const statusChip = {
  ok: ["Margen bueno", "bg-leaf-300 text-ink-900"],
  bajo: ["Bajo la meta", "bg-peach-100 text-danger"],
  "sin-receta": ["Sin receta", "bg-dew-100 text-faint"],
} as const;

type Item = { key: number; supplyId: string; qty: string };

/** Receta, costos y precio de un producto, con el resultado calculado mientras escribes. */
function RecipeEditor({ slug, onDone, onCancel }: { slug: string; onDone: () => void; onCancel: () => void }) {
  const { data: detail, error } = useAdminData<Detail>(`/api/admin/costs/${slug}`);
  const { data: sup } = useAdminData<{ supplies: SupplyOpt[] }>("/api/admin/supplies");
  if (!detail || !sup) return <Loading error={error} />;
  return <Editor detail={detail} supplies={sup.supplies} onDone={onDone} onCancel={onCancel} />;
}

function Editor({ detail, supplies, onDone, onCancel }: { detail: Detail; supplies: SupplyOpt[]; onDone: () => void; onCancel: () => void }) {
  const r = detail.recipe;
  const [yieldUnits, setYield] = useState(String(r.yieldUnits));
  const [hours, setHours] = useState(String(r.laborHours));
  const [rate, setRate] = useState(r.laborRate == null ? "" : String(r.laborRate));
  const [overhead, setOverhead] = useState(r.overheadPct == null ? "" : String(r.overheadPct));
  const [waste, setWaste] = useState(String(r.wastePct));
  const [margin, setMargin] = useState(String(r.targetMargin));
  const [notes, setNotes] = useState(r.notes ?? "");
  const [items, setItems] = useState<Item[]>(detail.lines.map((l, i) => ({ key: i, supplyId: l.supplyId, qty: String(l.qty) })));
  const [testPrice, setTestPrice] = useState(String(detail.product.price));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const byId = useMemo(() => new Map(supplies.map((s) => [s.id, s])), [supplies]);
  const s = detail.settings;

  const result = useMemo(() => {
    const lines = items.flatMap((i) => {
      const sp = byId.get(i.supplyId);
      return sp && toNum(i.qty) > 0 ? [{ kind: sp.kind, qty: toNum(i.qty), unitCost: sp.unitCost }] : [];
    });
    const params = { yieldUnits: Math.max(1, Math.round(toNum(yieldUnits)) || 1), laborHours: toNum(hours), laborRate: rate.trim() === "" ? null : toNum(rate), overheadPct: overhead.trim() === "" ? null : toNum(overhead), wastePct: toNum(waste) };
    const cost = computeCost(params, lines, s);
    const price = Math.round(toNum(testPrice));
    return { cost, price, pr: pricing(cost.unitCost, price, toNum(margin), s), params };
  }, [items, byId, yieldUnits, hours, rate, overhead, waste, testPrice, margin, s]);

  const used = new Set(items.map((i) => i.supplyId));

  async function save(e: React.FormEvent, applyPrice?: number) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMsg("");
    const body = {
      yieldUnits: result.params.yieldUnits,
      laborHours: result.params.laborHours,
      laborRate: result.params.laborRate,
      overheadPct: result.params.overheadPct,
      wastePct: result.params.wastePct,
      targetMargin: toNum(margin),
      notes: notes || null,
      items: items.filter((i) => i.supplyId && toNum(i.qty) > 0).map((i) => ({ supplyId: i.supplyId, qty: toNum(i.qty) })),
    };
    const saved = await api(`/api/admin/costs/${detail.product.slug}`, { method: "PUT", body });
    if (!saved.ok) {
      setSaving(false);
      return setError(saved.fields.yieldUnits ?? saved.fields.qty ?? saved.error);
    }
    if (applyPrice) {
      const p = await api(`/api/admin/costs/${detail.product.slug}/price`, { body: { price: applyPrice } });
      if (!p.ok) {
        setSaving(false);
        return setError(p.error);
      }
    }
    setSaving(false);
    onDone();
  }

  const money = result.pr;
  const goodMargin = money.margin >= toNum(margin);

  return (
    <form onSubmit={(e) => void save(e)} className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-7">
        <fieldset className="grid gap-4">
          <legend className="mb-1 font-display text-[19px] font-medium">1. ¿Qué lleva un lote?</legend>
          <label className="block max-w-xs">
            <span className={label}>Unidades que salen por lote</span>
            <input required inputMode="numeric" value={yieldUnits} onChange={(e) => setYield(e.target.value.replace(/\D/g, ""))} className={input} />
            <span className="mt-1 block text-[13px] italic text-faint">Si con esta receta haces 12 jabones, escribe 12.</span>
          </label>

          {supplies.filter((x) => x.active).length === 0 ? (
            <p className="rounded-lg bg-peach-100 px-4 py-3 text-[16px]">Primero crea tus insumos en <Link href="/admin/insumos" className="font-medium underline underline-offset-4">Insumos</Link> para poder armar la receta.</p>
          ) : (
            <div className="grid gap-2">
              {items.length === 0 && <p className="text-[15px] italic text-faint">Agrega los insumos que lleva el lote.</p>}
              {items.map((it) => {
                const sp = byId.get(it.supplyId);
                const line = sp ? toNum(it.qty) * sp.unitCost : 0;
                return (
                  <div key={it.key} className="grid grid-cols-[minmax(0,1fr)_120px_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_130px_90px_auto]">
                    <select value={it.supplyId} onChange={(e) => setItems((l) => l.map((x) => (x.key === it.key ? { ...x, supplyId: e.target.value } : x)))} className={input} aria-label="Insumo">
                      <option value="">Elige un insumo…</option>
                      {supplies.filter((x) => x.active || x.id === it.supplyId).map((x) => <option key={x.id} value={x.id} disabled={used.has(x.id) && x.id !== it.supplyId}>{x.name}</option>)}
                    </select>
                    <div className="relative">
                      <input inputMode="decimal" value={it.qty} onChange={(e) => setItems((l) => l.map((x) => (x.key === it.key ? { ...x, qty: e.target.value } : x)))} className={`${input} pr-10`} aria-label="Cantidad" placeholder="0" />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[14px] italic text-faint">{sp?.unit ?? ""}</span>
                    </div>
                    <span className="hidden text-right font-display text-[15px] font-medium sm:block">{sp ? soles(line) : ""}</span>
                    <button type="button" onClick={() => setItems((l) => l.filter((x) => x.key !== it.key))} aria-label="Quitar insumo" className="grid size-10 place-items-center rounded-full text-faint hover:bg-ink-800/8 hover:text-danger">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                    </button>
                  </div>
                );
              })}
              <Button type="button" size="sm" variant="secondary" className="mt-1 w-fit" onClick={() => setItems((l) => [...l, { key: Date.now(), supplyId: "", qty: "" }])}>Agregar insumo</Button>
            </div>
          )}
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="mb-1 font-display text-[19px] font-medium">2. Trabajo y otros gastos</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className={label}>Horas de trabajo por lote</span><input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} className={input} /></label>
            <label className="block"><span className={label}>Pago por hora (S/)</span><input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className={input} placeholder={`Ajustes: ${s.laborRate}`} /></label>
            <label className="block"><span className={label}>Gastos indirectos (%)</span><input inputMode="decimal" value={overhead} onChange={(e) => setOverhead(e.target.value)} className={input} placeholder={`Ajustes: ${s.overheadPct}`} /></label>
            <label className="block"><span className={label}>Merma de materias primas (%)</span><input inputMode="decimal" value={waste} onChange={(e) => setWaste(e.target.value)} className={input} /></label>
          </div>
          <p className="text-[14px] italic text-faint">Los gastos indirectos son luz, agua, gas, alquiler… como porcentaje de lo demás. La merma es lo que se pierde al producir. Los empaques no llevan merma.</p>
        </fieldset>

        <label className="block"><span className={label}>Notas de la receta</span><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${input} h-auto py-2.5`} placeholder="Pasos, tiempos de curado, proveedor…" /></label>
      </div>

      <aside className="grid content-start gap-5 rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-0">
        <h3 className="font-display text-[19px] font-medium">3. Lo que te cuesta</h3>
        <dl className="grid gap-2 text-[16px]">
          {([["Materiales", result.cost.materials], ["Merma", result.cost.waste], ["Mano de obra", result.cost.labor], ["Gastos indirectos", result.cost.overhead]] as const).map(([k, v]) => (
            <div key={k} className="flex justify-between"><dt className="text-muted">{k}</dt><dd>{soles(v)}</dd></div>
          ))}
          <div className="flex justify-between border-t border-line pt-2 font-display font-medium"><dt>Total del lote</dt><dd>{soles(result.cost.batchTotal)}</dd></div>
        </dl>
        <div className="rounded-xl bg-ink-800 p-4 text-dew-50">
          <p className="text-[14px] italic text-dew-200/70">Costo por unidad</p>
          <p className="font-display text-[34px] font-medium leading-tight tracking-[-0.03em]">{soles(result.cost.unitCost)}</p>
        </div>

        <div className="grid gap-3 border-t border-line pt-4">
          <h3 className="font-display text-[19px] font-medium">4. A cuánto venderlo</h3>
          <label className="block">
            <span className={label}>Precio de venta (S/)</span>
            <input inputMode="numeric" value={testPrice} onChange={(e) => setTestPrice(e.target.value.replace(/\D/g, ""))} className={input} />
          </label>
          <label className="block">
            <span className={label}>Margen que quieres ganar (%)</span>
            <input inputMode="decimal" value={margin} onChange={(e) => setMargin(e.target.value)} className={input} />
          </label>
          <dl className="grid gap-1.5 text-[16px]">
            <div className="flex justify-between"><dt className="text-muted">Comisión de pago ({s.gatewayPct}%)</dt><dd>{soles(money.gateway)}</dd></div>
            {s.applyIgv && <div className="flex justify-between"><dt className="text-muted">Precio sin IGV</dt><dd>{soles(money.net)}</dd></div>}
            <div className="flex justify-between font-display font-medium"><dt>Ganancia por unidad</dt><dd className={money.profit < 0 ? "text-danger" : ""}>{soles(money.profit)}</dd></div>
            <div className="flex justify-between font-display font-medium"><dt>Margen</dt><dd className={goodMargin ? "text-leaf-600" : "text-danger"}>{pct(money.margin)}</dd></div>
          </dl>
          <div className={`rounded-xl p-4 ${money.suggested ? "bg-leaf-300/35" : "bg-dew-100"}`}>
            {money.suggested ? (
              <>
                <p className="text-[15px]">Para ganar <b className="font-display font-medium">{pct(toNum(margin))}</b>, véndelo a:</p>
                <p className="font-display text-[30px] font-medium leading-tight tracking-[-0.03em]">S/ {money.suggested}</p>
                <p className="text-[13px] italic text-faint">Precio mínimo en soles enteros, ya con la comisión de pago{s.applyIgv ? " y el IGV" : ""}. Sin contar el envío.</p>
                {money.suggested !== detail.product.price && (
                  <Button type="button" size="sm" className="mt-3" disabled={saving} onClick={(e) => void save(e as unknown as React.FormEvent, money.suggested ?? undefined)}>
                    Guardar y poner el precio en S/ {money.suggested}
                  </Button>
                )}
              </>
            ) : (
              <p className="text-[15px] text-muted">Agrega insumos y su cantidad para ver el precio sugerido.</p>
            )}
          </div>
          {result.price > 0 && result.price !== detail.product.price && (
            <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={(e) => void save(e as unknown as React.FormEvent, result.price)}>Guardar y poner el precio en S/ {result.price}</Button>
          )}
          <p className="text-[13px] italic text-faint">Precio actual en la tienda: S/ {detail.product.price}.</p>
        </div>
      </aside>

      <div className="lg:col-span-2">
        {msg && <p role="status" className="mb-3 rounded-md bg-leaf-300/50 px-4 py-3 text-[16px]">{msg}</p>}
        {error && <p role="alert" className="mb-3 text-[16px] text-danger">{error}</p>}
        <ModalActions>
          <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar receta"}</Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
        </ModalActions>
      </div>
    </form>
  );
}

function SettingsForm({ initial, onDone, onCancel }: { initial: CostSettings; onDone: () => void; onCancel: () => void }) {
  const [d, setD] = useState({ laborRate: String(initial.laborRate), overheadPct: String(initial.overheadPct), gatewayPct: String(initial.gatewayPct), gatewayFixed: String(initial.gatewayFixed), applyIgv: initial.applyIgv, igvRate: String(initial.igvRate) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const r = await api("/api/admin/cost-settings", { method: "PUT", body: { laborRate: toNum(d.laborRate), overheadPct: toNum(d.overheadPct), gatewayPct: toNum(d.gatewayPct), gatewayFixed: toNum(d.gatewayFixed), applyIgv: d.applyIgv, igvRate: toNum(d.igvRate) } });
    setSaving(false);
    if (!r.ok) return setError(r.error);
    onDone();
  }

  return (
    <form onSubmit={(e) => void save(e)} className="grid gap-5">
      <p className="text-[16px] text-muted">Estos valores se usan en todos los productos, salvo que una receta tenga los suyos.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block"><span className={label}>Pago por hora de trabajo (S/)</span><input inputMode="decimal" value={d.laborRate} onChange={(e) => setD({ ...d, laborRate: e.target.value })} className={input} /></label>
        <label className="block"><span className={label}>Gastos indirectos (%)</span><input inputMode="decimal" value={d.overheadPct} onChange={(e) => setD({ ...d, overheadPct: e.target.value })} className={input} /></label>
        <label className="block"><span className={label}>Comisión de la pasarela de pago (%)</span><input inputMode="decimal" value={d.gatewayPct} onChange={(e) => setD({ ...d, gatewayPct: e.target.value })} className={input} /></label>
        <label className="block"><span className={label}>Monto fijo por cobro (S/)</span><input inputMode="decimal" value={d.gatewayFixed} onChange={(e) => setD({ ...d, gatewayFixed: e.target.value })} className={input} /></label>
      </div>
      <p className="-mt-2 text-[14px] italic text-faint">Revisa la comisión real de tu cuenta de Culqi: aquí hay un valor de referencia.</p>
      <fieldset className="grid gap-3 rounded-xl border border-line bg-dew-100/50 p-4">
        <label className="inline-flex cursor-pointer items-center gap-3 text-[16px]"><input type="checkbox" checked={d.applyIgv} onChange={(e) => setD({ ...d, applyIgv: e.target.checked })} className="size-5 accent-ink-800" />Mis precios de venta incluyen IGV</label>
        {d.applyIgv && <label className="block max-w-[10rem]"><span className={label}>IGV (%)</span><input inputMode="decimal" value={d.igvRate} onChange={(e) => setD({ ...d, igvRate: e.target.value })} className={input} /></label>}
        <p className="text-[14px] italic text-faint">Si lo marcas, el margen se calcula sobre el precio sin IGV. Confirma con tu contador si corresponde.</p>
      </fieldset>
      {error && <p role="alert" className="text-[16px] text-danger">{error}</p>}
      <ModalActions>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar ajustes"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
      </ModalActions>
    </form>
  );
}

export default function CostsPage() {
  const { data, error, reload } = useAdminData<Costs>("/api/admin/costs");
  const [editing, setEditing] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);

  const done = () => {
    setEditing(null);
    setSettings(false);
    void reload();
  };

  return (
    <>
      <PageTitle sub="Cuánto te cuesta hacer cada producto, a cuánto venderlo y cuánto ganas por unidad.">Costos</PageTitle>
      {!data ? <Loading error={error} /> : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card title="Margen promedio" value={data.summary.avgMargin == null ? "—" : pct(data.summary.avgMargin)} sub="De los productos con receta" tone={data.summary.avgMargin != null && data.summary.belowTarget === 0 ? "good" : undefined} />
            <Card title="Bajo tu meta de margen" value={String(data.summary.belowTarget)} sub={data.summary.belowTarget ? "Conviene subir el precio o bajar el costo" : "Todos cumplen la meta"} tone={data.summary.belowTarget ? "warn" : undefined} />
            <Card title="Sin receta todavía" value={String(data.summary.withoutRecipe)} sub="No sabes cuánto ganas con ellos" />
            <Card title="Valor del inventario" value={soles(data.summary.inventory)} sub={data.summary.lowStock ? `${data.summary.lowStock} insumo(s) por reponer` : "Insumos guardados, a su costo"} />
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setSettings(true)}>Ajustes de costeo</Button>
            <Link href="/admin/insumos" className="font-display text-[15px] font-medium text-leaf-600 underline-offset-4 hover:underline">Ir a Insumos</Link>
            <Link href="/admin/produccion" className="font-display text-[15px] font-medium text-leaf-600 underline-offset-4 hover:underline">Ir a Producción</Link>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[860px] text-left">
              <thead className="border-b border-line text-[14px] italic text-faint">
                <tr>
                  <th className="px-5 py-3 font-normal">Producto</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right font-normal">Costo por unidad</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right font-normal">Precio</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right font-normal">Ganancia</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right font-normal">Margen</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right font-normal">Precio sugerido</th>
                  <th className="px-5 py-3 font-normal">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.products.map((p) => {
                  const [chip, cls] = statusChip[p.status];
                  return (
                    <tr key={p.slug} className="hover:bg-dew-100/60">
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => setEditing(p.slug)} className="text-left font-display text-[16px] font-medium underline-offset-4 hover:underline">{p.name}</button>
                        {p.comingSoon && <span className="block text-[13px] italic text-faint">Próximamente</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-display text-[16px] font-medium">{p.hasRecipe ? soles(p.unitCost) : "—"}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-[16px]">{p.comingSoon ? "—" : `S/ ${p.price}`}</td>
                      <td className={`px-5 py-4 text-right text-[16px] ${p.hasRecipe && (p.profit ?? 0) < 0 ? "text-danger" : ""}`}>{p.hasRecipe && !p.comingSoon ? soles(p.profit) : "—"}</td>
                      <td className={`px-5 py-4 text-right font-display text-[16px] font-medium ${p.status === "bajo" ? "text-danger" : ""}`}>{p.hasRecipe && !p.comingSoon ? pct(p.margin) : "—"}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-[16px]">{p.hasRecipe && p.suggested ? `S/ ${p.suggested}` : "—"}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 font-display text-[13px] font-medium ${cls}`}>{chip}</span></td>
                      <td className="whitespace-nowrap px-5 py-4 text-right"><Button size="sm" variant={p.hasRecipe ? "secondary" : "primary"} onClick={() => setEditing(p.slug)}>{p.hasRecipe ? "Ver receta" : "Crear receta"}</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-[14px] italic text-faint">El margen es lo que te queda de cada venta después del costo y de la comisión de pago, sin contar el envío. Los costos usan el precio promedio de tus compras de insumos.</p>
        </>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} size="xl" title="Receta y costos" description="Define qué lleva cada lote y mira cuánto te cuesta y a cuánto venderlo.">
        {editing && <RecipeEditor key={editing} slug={editing} onDone={done} onCancel={() => setEditing(null)} />}
      </Modal>
      <Modal open={settings} onClose={() => setSettings(false)} size="md" title="Ajustes de costeo">
        {settings && data && <SettingsForm initial={data.settings} onDone={done} onCancel={() => setSettings(false)} />}
      </Modal>
    </>
  );
}
