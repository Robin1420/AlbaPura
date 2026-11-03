import type { Metadata } from "next";
import { AuthForm } from "@/components/account/AuthForm";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function Page() {
  return <AuthForm mode="register" />;
}
