"use client";

import { useState } from "react";
import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { useAdminData } from "@/components/admin/useAdminData";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/useConfirm";
import { api } from "@/lib/api";
import { badgeClass, badgeTones } from "@/lib/products";

type B = { slug: string; name: string; tone: string; sortOrder: number; active: boolean; products: number };
type Draft = { slug?: string; name: string; tone: string; sortOrder: string; active: boolean; products: number };

const toneName: Record<string, string> = { ink: "Verde oscuro", leaf: "Verde salvia", peach: "Durazno", sky: "Celeste" };
const input = "h-11 w-full rounded-md border border-line-strong/60 bg-white px-3 text-[16px] outline-none focus:ring-2 focus:ring-leaf-500/50";

function Editor({ initial, onDone, onCancel }: { initial: Draft; onDone: () => void; onCancel: () => void }) {
  const [d, setD] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { confirm, dialog } = useConfirm();
  const editing = Boolean(initial.slug);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const r = await api(editing ? `/api/admin/badges/${initial.slug}` : "/api/admin/badges", { method: editing ? "PUT" : "POST", body: { name: d.name, tone: d.tone, sortOrder: Number(d.sortOrder) || 0, active: d.active } });
    setSaving(false);
    if (!r.ok) return setError(r.fields.name ?? r.error);
    onDone();
  }

  async function remove() {
    const r = await api(`/api/admin/badges/${initial.slug}`, { method: "DELETE" });
    if (!r.ok) return r.error;
    onDone();
  }

  const n = d.products;
  return (
    <form onSubmit={(e) => void save(e)} className="grid gap-5">
      <label className="block">
        <span className="mb-1.5 block font-display text-[15px] font-medium">Nombre</span>
        <input required maxLength={30} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className={input} />
      </label>
      <fieldset>
        <legend className="mb-2 font-display text-[15px] font-medium">Color</legend>
        <div className="flex flex-wrap gap-2">
          {badgeTones.map((t) => (
            <label key={t} className={`cursor-pointer rounded-full p-1 ${d.tone === t ? "ring-2 ring-ink-800" : ""}`}>
              <input type="radio" name="tone" className="sr-only" checked={d.tone === t} onChange={() => setD({ ...d, tone: t })} />
              <span className={`block rounded-full px-3 py-1 font-display text-[13px] font-medium ${badgeClass(t)}`}>{toneName[t]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-end gap-6">
        <label className="block"><span className="mb-1.5 block font-display text-[15px] font-medium">Orden</span><input inputMode="numeric" value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value.replace(/\D/g, "") })} className={`${input} w-24`} /></label>
        <label className="inline-flex cursor-pointer items-center gap-3 pb-2.5 text-[16px]"><input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} className="size-5 accent-ink-800" />Visible en la tienda</label>
      </div>
      <p className="text-[15px] italic text-faint">Así se ve: <span className={`ml-2 inline-block rounded-full px-3 py-1 font-display text-[12px] font-medium not-italic ${badgeClass(d.tone)}`}>{d.name || "Etiqueta"}</span></p>
      {error && <p role="alert" className="text-[16px] text-danger">{error}</p>}
      <ModalActions>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear etiqueta"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
        {editing && (
          <Button
            type="button"
            variant="ghost"
            className="ml-auto text-danger"
            disabled={saving}
            onClick={() => confirm({ title: "¿Eliminar esta etiqueta?", message: n > 0 ? `“${d.name}” se elimina y ${n === 1 ? "el producto que la usa queda" : `los ${n} productos que la usan quedan`} sin etiqueta.` : `“${d.name}” se elimina y no se puede recuperar.`, confirmLabel: "Eliminar", danger: true, action: remove })}
          >
            Eliminar etiqueta
          </Button>
        )}
      </ModalActions>
      {dialog}
    </form>
  );
}

export default function Badges() {
  const { data, error, reload } = useAdminData<{ badges: B[] }>("/api/admin/badges");
  const [editing, setEditing] = useState<Draft | null>(null);
  const done = () => {
    setEditing(null);
    void reload();
  };

  return (
    <>
      <PageTitle sub="Mensajes cortos que aparecen sobre la foto del producto, como “Más vendido” o “Nuevo”. Se asignan desde el formulario de cada producto.">Etiquetas</PageTitle>
      {!data ? <Loading error={error} /> : (
        <>
          <div className="mb-5"><Button variant="accent" onClick={() => setEditing({ name: "", tone: "ink", sortOrder: String(data.badges.length), active: true, products: 0 })}>Nueva etiqueta</Button></div>
          {data.badges.length === 0 ? (
            <p className="rounded-xl border border-line bg-white p-8 text-[18px] text-muted">Aún no hay etiquetas. Crea la primera con “Nueva etiqueta”.</p>
          ) : (
            <ul className="grid max-w-2xl gap-3">
              {data.badges.map((b) => (
                <li key={b.slug} className={`flex items-center gap-4 rounded-xl border border-line p-4 ${b.active ? "bg-white" : "bg-dew-100/60"}`}>
                  <span className={`rounded-full px-3 py-1 font-display text-[13px] font-medium ${badgeClass(b.tone)}`}>{b.name}</span>
                  <p className="flex-1 text-[14px] italic text-faint">{b.products} producto{b.products === 1 ? "" : "s"} · {b.active ? "Visible" : "Oculta"}</p>
                  <Button size="sm" variant="secondary" onClick={() => setEditing({ slug: b.slug, name: b.name, tone: b.tone, sortOrder: String(b.sortOrder), active: b.active, products: b.products })}>Editar</Button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} size="md" title={editing?.slug ? "Editar etiqueta" : "Nueva etiqueta"} description="Los cambios se ven en la tienda apenas los guardes.">
        {editing && <Editor key={editing.slug ?? "nueva"} initial={editing} onDone={done} onCancel={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
