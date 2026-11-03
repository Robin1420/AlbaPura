"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/Button";
import { ModalActions } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/useConfirm";
import { api } from "@/lib/api";

type Pair = { a: string; b: string };
export type ProductDraft = {
  slug?: string;
  name: string;
  categorySlug: string;
  meta: string;
  latin: string;
  description: string;
  price: string;
  oldPrice: string;
  stock: string;
  badge: string;
  active: boolean;
  comingSoon: boolean;
  art: string;
  sortOrder: string;
  images: string[];
  notes: Pair[];
  provenance: Pair[];
};

export type ProductState = "available" | "soon" | "hidden";
export const stateOf = (d: { active: boolean; comingSoon: boolean }): ProductState => (!d.active ? "hidden" : d.comingSoon ? "soon" : "available");

/** Un producto tal como llega de /api/admin/products, listo para editar en el formulario. */
export type ProductRow = {
  slug: string; name: string; categorySlug: string; meta: string; latin: string | null; description: string; price: number; oldPrice: number | null; stock: number;
  badge: string | null; active: boolean; comingSoon: boolean; art: string | null; sortOrder: number; images: string[];
  notes: { title: string; text: string }[]; provenance: { label: string; value: string }[];
};

export const draftOf = (p: ProductRow): ProductDraft => ({
  slug: p.slug,
  name: p.name,
  categorySlug: p.categorySlug,
  meta: p.meta,
  latin: p.latin ?? "",
  description: p.description,
  price: String(p.price),
  oldPrice: p.oldPrice == null ? "" : String(p.oldPrice),
  stock: String(p.stock),
  badge: p.badge ?? "",
  active: p.active,
  comingSoon: p.comingSoon,
  art: p.art ?? "",
  sortOrder: String(p.sortOrder),
  images: p.images,
  notes: p.notes.map((n) => ({ a: n.title, b: n.text })),
  provenance: p.provenance.map((n) => ({ a: n.label, b: n.value })),
});

export const emptyDraft = (categorySlug = ""): ProductDraft => ({
  name: "", categorySlug, meta: "", latin: "", description: "", price: "", oldPrice: "", stock: "0", badge: "", active: true, comingSoon: false, art: "", sortOrder: "0", images: [], notes: [], provenance: [],
});

const input = "h-11 w-full rounded-md border border-line-strong/60 bg-white px-3 text-[16px] outline-none focus:ring-2 focus:ring-leaf-500/50";

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-[15px] font-medium">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-[13px] italic text-faint">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-[14px] text-danger">{error}</span>}
    </label>
  );
}

