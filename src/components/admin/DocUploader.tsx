"use client";

import { useRef, useState } from "react";

/** Sube un PDF (proceso de elaboración, manual de uso…) y guarda su URL. Subir otro reemplaza al anterior. */
export function DocUploader({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-doc", { method: "POST", body: fd, credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "No se pudo subir el PDF.");
      else onChange(data.url as string);
    } catch {
      setError("No pudimos conectar con el servidor.");
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <p className="mb-2 font-display text-[15px] font-medium">{label}</p>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white px-4 py-3">
        {value ? (
          <>
            <a href={value} target="_blank" rel="noreferrer" className="text-[15px] underline underline-offset-4">Ver PDF</a>
            <button type="button" onClick={() => input.current?.click()} disabled={busy} className="text-[15px] font-medium disabled:opacity-50">{busy ? "Subiendo…" : "Cambiar"}</button>
            <button type="button" onClick={() => onChange("")} className="text-[15px] text-danger">Quitar</button>
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="text-[15px] font-medium underline underline-offset-4 disabled:opacity-50">{busy ? "Subiendo…" : "Subir PDF"}</button>
        )}
      </div>
      <input ref={input} type="file" accept="application/pdf" hidden onChange={(e) => void upload(e.target.files?.[0])} />
      <p className="mt-1.5 text-[13px] italic text-faint">{hint ?? "Solo PDF, hasta 10 MB."}</p>
      {error && <p role="alert" className="mt-1 text-[14px] text-danger">{error}</p>}
    </div>
  );
}
