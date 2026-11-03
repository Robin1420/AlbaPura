"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useAccount } from "./AccountProvider";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { login, register } = useAccount();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const err: Record<string, string> = {};
    if (isRegister && name.trim().length < 2) err.name = "Escribe tu nombre.";
    if (!emailRe.test(email.trim())) err.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
    if (password.length < 8) err.password = isRegister ? "Usa al menos 8 caracteres." : "Escribe tu contraseña (mínimo 8 caracteres).";
    if (isRegister && !terms) err.terms = "Acepta los términos para crear tu cuenta.";
    setErrors(err);
    if (Object.keys(err).length) return;

    setBusy(true);
    const r = isRegister ? await register(name, email, password) : await login(email, password);
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fields);
      setFormError(Object.keys(r.fields).length ? "" : r.error);
      return;
    }
    router.push("/cuenta");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="relative hidden overflow-hidden bg-ink-900 lg:block">
        <Image src="/img/products/jabon-artesanal-de-avena.jpg" alt="" fill sizes="45vw" priority className="object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/10 to-ink-900/30" />
        <p className="absolute inset-x-12 bottom-14 max-w-[18ch] font-display text-[44px] font-medium leading-[1.02] tracking-[-0.03em] text-dew-50">
          Lo natural no es una moda, es volver a lo esencial.
        </p>
      </div>
      <div className="flex items-center justify-center px-6 pb-20 pt-44 lg:pt-32">
        <form onSubmit={submit} noValidate className="grid w-full max-w-[460px] gap-5">
          <h1 className="text-[clamp(36px,4vw,52px)] font-semibold tracking-[-0.04em]">{isRegister ? "Crea tu cuenta" : "Ingresa a tu cuenta"}</h1>
          <p className="-mt-2 text-[19px] text-muted">{isRegister ? "Guarda tus pedidos y favoritos, y recibe 10% en tu primera compra." : "Revisa tus pedidos y tus favoritos."}</p>
          {isRegister && <Field label="Nombre completo" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />}
          <Field label="Correo electrónico" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <Field label="Contraseña" name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} hint={isRegister ? "Mínimo 8 caracteres." : undefined} />
          {isRegister && (
            <div>
              <label className="flex items-start gap-3 text-[16px]">
                <input type="checkbox" name="terms" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 size-5 accent-ink-800" />
                Acepto los términos y la política de privacidad.
              </label>
              {errors.terms && <p className="mt-1 text-[14px] text-danger">{errors.terms}</p>}
            </div>
          )}
          {formError && <p role="alert" className="rounded-md bg-peach-100 px-4 py-3 text-[16px] text-danger">{formError}</p>}
          <Button type="submit" size="lg" disabled={busy} className="w-full">{busy ? "Un momento…" : isRegister ? "Crear cuenta" : "Ingresar"}</Button>
          <p className="text-[17px] text-muted">
            {isRegister ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
            <Link href={isRegister ? "/cuenta/ingresar" : "/cuenta/registro"} className="font-display font-medium text-ink-900 underline underline-offset-4">
              {isRegister ? "Ingresa" : "Crea una cuenta"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
