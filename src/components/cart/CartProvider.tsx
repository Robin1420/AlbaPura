"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import type { Product } from "@/lib/products";
import { useCatalog } from "@/lib/useCatalog";
import { useHydrated } from "@/lib/useHydrated";

type Line = { slug: string; qty: number };
type State = { lines: Line[]; gift: boolean; ready: boolean };
type Action =
  | { type: "hydrate"; lines: Line[]; gift: boolean }
  | { type: "add"; slug: string; qty: number }
  | { type: "setQty"; slug: string; qty: number }
  | { type: "remove"; slug: string }
  | { type: "gift"; on: boolean }
  | { type: "clear" };

const KEY = "alba-pura-cart";
const GIFT_PRICE = 2500;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines, gift: action.gift, ready: true };
    case "add": {
      const found = state.lines.find((l) => l.slug === action.slug);
      const lines = found
        ? state.lines.map((l) => (l.slug === action.slug ? { ...l, qty: l.qty + action.qty } : l))
        : [...state.lines, { slug: action.slug, qty: action.qty }];
      return { ...state, lines };
    }
    case "setQty":
      return {
        ...state,
        lines: state.lines.map((l) => (l.slug === action.slug ? { ...l, qty: Math.max(1, action.qty) } : l)),
      };
    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.slug !== action.slug) };
    case "gift":
      return { ...state, gift: action.on };
    case "clear":
      return { ...state, lines: [], gift: false };
  }
}

type CartItem = { product: Product; qty: number };

type CartContext = {
  items: CartItem[];
  count: number;
  subtotal: number;
  gift: boolean;
  giftPrice: number;
  total: number;
  open: boolean;
  toast: string | null;
  setOpen: (v: boolean) => void;
  add: (slug: string, qty?: number, name?: string) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  setGift: (on: boolean) => void;
  clear: () => void;
};

const Ctx = createContext<CartContext | null>(null);

export function useCart(): CartContext {
  const c = useContext(Ctx);
  const hydrated = useHydrated();
  if (!c) throw new Error("useCart debe usarse dentro de CartProvider");
  // Durante la hidratación de este componente se ve el carrito vacío del servidor
  return hydrated
    ? c
    : { ...c, items: [], count: 0, subtotal: 0, gift: false, giftPrice: 0, total: 0 };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], gift: false, ready: false });
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const catalog = useCatalog();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      dispatch({ type: "hydrate", lines: parsed?.lines ?? [], gift: !!parsed?.gift });
    } catch {
      dispatch({ type: "hydrate", lines: [], gift: false });
    }
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    localStorage.setItem(KEY, JSON.stringify({ lines: state.lines, gift: state.gift }));
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const add = useCallback((slug: string, qty = 1, name?: string) => {
    dispatch({ type: "add", slug, qty });
    setToast(name ?? "Producto añadido");
  }, []);

  const value = useMemo<CartContext>(() => {
    const items = state.lines
      .map((l) => ({ product: catalog?.products.find((p) => p.slug === l.slug), qty: l.qty }))
      .filter((i): i is { product: Product; qty: number } => !!i.product);
    const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
    const giftPrice = state.gift && items.length ? GIFT_PRICE : 0;
    return {
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal,
      gift: state.gift,
      giftPrice,
      total: subtotal + giftPrice,
      open,
      toast,
      setOpen,
      add,
      setQty: (slug, qty) => dispatch({ type: "setQty", slug, qty }),
      remove: (slug) => dispatch({ type: "remove", slug }),
      setGift: (on) => dispatch({ type: "gift", on }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [state, open, toast, add, catalog]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
