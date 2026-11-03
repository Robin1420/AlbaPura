"use client";

import { useCallback, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/Modal";

type Ask = {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  /** Acción a ejecutar al confirmar. Devuelve un texto si falló: la ventana se queda abierta y lo muestra. */
  action: () => Promise<string | void>;
};

/**
 * Reemplaza a window.confirm: `confirm({...})` abre la ventana de confirmación y `dialog` es el elemento que hay que dibujar.
 *
 *   const { confirm, dialog } = useConfirm();
 *   ...
 *   <button onClick={() => confirm({ title: "¿Eliminar?", message: "…", danger: true, action: remove })} />
 *   {dialog}
 */
export function useConfirm() {
  const [ask, setAsk] = useState<Ask | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = useCallback((a: Ask) => {
    setError("");
    setAsk(a);
  }, []);

  const close = useCallback(() => {
    if (!busy) setAsk(null);
  }, [busy]);

  async function run() {
    if (!ask) return;
    setBusy(true);
    setError("");
    const problem = await ask.action();
    setBusy(false);
    if (problem) setError(problem);
    else setAsk(null);
  }

  const dialog = (
    <ConfirmDialog
      open={ask !== null}
      onClose={close}
      title={ask?.title ?? ""}
      message={ask?.message}
      confirmLabel={ask?.confirmLabel}
      danger={ask?.danger}
      busy={busy}
      error={error}
      onConfirm={() => void run()}
    />
  );

  return { confirm, dialog };
}
