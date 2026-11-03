"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { api, type ApiOrder } from "@/lib/api";
import { useHydrated } from "@/lib/useHydrated";

export type User = { name: string; email: string; role?: "customer" | "admin" };
export type { ApiOrder as Order };

type State = { ready: boolean; user: User | null; orders: ApiOrder[]; favorites: string[] };
type Action =
  | { type: "session"; user: User | null; orders: ApiOrder[]; favorites: string[] }
  | { type: "favorites"; favorites: string[] };

const GUEST_KEY = "alba-pura-guest-favorites";

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "session":
      return { ready: true, user: a.user, orders: a.orders, favorites: a.favorites };
    case "favorites":
      return { ...state, favorites: a.favorites };
  }
}

type Result = { ok: true } | { ok: false; error: string; fields: Record<string, string> };

type Ctx = {
  ready: boolean;
  user: User | null;
  orders: ApiOrder[];
  favorites: string[];
  register: (name: string, email: string, password: string) => Promise<Result>;
  login: (email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  toggleFavorite: (slug: string) => void;
  refresh: () => Promise<void>;
};

const C = createContext<Ctx | null>(null);

export function useAccount(): Ctx {
  const c = useContext(C);
  const hydrated = useHydrated();
  if (!c) throw new Error("useAccount debe usarse dentro de AccountProvider");
  // Durante la hidratación de este componente se ve el estado vacío del servidor
  return hydrated ? c : { ...c, ready: false, user: null, orders: [], favorites: [] };
}

function readGuest(): string[] {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ready: false, user: null, orders: [], favorites: [] });

  const refresh = useCallback(async () => {
    const r = await api<{ user: User | null; favorites: string[]; orders: ApiOrder[] }>("/api/me");
    if (r.ok) dispatch({ type: "session", user: r.data.user, orders: r.data.orders, favorites: r.data.user ? r.data.favorites : readGuest() });
    else dispatch({ type: "session", user: null, orders: [], favorites: readGuest() });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Tras ingresar, los favoritos guardados como invitado pasan a la cuenta. */
  const mergeGuestFavorites = useCallback(async () => {
    const guest = readGuest();
    if (guest.length) {
      await api("/api/favorites", { method: "PUT", body: { slugs: guest } });
      localStorage.removeItem(GUEST_KEY);
    }
    await refresh();
  }, [refresh]);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      refresh,
      register: async (name, email, password) => {
        const r = await api("/api/auth/register", { body: { name, email, password } });
        if (!r.ok) return r;
        await mergeGuestFavorites();
        return { ok: true };
      },
      login: async (email, password) => {
        const r = await api("/api/auth/login", { body: { email, password } });
        if (!r.ok) return r;
        await mergeGuestFavorites();
        return { ok: true };
      },
      logout: async () => {
        await api("/api/auth/logout", { method: "POST", body: {} });
        dispatch({ type: "session", user: null, orders: [], favorites: readGuest() });
      },
      toggleFavorite: (slug) => {
        const on = state.favorites.includes(slug);
        const next = on ? state.favorites.filter((s) => s !== slug) : [...state.favorites, slug];
        dispatch({ type: "favorites", favorites: next });
        if (state.user) {
          void api("/api/favorites", { body: { slug } }).then((r) => {
            if (!r.ok) void refresh(); // se revierte si el servidor falló
          });
        } else {
          localStorage.setItem(GUEST_KEY, JSON.stringify(next));
        }
      },
    }),
    [state, refresh, mergeGuestFavorites],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}
