"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/products";

const steps = ["Abre Yape, Plin o la app de tu banco.", "Elige pagar con QR y escanea este código.", "Confirma el pago: esta página avanza sola."];

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Pago con QR de billeteras móviles: el código, los pasos y la espera de la confirmación. */
export function QrPanel({ image, code, total, expiresAt, onCancel }: { image: string; code: string | null; total: number; expiresAt: number | null; onCancel: () => void }) {
  const [left, setLeft] = useState<number | null>(() => (expiresAt ? Math.max(0, expiresAt - Math.floor(Date.now() / 1000)) : null));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setLeft(Math.max(0, expiresAt - Math.floor(Date.now() / 1000)));
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const expired = left === 0;

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // sin permiso para copiar: el código sigue a la vista
    }
  }

  return (
    <div className="@container overflow-hidden rounded-2xl border border-ink-800/15 bg-white shadow-[0_20px_50px_-30px_rgb(8_24_15/0.45)]">
      <div className="flex items-center justify-between gap-4 bg-ink-800 px-5 py-4 text-dew-50">
        <div>
          <p className="font-display text-[13px] text-dew-200/70">Pago con QR</p>
          <p className="font-display text-[18px] font-medium leading-tight">Billetera móvil</p>
        </div>
        <p className="font-display text-[30px] font-medium leading-none tracking-[-0.03em]">{money(total)}</p>
      </div>

      <div className="grid gap-6 p-5 @md:grid-cols-[auto_1fr] @md:gap-8 @md:p-7">
        <div className="mx-auto grid gap-3 @md:mx-0">
          <div className={`relative rounded-2xl bg-dew-50 p-3 ring-1 ring-line transition-opacity ${expired ? "opacity-30" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Código QR para pagar el pedido" width={210} height={210} className="size-[210px] rounded-lg bg-white" />
          </div>
          {code && (
            <button
              type="button"
              onClick={() => void copy()}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-dew-50 px-4 py-2.5 text-left transition-colors hover:border-ink-800/40"
              aria-label={`Copiar el código de pago ${code}`}
            >
              <span>
                <span className="block text-[12px] italic text-faint">Código de pago</span>
                <span className="block font-display text-[19px] font-medium tracking-[0.06em]">{code}</span>
              </span>
              <span className="font-display text-[13px] font-medium text-leaf-600">{copied ? "Copiado" : "Copiar"}</span>
            </button>
          )}
        </div>

        <div className="grid content-between gap-5">
          <ol className="grid gap-3.5">
            {steps.map((t, i) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ink-800 font-display text-[12px] font-semibold text-dew-50">{i + 1}</span>
                <span className="text-[17px] leading-snug text-ink-900">{t}</span>
              </li>
            ))}
          </ol>

          <div className="grid gap-3">
            {expired ? (
              <p role="status" className="rounded-xl bg-peach-100 px-4 py-3 text-[15px] text-danger">El QR venció. Genera uno nuevo para pagar.</p>
            ) : (
              <p role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-leaf-300/35 px-4 py-3 text-[15px]">
                <span className="flex items-center gap-2 font-display font-medium">
                  <span className="size-2.5 animate-pulse rounded-full bg-leaf-600" aria-hidden="true" />
                  Esperando tu pago
                </span>
                {left !== null && <span className="italic text-muted">· vence en {clock(left)}</span>}
              </p>
            )}
            <button type="button" onClick={onCancel} className="w-fit font-display text-[14px] font-medium text-leaf-600 underline underline-offset-4">
              {expired ? "Generar un QR nuevo" : "Elegir otra forma de pago"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
