"use client";

import { LazyMotion } from "motion/react";
import type { ReactNode } from "react";

// Las funciones de animación se descargan aparte, después de que la página ya es interactiva.
const features = () => import("./features").then((m) => m.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={features} strict>{children}</LazyMotion>;
}
