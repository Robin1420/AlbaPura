"use client";

import { useState } from "react";
import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { fmtDate, useAdminData } from "@/components/admin/useAdminData";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/useConfirm";
import { api } from "@/lib/api";

type M = { name: string; url: string; originalName: string; mime: string; width: number; height: number; bytes: number; alt: string; uploadedBy: string | null; createdAt: string; usedIn: string[] };

const size = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

function Card({ m, onChanged }: { m: M; onChanged: () => void }) {
  const [alt, setAlt] = useState(m.alt);
  const [state, setState] = useState("");
  const dirty = alt !== m.alt;

  async function save() {
    setState("Guardando…");
    const r = await api(`/api/admin/media/${m.name}`, { method: "PATCH", body: { alt } });
    if (!r.ok) return setState(r.error);
    setState("Guardado");
    onChanged();
  }

  const { confirm, dialog } = useConfirm();

  async function remove() {
    const r = await api(`/api/admin/media/${m.name}`, { method: "DELETE" });
    if (!r.ok) return r.error;
    onChanged();
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.url} alt={m.alt || m.originalName} width={m.width} height={m.height} loading="lazy" className="aspect-[4/3] w-full bg-dew-100 object-cover" />
      <div className="grid gap-3 p-4">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[14px]">
          <dt className="italic text-faint">Medidas</dt><dd className="text-right font-display font-medium">{m.width} × {m.height} px</dd>
          <dt className="italic text-faint">Peso</dt><dd className="text-right font-display font-medium">{size(m.bytes)}</dd>
          <dt className="italic text-faint">Formato</dt><dd className="text-right font-display font-medium">{m.mime.replace("image/", "").toUpperCase()}</dd>
          <dt className="italic text-faint">Subida</dt><dd className="text-right">{fmtDate(m.createdAt)}</dd>
        </dl>
        <label className="block">
          <span className="mb-1 block font-display text-[14px] font-medium">Texto alternativo</span>
          <input value={alt} maxLength={160} onChange={(e) => { setAlt(e.target.value); setState(""); }} placeholder="Describe qué se ve en la foto" className="h-10 w-full rounded-md border border-line-strong/60 bg-white px-3 text-[15px] outline-none focus:ring-2 focus:ring-leaf-500/50" />
        </label>
        <p className="text-[13px] italic text-faint">{m.usedIn.length ? `En uso: ${m.usedIn.join(", ")}` : "Sin usar"}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" disabled={!dirty} onClick={() => void save()}>Guardar</Button>
          <Button size="sm" variant="ghost" className="text-danger" disabled={m.usedIn.length > 0} onClick={() => confirm({ title: "¿Borrar esta foto?", message: "Se elimina el archivo y no se puede recuperar.", confirmLabel: "Borrar", danger: true, action: remove })}>Borrar</Button>
          {state && <span role="status" className="text-[13px] italic text-muted">{state}</span>}
        </div>
        <p className="break-all text-[12px] text-faint">{m.url}</p>
      </div>
      {dialog}
    </li>
  );
}

export default function Images() {
  const { data, error, reload } = useAdminData<{ media: M[] }>("/api/admin/media");
  const missing = data?.media.filter((m) => !m.alt).length ?? 0;
  return (
    <>
      <PageTitle sub="Cada foto que subes queda guardada con sus medidas, peso y texto alternativo. Aquí ves dónde se usa.">Imágenes</PageTitle>
      {!data ? <Loading error={error} /> : data.media.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-8 text-[18px] text-muted">Aún no hay fotos subidas. Se agregan desde el formulario de un producto o una categoría.</p>
      ) : (
        <>
          {missing > 0 && <p className="mb-5 rounded-lg bg-peach-100 px-4 py-3 text-[16px]">{missing} foto{missing === 1 ? "" : "s"} sin texto alternativo. Agrégalo para mejorar la accesibilidad y el SEO.</p>}
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.media.map((m) => <Card key={`${m.name}-${m.alt}`} m={m} onChanged={() => void reload()} />)}
          </ul>
        </>
      )}
    </>
  );
}
