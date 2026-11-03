"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

/** Carga datos del panel y permite recargarlos tras una acción. */
export function useAdminData<T>(path: string) {
  const [state, setState] = useState<{ data?: T; error?: string }>({});

  const reload = useCallback(async () => {
    const r = await api<T>(path);
    setState(r.ok ? { data: r.data } : { error: r.error });
  }, [path]);

  useEffect(() => {
    let alive = true;
    void api<T>(path).then((r) => {
      if (alive) setState(r.ok ? { data: r.data } : { error: r.error });
    });
    return () => {
      alive = false;
    };
  }, [path]);

  return { ...state, loading: state.data === undefined && !state.error, reload };
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
