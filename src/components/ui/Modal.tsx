"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useHydrated } from "@/lib/useHydrated";

const sizes = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl", xl: "sm:max-w-5xl" } as const;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Pila de ventanas abiertas: solo la de arriba responde a Escape y al Tab, y el scroll de la página se bloquea una sola vez.
const stack: string[] = [];

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Texto corto bajo el título (también lo lee el lector de pantalla). */
  description?: string;
  size?: keyof typeof sizes;
  /** Con false no se cierra con Escape, con clic afuera ni con la X (por ejemplo mientras se guarda). */
  dismissible?: boolean;
  children: ReactNode;
};

/**
 * Ventana emergente reutilizable: se abre encima de la página sin recargarla.
 * Cierra con Escape, clic en el fondo o la X; atrapa el foco y lo devuelve a quien la abrió.
 * En celular sube desde abajo como una hoja; en pantallas grandes aparece centrada.
 */
export function Modal({ open, onClose, title, description, size = "md", dismissible = true, children }: ModalProps) {
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const downOnBackdrop = useRef(false);
  const latest = useRef({ onClose, dismissible });
  useEffect(() => {
    latest.current = { onClose, dismissible };
  });

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    stack.push(id);
    document.body.style.overflow = "hidden";

    // El foco entra a la ventana (al primer campo si lo hay) sin saltar al botón de cerrar
    const t = setTimeout(() => {
      const el = panel.current;
      if (!el || el.contains(document.activeElement)) return;
      const first = el.querySelector<HTMLElement>('[data-autofocus], input:not([disabled]):not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), select:not([disabled]), textarea:not([disabled])');
      (first ?? el).focus();
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === "Escape" && latest.current.dismissible) {
        e.preventDefault();
        latest.current.onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(id), 1);
      if (stack.length === 0) document.body.style.overflow = "";
      opener?.focus?.();
    };
  }, [open, id]);

  if (!hydrated) return null;

  const dur = reduce ? 0 : 0.28;
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          key="modal"
          className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur }}
        >
          <div
            className="absolute inset-0 bg-ink-900/55 backdrop-blur-[2px]"
            aria-hidden="true"
            onMouseDown={() => (downOnBackdrop.current = true)}
            onMouseUp={() => {
              if (downOnBackdrop.current && dismissible) onClose();
              downOnBackdrop.current = false;
            }}
          />
          <m.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            aria-describedby={description ? `${id}-desc` : undefined}
            tabIndex={-1}
            className={`relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-3xl bg-dew-50 shadow-[0_30px_80px_-20px_rgb(8_24_15/0.5)] outline-none sm:max-h-[88svh] sm:rounded-2xl ${sizes[size]}`}
            initial={{ y: reduce ? 0 : 40, scale: reduce ? 1 : 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: reduce ? 0 : 40, scale: reduce ? 1 : 0.98 }}
            transition={{ duration: dur, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div className="min-w-0">
                <h2 id={`${id}-title`} className="text-[26px] leading-tight">{title}</h2>
                {description && <p id={`${id}-desc`} className="mt-1 text-[16px] italic text-muted">{description}</p>}
              </div>
              <button type="button" onClick={onClose} disabled={!dismissible} aria-label="Cerrar" className="grid size-10 shrink-0 place-items-center rounded-full transition-colors hover:bg-ink-800/8 disabled:opacity-40">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Franja de botones fija al pie del contenido de una ventana (queda visible aunque el formulario sea largo). */
export function ModalActions({ children }: { children: ReactNode }) {
  return <div className="sticky -bottom-5 z-10 -mx-6 mt-6 flex flex-wrap items-center gap-3 border-t border-line bg-dew-50/95 px-6 py-4 backdrop-blur">{children}</div>;
}

/**
 * Ventana de confirmación para acciones que no se pueden deshacer.
 * `onConfirm` devuelve un texto de error si falla: la ventana se queda abierta y lo muestra.
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger,
  busy,
  error,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" dismissible={!busy}>
      <div className="text-[18px] text-muted">{message}</div>
      {error && <p role="alert" className="mt-4 text-[16px] text-danger">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>{cancelLabel}</Button>
        <Button type="button" onClick={onConfirm} disabled={busy} data-autofocus className={danger ? "!bg-danger !text-white hover:!bg-danger/90" : ""}>
          {busy ? "Un momento…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
