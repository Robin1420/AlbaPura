"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import { ProfileForm } from "@/components/account/ProfileForm";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink, Button } from "@/components/ui/Button";
import { money } from "@/lib/products";
import { useCatalog } from "@/lib/useCatalog";

type Tab = "pedidos" | "favoritos" | "datos";

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <Account />
    </Suspense>
  );
}

function Account() {
  const { ready, user, orders, favorites, logout } = useAccount();
  const params = useSearchParams();
  const completing = params.get("completar") === "1";
  const rawNext = params.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : undefined;
  const [tab, setTab] = useState<Tab>(completing ? "datos" : "pedidos");
  const products = useCatalog()?.products ?? [];

  if (!ready) return <div className="min-h-[60vh]" aria-busy="true" />;

  if (!user) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 pb-24 pt-48 lg:px-20">
        <h1 className="text-[clamp(40px,6vw,80px)] font-semibold tracking-[-0.04em]">Tu cuenta</h1>
        <p className="mt-4 max-w-[48ch] text-[20px] text-muted">Ingresa con tu cuenta de Google para ver tus pedidos y favoritos.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/cuenta/ingresar" size="lg">Ingresar con Google</ButtonLink>
        </div>
      </div>
    );
  }

  const favs = products.filter((p) => favorites.includes(p.slug));
  const tabs: [Tab, string][] = [["pedidos", `Pedidos (${orders.length})`], ["favoritos", `Favoritos (${favs.length})`], ["datos", "Mis datos"]];

  return (
    <>
      <header className="bg-dawn pb-10 pt-44">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-6 px-6 lg:px-20">
          <div>
            <h1 className="text-[clamp(44px,6vw,88px)] font-semibold tracking-[-0.04em]">Hola, {user.name.split(" ")[0]}.</h1>
            <p className="mt-2 text-[20px] italic text-muted">{user.email}</p>
          </div>
          {user.role === "admin" && <ButtonLink href="/admin" variant="accent" size="lg">Ir al panel de administración</ButtonLink>}
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-6 py-10 lg:px-20">
        <div role="tablist" aria-label="Mi cuenta" className="flex flex-wrap gap-2 border-b border-line pb-4">
          {tabs.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-full px-5 py-2.5 font-display text-[16px] font-medium transition-colors ${tab === id ? "bg-ink-800 text-dew-50" : "hover:bg-ink-800/8"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "pedidos" && (
          <section className="py-10" aria-label="Pedidos">
            {orders.length === 0 ? (
              <div className="max-w-md">
                <p className="font-display text-[24px] font-medium">Aún no tienes pedidos.</p>
                <p className="mt-2 text-[19px] text-muted">Cuando compres, aquí verás el estado de cada uno.</p>
                <ButtonLink href="/tienda" className="mt-6">Explorar la tienda</ButtonLink>
              </div>
            ) : (
              <ul className="divide-y divide-line border-y border-line">
                {orders.map((o) => (
                  <li key={o.id} className="grid items-center gap-4 py-6 sm:grid-cols-[160px_1fr_150px_120px_110px]">
                    <div>
                      <p className="font-display text-[18px] font-medium">{o.id}</p>
                      <p className="text-[14px] italic text-faint">{new Date(o.date).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    <p className="text-[17px] text-muted">{o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</p>
                    <span className={`w-fit rounded-full px-3 py-1 font-display text-[13px] font-medium ${o.status === "delivered" ? "bg-leaf-300" : o.status === "failed" || o.status === "cancelled" ? "bg-danger/10 text-danger" : "bg-peach-100"}`}>{o.statusLabel}</span>
                    <p className="font-display text-[18px] font-medium">{money(o.total)}</p>
                    <Link href={`/pedido/${o.id}`} className="font-display text-[15px] font-medium text-leaf-600 underline-offset-4 hover:underline">Ver detalle</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "favoritos" && (
          <section className="py-10" aria-label="Favoritos">
            {favs.length === 0 ? (
              <div className="max-w-md">
                <p className="font-display text-[24px] font-medium">Todavía no guardas favoritos.</p>
                <p className="mt-2 text-[19px] text-muted">Toca el corazón en cualquier producto para guardarlo aquí.</p>
                <ButtonLink href="/tienda" className="mt-6">Explorar la tienda</ButtonLink>
              </div>
            ) : (
              <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
                {favs.map((p) => <ProductCard key={p.slug} product={p} />)}
              </div>
            )}
          </section>
        )}

        {tab === "datos" && (
          <section className="grid gap-6 py-10" aria-label="Mis datos">
            {(completing || !user.profileComplete) && (
              <p className="max-w-xl rounded-md bg-peach-100 px-4 py-3 text-[17px]">
                {completing ? "¡Te damos la bienvenida! " : ""}Completa tu celular y dirección de entrega una sola vez; los usaremos en tus compras.
              </p>
            )}
            <ProfileForm user={user} next={completing ? next ?? "/cuenta" : undefined} />
            {user.role === "admin" && <ButtonLink href="/admin" variant="accent" className="w-fit">Ir al panel de administración</ButtonLink>}
            <Button variant="secondary" onClick={logout} className="w-fit">Cerrar sesión</Button>
          </section>
        )}
      </div>
    </>
  );
}
