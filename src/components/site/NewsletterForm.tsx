"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setState("busy");
    const r = await api("/api/newsletter", { body: { email } });
    if (!r.ok) {
      setState("idle");
      setError(r.fields.email ?? r.error);
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <p role="status" className="rounded-lg bg-white/10 p-4 text-[17px] text-dew-100">
        Listo. Te avisaremos de las novedades.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid content-start gap-3" aria-label="Boletín">
      <label htmlFor="nl" className="font-display text-[22px] font-medium leading-tight">Entérate de cada novedad</label>
      <p className="text-[16px] text-dew-200/75">Te avisaremos cuando lancemos nuevos productos.</p>
      <div className="mt-1 flex rounded-full bg-dew-50 p-1.5">
        <input id="nl" type="email" required placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} className="min-w-0 flex-1 bg-transparent px-4 text-[16px] text-ink-900 outline-none placeholder:text-faint" />
        <button disabled={state === "busy"} className="rounded-full bg-ink-800 px-5 py-2.5 font-display text-[14px] font-semibold text-dew-50 hover:bg-ink-700 disabled:opacity-60">{state === "busy" ? "Enviando…" : "Suscribirme"}</button>
      </div>
      {error && <p role="alert" className="text-[14px] text-peach-300">{error}</p>}
    </form>
  );
}
