import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s | Administración" },
  robots: { index: false, follow: false },
};

// El panel depende de la sesión (cliente), así que no se valida como navegación instantánea.
export const instant = false;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
