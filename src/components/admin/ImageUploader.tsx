"use client";

import { useRef, useState } from "react";

const MAX_SIDE = 1600;
const QUALITY = 0.82;

/** Reduce la foto en el navegador antes de subirla: máx. 1600 px por lado y WebP al 82 %. Si algo falla, sube la original. */
async function compress(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", QUALITY));
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

/** Sube fotos al servidor y devuelve sus URLs. La primera foto es la principal. */
export function ImageUploader({ value, onChange, max = 8, label = "Fotos" }: { value: string[]; onChange: (v: string[]) => void; max?: number; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    // Con una sola foto permitida, subir otra la reemplaza
    let next = max === 1 ? [] : [...value];
    for (const file of Array.from(files)) {
      if (next.length >= max) {
        setError(`Máximo ${max} fotos.`);
        break;
      }
      const fd = new FormData();
      fd.append("file", await compress(file));
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "same-origin" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(`${file.name}: ${data.error ?? "no se pudo subir."}`);
          continue;
        }
        next = [...next, data.url as string];
      } catch {
        setError("No pudimos conectar con el servidor.");
        break;
      }
    }
    onChange(next);
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <div>
      <p className="mb-2 font-display text-[15px] font-medium">{label}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {value.map((src, i) => (
          <li key={src} className="overflow-hidden rounded-lg border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${label} ${i + 1}`} className="aspect-square w-full object-cover" />
            <div className="flex items-center justify-between gap-1 px-2 py-1.5 text-[13px]">
              <span className="italic text-faint">{max === 1 ? "Foto" : i === 0 ? "Principal" : `Foto ${i + 1}`}</span>
              <span className="flex gap-1">
                {max === 1 && <button type="button" onClick={() => input.current?.click()} disabled={busy} className="px-1.5 font-medium disabled:opacity-50">{busy ? "Subiendo…" : "Cambiar"}</button>}
                {max > 1 && <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Mover antes" className="px-1.5 disabled:opacity-30">←</button>}
                {max > 1 && <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Mover después" className="px-1.5 disabled:opacity-30">→</button>}
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Quitar foto ${i + 1}`} className="px-1.5 text-danger">Quitar</button>
              </span>
            </div>
          </li>
        ))}
        {value.length < max && (
          <li>
            <button type="button" onClick={() => input.current?.click()} disabled={busy} className="grid aspect-square w-full place-items-center rounded-lg border border-dashed border-line-strong/70 text-[14px] text-muted hover:bg-dew-100 disabled:opacity-60">
              {busy ? "Subiendo…" : "Subir foto"}
            </button>
          </li>
        )}
      </ul>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1} hidden onChange={(e) => void upload(e.target.files)} />
      <p className="mt-2 text-[13px] italic text-faint">JPG, PNG o WebP. Se reducen solas a máx. 1600 px antes de subir.</p>
      {error && <p role="alert" className="mt-1 text-[14px] text-danger">{error}</p>}
    </div>
  );
}
