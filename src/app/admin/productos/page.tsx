"use client";

import { useState } from "react";
import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { useAdminData } from "@/components/admin/useAdminData";
import { ProductForm, draftOf, emptyDraft, type ProductDraft, type ProductRow } from "@/components/admin/ProductForm";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";

type P = ProductRow & { categoryName: string };

function Row({ p, onSaved, onEdit }: { p: P; onSaved: () => void; onEdit: (p: P) => void }) {
  const [price, setPrice] = useState(String(p.price));
  const [stock, setStock] = useState(String(p.stock));
  const [st, setSt] = useState<"available" | "soon" | "hidden">(!p.active ? "hidden" : p.comingSoon ? "soon" : "available");
  const active = st !== "hidden";
  const soon = st === "soon";
  const [state, setState] = useState<"" | "saving" | "saved" | string>("");

  const dirty = Number(price) !== p.price || Number(stock) !== p.stock || active !== p.active || soon !== Boolean(p.comingSoon);
  const valid = /^\d+$/.test(price) && /^\d+$/.test(stock);

  async function save() {
    setState("saving");
    const r = await api(`/api/admin/products/${p.slug}`, { method: "PATCH", body: { price: Number(price), stock: Number(stock), active, comingSoon: soon } });
    if (!r.ok) {
      setState(r.error);
      return;
    }
    setState("saved");
    onSaved();
  }

  return (
    <li className={`grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] md:items-center md:gap-5 md:px-5 ${active ? "" : "bg-dew-100/60"}`}>
      <button type="button" onClick={() => onEdit(p)} className="flex min-w-0 items-center gap-3 text-left">
        {p.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.images[0]} alt="" className="size-12 shrink-0 rounded-md object-cover" />
        ) : (
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-dew-100 text-[12px] italic text-faint">Sin foto</span>
        )}
        <span className="min-w-0"><span className="font-display text-[16px] font-medium underline-offset-4 hover:underline">{p.name}</span>{p.comingSoon && <span className="ml-2 rounded-full bg-dew-100 px-2.5 py-0.5 align-middle font-display text-[12px] font-medium text-ink-800 ring-1 ring-ink-800/15">Próximamente</span>}<span className="block truncate text-[13px] italic text-faint">{p.categoryName} · {p.meta}</span></span>
      </button>
      <div className="grid grid-cols-2 gap-3 md:contents">
        <label className="grid gap-1 text-[13px] italic text-faint md:block">
          <span className="md:sr-only">Precio (S/)</span>
          <input id={`pr-${p.slug}`} aria-label={`Precio de ${p.name}`} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} className="h-11 w-full rounded-md border border-line-strong/60 bg-white px-3 text-right text-[16px] not-italic text-ink-900 outline-none focus:ring-2 focus:ring-leaf-500/50 md:h-10 md:w-28" />
        </label>
        <label className="grid gap-1 text-[13px] italic text-faint md:block">
          <span className="md:sr-only">Stock</span>
          <input id={`st-${p.slug}`} aria-label={`Stock de ${p.name}`} inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} className={`h-11 w-full rounded-md border bg-white px-3 text-right text-[16px] not-italic text-ink-900 outline-none focus:ring-2 focus:ring-leaf-500/50 md:h-10 md:w-20 ${Number(stock) <= 5 ? "border-danger" : "border-line-strong/60"}`} />
        </label>
      </div>
      <label className="grid gap-1 text-[13px] italic text-faint md:block">
        <span className="md:sr-only">Estado</span>
        <select aria-label={`Estado de ${p.name}`} value={st} onChange={(e) => setSt(e.target.value as typeof st)} className="h-11 w-full rounded-md border border-line-strong/60 bg-white px-3 font-display text-[15px] not-italic text-ink-900 md:h-10 md:w-40">
          <option value="available">Disponible</option>
          <option value="soon">Próximamente</option>
          <option value="hidden">Oculto</option>
        </select>
      </label>
      <div className="md:text-right">
        <Button size="sm" disabled={!dirty || !valid || state === "saving"} onClick={() => void save()}>{state === "saving" ? "Guardando…" : "Guardar"}</Button>
        {state === "saved" && !dirty && <span role="status" className="ml-3 text-[14px] italic text-leaf-600">Guardado</span>}
        {state && state !== "saving" && state !== "saved" && <p role="alert" className="mt-1 text-[13px] text-danger">{state}</p>}
      </div>
    </li>
  );
}

export default function Products() {
  const { data, error, reload } = useAdminData<{ products: P[]; categories: { slug: string; name: string }[]; badges: { slug: string; name: string; active: boolean }[] }>("/api/admin/products");
  // null = ventana cerrada; con un borrador = crear (sin slug) o editar (con slug)
  const [editing, setEditing] = useState<ProductDraft | null>(null);

  const saved = () => {
    setEditing(null);
    void reload();
  };

  return (
    <>
      <PageTitle sub="Los cambios se ven en la tienda al instante. Un producto oculto no aparece y no se puede comprar.">Productos</PageTitle>
      <div className="mb-5 flex flex-wrap gap-3">
        <Button variant="accent" disabled={!data || data.categories.length === 0} onClick={() => data && setEditing(emptyDraft(data.categories[0]?.slug))}>Nuevo producto</Button>
        <ButtonLink href="/admin/categorias" variant="secondary">Categorías</ButtonLink>
      </div>
      {!data ? <Loading error={error} /> : data.products.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-8 text-[18px] text-muted">Aún no hay productos. Crea el primero con “Nuevo producto”.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {data.products.map((p) => <Row key={`${p.slug}-${p.price}-${p.stock}-${p.active}-${p.comingSoon}`} p={p} onSaved={() => void reload()} onEdit={(x) => setEditing(draftOf(x))} />)}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} size="lg" title={editing?.slug ? "Editar producto" : "Nuevo producto"} description={editing?.slug ? "Los cambios se ven en la tienda apenas los guardes." : "Aparece en la tienda apenas lo guardes, según el estado que elijas."}>
        {editing && data && <ProductForm key={editing.slug ?? "nuevo"} initial={editing} categories={data.categories} badges={data.badges} onSaved={saved} onCancel={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
