"use client";

import { useEffect, useState } from "react";
import type { Catalog } from "./products";

let shared: Promise<Catalog | null> | null = null;

function load() {
  shared ??= fetch("/api/catalog")
    .then((r) => (r.ok ? (r.json() as Promise<Catalog>) : null))
    .catch(() => null);
  return shared;
}

/** Catálogo vigente del servidor (null mientras carga). */
export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => {
    let alive = true;
    void load().then((c) => alive && setCatalog(c));
    return () => {
      alive = false;
    };
  }, []);
  return catalog;
}
