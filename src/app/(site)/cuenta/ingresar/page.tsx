import type { Metadata } from "next";
import { AuthForm } from "@/components/account/AuthForm";

export const metadata: Metadata = { title: "Ingresar" };

export default function Page() {
  return <AuthForm mode="login" />;
}
