"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const errors: Record<string, string> = {
  cancelado: "Cancelaste el ingreso con Google. Cuando quieras, vuelve a intentarlo.",
  estado: "El ingreso caducó o se abrió en otra ventana. Inténtalo de nuevo.",
  google: "Google no pudo confirmar tu cuenta. Inténtalo de nuevo en un momento.",
};

function GoogleLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function Card({ mode }: { mode: "login" | "register" }) {
  const params = useSearchParams();
  const error = errors[params.get("error") ?? ""];
  const next = params.get("next");
  const href = `/api/auth/google/start${next && next.startsWith("/") && !next.startsWith("//") ? `?next=${encodeURIComponent(next)}` : ""}`;
  const isRegister = mode === "register";

  return (
    <div className="grid w-full max-w-[460px] gap-5">
      <h1 className="text-[clamp(36px,4vw,52px)] font-semibold tracking-[-0.04em]">{isRegister ? "Crea tu cuenta" : "Ingresa a tu cuenta"}</h1>
      <p className="-mt-2 text-[19px] text-muted">
        {isRegister ? "Con tu cuenta de Google es un clic. Guarda tus pedidos y favoritos, y recibe 10% en tu primera compra." : "Revisa tus pedidos y tus favoritos con tu cuenta de Google."}
      </p>
      {error && <p role="alert" className="rounded-md bg-peach-100 px-4 py-3 text-[16px] text-danger">{error}</p>}
      {/* Es un enlace normal: la API redirige a Google y vuelve con la sesión abierta */}
      <a href={href} className="flex h-14 items-center justify-center gap-3 rounded-full border border-line-strong/60 bg-white font-display text-[17px] font-medium text-ink-900 transition-colors hover:bg-dew-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600">
        <GoogleLogo />
        Continuar con Google
      </a>
      <p className="text-[15px] italic text-faint">
        No guardamos contraseñas. Después de ingresar te pediremos tu celular y dirección de entrega, una sola vez.
      </p>
    </div>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="relative hidden overflow-hidden bg-ink-900 lg:block">
        <Image src="/img/products/jabon-artesanal-de-avena.jpg" alt="" fill sizes="45vw" priority className="object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/10 to-ink-900/30" />
        <p className="absolute inset-x-12 bottom-14 max-w-[18ch] font-display text-[44px] font-medium leading-[1.02] tracking-[-0.03em] text-dew-50">
          Lo natural no es una moda, es volver a lo esencial.
        </p>
      </div>
      <div className="flex items-center justify-center px-5 pb-16 pt-36 sm:px-6 sm:pb-20 sm:pt-44 lg:pt-32">
        <Suspense fallback={<div className="h-64 w-full max-w-[460px]" aria-busy="true" />}>
          <Card mode={mode} />
        </Suspense>
      </div>
    </div>
  );
}
