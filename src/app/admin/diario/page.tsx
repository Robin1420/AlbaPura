"use client";

import { useState } from "react";
import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useAdminData } from "@/components/admin/useAdminData";
import { Button } from "@/components/ui/Button";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/useConfirm";
import { api } from "@/lib/api";

const TOPICS = ["Piel", "Ciencia", "Medio ambiente"] as const;
const ARTS = [
  ["soap", "Jabón"],
  ["oil", "Aceite"],
  ["honey", "Miel"],
  ["tea", "Infusión"],
] as const;

type P = { slug: string; title: string; topic: string; excerpt: string; body: string; image: string | null; art: string; minutes: number; publishedAt: string; active: boolean };
type Draft = { slug?: string; title: string; topic: string; excerpt: string; body: string; image: string[]; art: string; minutes: string; publishedAt: string; active: boolean };

const input = "h-11 w-full rounded-md border border-line-strong/60 bg-white px-3 text-[16px] outline-none focus:ring-2 focus:ring-leaf-500/50";
const label = "mb-1.5 block font-display text-[15px] font-medium";
const today = () => new Date().toISOString().slice(0, 10);

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
    const body = { title: d.title, topic: d.topic, excerpt: d.excerpt, body: d.body, image: d.image[0] ?? null, art: d.art, minutes: Number(d.minutes) || 4, publishedAt: d.publishedAt, active: d.active };
    const r = await api(editing ? `/api/admin/posts/${initial.slug}` : "/api/admin/posts", { method: editing ? "PUT" : "POST", body });
    setSaving(false);
    if (!r.ok) return setError(Object.values(r.fields)[0] ?? r.error);
    onDone();
  }

  async function remove() {
    const r = await api(`/api/admin/posts/${initial.slug}`, { method: "DELETE" });
    if (!r.ok) return r.error;
    onDone();
  }

  return (
    <form onSubmit={(e) => void save(e)} className="grid gap-5">
      <label className="block"><span className={label}>Título</span><input required value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} className={input} /></label>
      <label className="block"><span className={label}>Resumen</span><textarea required rows={2} value={d.excerpt} onChange={(e) => setD({ ...d, excerpt: e.target.value })} className={`${input} h-auto py-2.5`} /></label>
      <label className="block">
        <span className={label}>Artículo</span>
        <textarea required rows={10} value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} className={`${input} h-auto py-2.5 leading-relaxed`} />
        <span className="mt-1 block text-[13px] italic text-faint">Separa los párrafos con una línea en blanco.</span>
      </label>
      <div className="max-w-xs"><ImageUploader label="Foto del artículo" max={1} value={d.image} onChange={(v) => setD({ ...d, image: v })} /></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block"><span className={label}>Tema</span>
          <select value={d.topic} onChange={(e) => setD({ ...d, topic: e.target.value })} className={input}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="block"><span className={label}>Ilustración si no hay foto</span>
          <select value={d.art} onChange={(e) => setD({ ...d, art: e.target.value })} className={input}>{ARTS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
        </label>
        <label className="block"><span className={label}>Fecha</span><input type="date" required value={d.publishedAt} onChange={(e) => setD({ ...d, publishedAt: e.target.value })} className={input} /></label>
        <label className="block"><span className={label}>Minutos de lectura</span><input inputMode="numeric" value={d.minutes} onChange={(e) => setD({ ...d, minutes: e.target.value.replace(/\D/g, "") })} className={`${input} w-28`} /></label>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-3 text-[16px]"><input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} className="size-5 accent-ink-800" />Publicado</label>
      {error && <p role="alert" className="text-[16px] text-danger">{error}</p>}
      <ModalActions>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear artículo"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
        {editing && (
          <Button type="button" variant="ghost" className="ml-auto text-danger" disabled={saving} onClick={() => confirm({ title: "¿Eliminar este artículo?", message: `“${d.title}” se elimina y no se puede recuperar.`, confirmLabel: "Eliminar", danger: true, action: remove })}>
            Eliminar artículo
          </Button>
        )}
      </ModalActions>
      {dialog}
    </form>
  );
}

export default function Diario() {
  const { data, error, reload } = useAdminData<{ posts: P[] }>("/api/admin/posts");
  const [editing, setEditing] = useState<Draft | null>(null);

  const done = () => {
    setEditing(null);
    void reload();
  };

  return (
    <>
      <PageTitle sub="Los artículos del diario. La foto se guarda en Cloudflare y se ve en el inicio y en el diario.">Diario</PageTitle>
      {!data ? <Loading error={error} /> : (
        <>
          <div className="mb-5"><Button variant="accent" onClick={() => setEditing({ title: "", topic: "Piel", excerpt: "", body: "", image: [], art: "soap", minutes: "4", publishedAt: today(), active: true })}>Nuevo artículo</Button></div>
          <ul className="grid gap-3">
            {data.posts.map((p) => (
              <li key={p.slug} className={`flex items-center gap-4 rounded-xl border border-line p-4 ${p.active ? "bg-white" : "bg-dew-100/60"}`}>
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="size-14 rounded-md object-cover" />
                ) : <span className="size-14 rounded-md bg-dew-100" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[17px] font-medium">{p.title}</p>
                  <p className="text-[14px] italic text-faint">{p.topic} · {p.publishedAt} · {p.active ? "Publicado" : "Borrador"}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setEditing({ slug: p.slug, title: p.title, topic: p.topic, excerpt: p.excerpt, body: p.body, image: p.image ? [p.image] : [], art: p.art, minutes: String(p.minutes), publishedAt: p.publishedAt, active: p.active })}>Editar</Button>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.slug ? "Editar artículo" : "Nuevo artículo"} description="Los cambios se ven en el sitio en menos de un minuto.">
        {editing && <Editor key={editing.slug ?? "nuevo"} initial={editing} onDone={done} onCancel={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
