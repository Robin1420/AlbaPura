import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false durante el render del servidor y la hidratación; true después. Evita desajustes con datos de localStorage. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
