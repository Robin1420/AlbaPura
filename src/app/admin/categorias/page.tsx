"use client";

import { useState } from "react";
import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useAdminData } from "@/components/admin/useAdminData";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/useConfirm";
import { api } from "@/lib/api";

type C = { slug: string; name: string; description: string | null; image: string | null; sortOrder: number; active: boolean; products: number };
type Draft = { slug?: string; name: string; description: string; image: string[]; sortOrder: string; active: boolean; products: number };

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
    const body = { name: d.name, description: d.description, image: d.image[0] ?? null, sortOrder: Number(d.sortOrder) || 0, active: d.active };
    const r = await api(editing ? `/api/admin/categories/${initial.slug}` : "/api/admin/categories", { method: editing ? "PUT" : "POST", body });
    setSaving(false);
    if (!r.ok) return setError(r.fields.name ?? r.error);
    onDone();
  }

  async function remove() {
    const r = await api(`/api/admin/categories/${initial.slug}`, { method: "DELETE" });
    if (!r.ok) return r.error;
    onDone();
  }

  return (
    <form onSubmit={(e) => void save(e)} className="grid gap-5">
      <label className="block"><span className="mb-1.5 block font-display text-[15px] font-medium">Nombre</span><input required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className={input} /></label>
      <label className="block"><span className="mb-1.5 block font-display text-[15px] font-medium">Descripción</span><textarea rows={3} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} className={`${input} h-auto py-2.5`} /></label>
      <div className="max-w-xs"><ImageUploader label="Foto de portada" max={1} value={d.image} onChange={(v) => setD({ ...d, image: v })} /></div>
      <div className="flex flex-wrap items-end gap-6">
        <label className="block"><span className="mb-1.5 block font-display text-[15px] font-medium">Orden</span><input inputMode="numeric" value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value.replace(/\D/g, "") })} className={`${input} w-24`} /></label>
        <label className="inline-flex cursor-pointer items-center gap-3 pb-2.5 text-[16px]"><input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} className="size-5 accent-ink-800" />Visible en la tienda</label>
      </div>
      {error && <p role="alert" className="text-[16px] text-danger">{error}</p>}
      <ModalActions>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear categoría"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
        {editing && (
          <Button
            type="button"
            variant="ghost"
            className="ml-auto text-danger"
            disabled={saving || d.products > 0}
            onClick={() => confirm({ title: "¿Eliminar esta categoría?", message: `“${d.name}” se elimina y no se puede recuperar.`, confirmLabel: "Eliminar", danger: true, action: remove })}
          >
            {d.products > 0 ? `Tiene ${d.products} producto${d.products === 1 ? "" : "s"}` : "Eliminar categoría"}
          </Button>
        )}
      </ModalActions>
      {dialog}
    </form>
  );
}

export default function Categories() {
  const { data, error, reload } = useAdminData<{ categories: C[] }>("/api/admin/categories");
  const [editing, setEditing] = useState<Draft | null>(null);

  const done = () => {
    setEditing(null);
    void reload();
  };

  return (
    <>
      <PageTitle sub="Organizan la tienda y el menú. Una categoría oculta esconde también sus productos.">Categorías</PageTitle>
      {!data ? <Loading error={error} /> : (
        <>
          <div className="mb-5"><Button variant="accent" onClick={() => setEditing({ name: "", description: "", image: [], sortOrder: String(data.categories.length), active: true, products: 0 })}>Nueva categoría</Button></div>
          <ul className="grid gap-3">
            {data.categories.map((c) => (
              <li key={c.slug} className={`flex items-center gap-4 rounded-xl border border-line p-4 ${c.active ? "bg-white" : "bg-dew-100/60"}`}>
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" className="size-14 rounded-md object-cover" />
                ) : <span className="size-14 rounded-md bg-dew-100" />}
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[17px] font-medium">{c.name}</p>
                  <p className="text-[14px] italic text-faint">{c.products} producto{c.products === 1 ? "" : "s"} · {c.active ? "Visible" : "Oculta"}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setEditing({ slug: c.slug, name: c.name, description: c.description ?? "", image: c.image ? [c.image] : [], sortOrder: String(c.sortOrder), active: c.active, products: c.products })}>Editar</Button>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.slug ? "Editar categoría" : "Nueva categoría"} description="Los cambios se ven en la tienda apenas los guardes.">
        {editing && <Editor key={editing.slug ?? "nueva"} initial={editing} onDone={done} onCancel={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
