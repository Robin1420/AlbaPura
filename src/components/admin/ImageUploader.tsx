"use client";

import { useRef, useState } from "react";

/** Sube fotos al servidor y devuelve sus URLs. La primera foto es la principal. */
export function ImageUploader({ value, onChange, max = 8, label = "Fotos" }: { value: string[]; onChange: (v: string[]) => void; max?: number; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    let next = [...value];
    for (const file of Array.from(files)) {
      if (next.length >= max) {
        setError(`Máximo ${max} fotos.`);
        break;
      }
      const fd = new FormData();
      fd.append("file", file);
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
              <span className="italic text-faint">{i === 0 ? "Principal" : `Foto ${i + 1}`}</span>
              <span className="flex gap-1">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Mover antes" className="px-1.5 disabled:opacity-30">←</button>
                <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Mover después" className="px-1.5 disabled:opacity-30">→</button>
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
      <p className="mt-2 text-[13px] italic text-faint">JPG, PNG o WebP, hasta 5 MB cada una.</p>
      {error && <p role="alert" className="mt-1 text-[14px] text-danger">{error}</p>}
    </div>
  );
}
