"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { api } from "@/lib/api";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ContactForm() {
  const [v, setV] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const on = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setFormError("");
    const err: Record<string, string> = {};
    if (v.name.trim().length < 2) err.name = "Escribe tu nombre.";
    if (!emailRe.test(v.email.trim())) err.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
    if (v.message.trim().length < 10) err.message = "Cuéntanos un poco más (mínimo 10 caracteres).";
    setErrors(err);
    const first = Object.keys(err)[0];
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setBusy(true);
    const r = await api("/api/contact", { body: v });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fields);
      setFormError(Object.keys(r.fields).length ? "" : r.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="rounded-xl bg-dew-100 p-8">
        <p className="font-display text-[28px] font-medium tracking-[-0.02em]">Mensaje enviado</p>
        <p className="mt-2 text-[19px] text-muted">Gracias, {v.name.split(" ")[0]}. Te responderemos a {v.email} lo antes posible.</p>
        <Button variant="secondary" className="mt-6" onClick={() => { setSent(false); setV({ name: "", email: "", subject: "", message: "" }); }}>Enviar otro mensaje</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" name="name" autoComplete="name" value={v.name} onChange={on("name")} error={errors.name} />
        <Field label="Correo electrónico" name="email" type="email" autoComplete="email" value={v.email} onChange={on("email")} error={errors.email} />
      </div>
      <Field label="Asunto" name="subject" value={v.subject} onChange={on("subject")} placeholder="Por ejemplo, una consulta sobre un pedido" />
      <div className="grid gap-1.5">
        <label htmlFor="message" className="font-display text-[14px] font-medium">Mensaje</label>
        <textarea id="message" name="message" rows={6} value={v.message} onChange={on("message")} aria-invalid={!!errors.message} className={`rounded-md border bg-white p-4 font-text text-[17px] outline-none focus:ring-2 focus:ring-leaf-500/50 ${errors.message ? "border-danger" : "border-line-strong/60 focus:border-leaf-600"}`} />
        {errors.message && <p className="text-[14px] text-danger">{errors.message}</p>}
      </div>
      {formError && <p role="alert" className="rounded-md bg-peach-100 px-4 py-3 text-[16px] text-danger">{formError}</p>}
      <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-fit sm:min-w-56">{busy ? "Enviando…" : "Enviar mensaje"}</Button>
    </form>
  );
}