function Pairs({ title, aLabel, bLabel, value, onChange }: { title: string; aLabel: string; bLabel: string; value: Pair[]; onChange: (v: Pair[]) => void }) {
  const set = (i: number, k: "a" | "b", v: string) => onChange(value.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  return (
    <fieldset>
      <legend className="mb-2 font-display text-[15px] font-medium">{title}</legend>
      <div className="grid gap-2">
        {value.map((p, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <input aria-label={`${aLabel} ${i + 1}`} placeholder={aLabel} value={p.a} maxLength={60} onChange={(e) => set(i, "a", e.target.value)} className={input} />
            <input aria-label={`${bLabel} ${i + 1}`} placeholder={bLabel} value={p.b} maxLength={120} onChange={(e) => set(i, "b", e.target.value)} className={input} />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="px-2 text-[14px] text-danger">Quitar</button>
          </div>
        ))}
      </div>
      {value.length < 8 && <button type="button" onClick={() => onChange([...value, { a: "", b: "" }])} className="mt-2 text-[15px] underline underline-offset-4">Agregar</button>}
    </fieldset>
  );
}

export function ProductForm({ initial, categories, badges, onSaved, onCancel }: { initial: ProductDraft; categories: { slug: string; name: string }[]; badges: { slug: string; name: string; active: boolean }[]; onSaved: () => void; onCancel: () => void }) {
  const { confirm, dialog } = useConfirm();
  const [d, setD] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const setState = (st: ProductState) => setD((p) => ({ ...p, active: st !== "hidden", comingSoon: st === "soon" }));
  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const editing = Boolean(initial.slug);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setFields({});
    const num = (s: string) => (s.trim() === "" ? null : Number(s));
    const body = {
      name: d.name,
      categorySlug: d.categorySlug,
      meta: d.meta,
      latin: d.latin || null,
      description: d.description,
      price: d.comingSoon ? 0 : Number(d.price),
      oldPrice: num(d.oldPrice),
      stock: Number(d.stock),
      badge: d.badge || null,
      active: d.active,
      comingSoon: d.comingSoon,
      art: d.art || null,
      sortOrder: Number(d.sortOrder) || 0,
      images: d.images,
      notes: d.notes.filter((p) => p.a.trim() && p.b.trim()).map((p) => ({ title: p.a, text: p.b })),
      provenance: d.provenance.filter((p) => p.a.trim() && p.b.trim()).map((p) => ({ label: p.a, value: p.b })),
    };
    const r = await api(editing ? `/api/admin/products/${initial.slug}` : "/api/admin/products", { method: editing ? "PUT" : "POST", body });
    setSaving(false);
    if (!r.ok) {
      setError(r.error);
      setFields(r.fields);
      return;
    }
    onSaved();
  }

  async function remove() {
    const r = await api(`/api/admin/products/${initial.slug}`, { method: "DELETE" });
    if (!r.ok) return r.error;
    onSaved();
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-6">
      <div className="grid gap-5 rounded-xl border border-line bg-white p-6 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Nombre" error={fields.name}><input required value={d.name} onChange={(e) => set("name", e.target.value)} className={input} /></Field></div>
        <Field label="Categoría" error={fields.categorySlug}>
          <select required value={d.categorySlug} onChange={(e) => set("categorySlug", e.target.value)} className={input}>
            <option value="" disabled>Elige una categoría</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Formato y origen" error={fields.meta} hint="Ej.: 100 g, hecho en Lima"><input required value={d.meta} onChange={(e) => set("meta", e.target.value)} className={input} /></Field>
        <Field label="Nombre botánico (opcional)" error={fields.latin}><input value={d.latin} onChange={(e) => set("latin", e.target.value)} className={input} /></Field>
        <Field label="Etiqueta (opcional)" error={fields.badge} hint="Se crean y editan en la sección Etiquetas.">
          <select value={d.badge} onChange={(e) => set("badge", e.target.value)} className={input}>
            <option value="">Sin etiqueta</option>
            {badges.filter((b) => b.active || b.slug === d.badge).map((b) => <option key={b.slug} value={b.slug}>{b.name}{b.active ? "" : " (oculta)"}</option>)}
          </select>
        </Field>
        <div className="sm:col-span-2"><Field label="Descripción" error={fields.description}><textarea rows={5} value={d.description} onChange={(e) => set("description", e.target.value)} className={`${input} h-auto py-2.5`} /></Field></div>
      </div>

      <div className="grid gap-5 rounded-xl border border-line bg-white p-6 sm:grid-cols-4">
        <Field label="Precio (S/)" error={fields.price} hint={d.comingSoon ? "No se muestra mientras sea Próximamente" : undefined}><input required={!d.comingSoon} disabled={d.comingSoon} inputMode="numeric" value={d.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} className={input} /></Field>
        <Field label="Precio anterior" error={fields.oldPrice} hint="Si lo llenas, se muestra tachado"><input inputMode="numeric" value={d.oldPrice} onChange={(e) => set("oldPrice", e.target.value.replace(/\D/g, ""))} className={input} /></Field>
        <Field label="Stock" error={fields.stock}><input required inputMode="numeric" value={d.stock} onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))} className={input} /></Field>
        <Field label="Orden" error={fields.sortOrder} hint="Menor aparece primero"><input inputMode="numeric" value={d.sortOrder} onChange={(e) => set("sortOrder", e.target.value.replace(/\D/g, ""))} className={input} /></Field>
      </div>

      <div className="grid gap-6 rounded-xl border border-line bg-white p-6">
        <ImageUploader value={d.images} onChange={(v) => set("images", v)} />
        {fields.images && <p role="alert" className="text-[14px] text-danger">{fields.images}</p>}
        <Field label="Ilustración si no hay foto" hint="Se usa solo cuando el producto no tiene fotos.">
          <select value={d.art} onChange={(e) => set("art", e.target.value)} className={input}>
            <option value="">Ninguna</option><option value="oil">Aceite</option><option value="honey">Miel</option><option value="soap">Jabón</option><option value="tea">Infusión</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-6 rounded-xl border border-line bg-white p-6">
        <Pairs title="Notas de cata o uso" aLabel="Título" bLabel="Texto" value={d.notes} onChange={(v) => set("notes", v)} />
        <Pairs title="Origen y elaboración" aLabel="Dato" bLabel="Valor" value={d.provenance} onChange={(v) => set("provenance", v)} />
      </div>

      <fieldset className="rounded-xl border border-line bg-white p-4">
        <legend className="px-1 font-display text-[15px] font-medium">Estado del producto</legend>
        <div className="mt-1 grid gap-2">
          {([
            ["available", "Disponible", "Se ve en la tienda con su precio y se puede comprar."],
            ["soon", "Próximamente", "Se ve en la tienda con su foto, nombre y descripción, pero sin precio y sin compra."],
            ["hidden", "Oculto", "No aparece en la tienda."],
          ] as const).map(([id, label, hint]) => {
            const on = stateOf(d) === id;
            return (
              <label key={id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${on ? "border-ink-800 bg-dew-100" : "border-line hover:border-line-strong"}`}>
                <input type="radio" name="estado" checked={on} onChange={() => setState(id)} className="mt-1 size-5 accent-ink-800" />
                <span>
                  <span className="block font-display font-medium">{label}</span>
                  <span className="block text-[15px] italic text-faint">{hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {error && <p role="alert" className="text-[16px] text-danger">{error}</p>}
      <ModalActions>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear producto"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
        {editing && (
          <Button
            type="button"
            variant="ghost"
            className="ml-auto text-danger"
            disabled={saving}
            onClick={() => confirm({ title: "¿Eliminar este producto?", message: `“${d.name}” se elimina de la tienda y no se puede recuperar. Si solo quieres sacarlo de la tienda por un tiempo, cámbialo a Oculto.`, confirmLabel: "Eliminar", danger: true, action: remove })}
          >
            Eliminar producto
          </Button>
        )}
      </ModalActions>
      {dialog}
    </form>
  );
}
