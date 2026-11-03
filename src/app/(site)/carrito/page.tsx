"use client";

import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { ProductArt } from "@/components/product/ProductArt";
import { CheckoutSteps } from "@/components/site/CheckoutSteps";
import { ButtonLink } from "@/components/ui/Button";
import { money } from "@/lib/products";

export default function CartPage() {
  const cart = useCart();

  return (
    <>
      <header className="bg-dawn grain pb-12 pt-44">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-20">
          <h1 className="text-[clamp(48px,7vw,96px)] font-semibold tracking-[-0.04em]">Tu carrito</h1>
          <p className="mt-3 text-[20px] italic text-muted">{cart.count === 0 ? "Aún no has elegido nada." : `${cart.count} producto${cart.count === 1 ? "" : "s"}`}</p>
          {cart.items.length > 0 && <CheckoutSteps current={0} />}
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:px-20">
        {cart.items.length === 0 ? (
          <div className="max-w-md">
            <p className="font-display text-[26px] font-medium">Tu carrito está vacío.</p>
            <p className="mt-2 text-[19px] text-muted">Empieza por lo que más nos piden esta temporada.</p>
            <ButtonLink href="/tienda" className="mt-6" size="lg">Explorar la tienda</ButtonLink>
          </div>
        ) : (
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <p className="rounded-2xl bg-leaf-300/40 p-5 font-display text-[16px] font-medium text-ink-700">
                Estamos en fase de prueba: entregamos en Lima Metropolitana y Callao.
              </p>

              <ul className="mt-6 border-t border-line">
                <AnimatePresence initial={false}>
                  {cart.items.map(({ product, qty }) => (
                    <m.li
                      key={product.slug}
                      layout="position"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden border-b border-line"
                    >
                      <div className="flex flex-wrap items-center gap-5 py-6">
                        <Link href={`/producto/${product.slug}`} className="relative block size-28 shrink-0 overflow-hidden rounded-t-[999px] rounded-b-lg bg-dew-100" aria-label={product.name}>
                          <ProductArt product={product} sizes="112px" />
                        </Link>
                        <div className="min-w-48 flex-1">
                          <Link href={`/producto/${product.slug}`} className="font-display text-[22px] font-medium underline-offset-4 hover:underline">{product.name}</Link>
                          <p className="text-[15px] italic text-faint">{product.meta}</p>
                          <p className="mt-1 text-[15px] text-muted">{money(product.price)} c/u</p>
                          <button onClick={() => cart.remove(product.slug)} className="mt-2 text-[15px] text-leaf-600 underline-offset-4 hover:underline">Quitar</button>
                        </div>
                        <div className="flex h-11 items-center rounded-full border border-line-strong" role="group" aria-label={`Cantidad de ${product.name}`}>
                          <button onClick={() => cart.setQty(product.slug, qty - 1)} disabled={qty <= 1} aria-label="Quitar una unidad" className="grid size-10 place-items-center rounded-full text-[20px] hover:bg-ink-800/8 disabled:opacity-30">−</button>
                          <output className="w-7 text-center font-display text-[16px] font-medium">{qty}</output>
                          <button onClick={() => cart.setQty(product.slug, qty + 1)} aria-label="Añadir una unidad" className="grid size-10 place-items-center rounded-full text-[20px] hover:bg-ink-800/8">+</button>
                        </div>
                        <AnimatePresence mode="popLayout" initial={false}>
                          <m.p key={qty} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="w-28 text-right font-display text-[22px] font-medium tracking-tight">
                            {money(product.price * qty)}
                          </m.p>
                        </AnimatePresence>
                      </div>
                    </m.li>
                  ))}
                </AnimatePresence>
              </ul>

              <label className={`mt-6 flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-colors ${cart.gift ? "border-ink-800 bg-dew-100" : "border-dashed border-leaf-600/60 bg-dew-100/60 hover:bg-dew-100"}`}>
                <input type="checkbox" checked={cart.gift} onChange={(e) => cart.setGift(e.target.checked)} className="mt-1.5 size-5 accent-ink-800" />
                <span className="flex-1">
                  <span className="block font-display text-[18px] font-medium">Envolver para regalo</span>
                  <span className="block text-[16px] text-muted">Caja magnética, papel de semillas y tarjeta escrita a mano.</span>
                </span>
                <span className="font-display text-[16px] font-medium">+{money(2500)}</span>
              </label>

              <Link href="/tienda" className="mt-8 inline-block font-display text-[16px] font-medium underline underline-offset-4">Seguir comprando</Link>
            </div>

            <aside className="h-fit rounded-3xl bg-ink-800 p-8 text-dew-50 lg:sticky lg:top-36 lg:max-h-[calc(100svh-10rem)] lg:overflow-y-auto" aria-label="Resumen del pedido">
              <h2 className="text-[28px]">Resumen del pedido</h2>
              <dl className="mt-6 grid gap-3 text-[18px]">
                <div className="flex justify-between"><dt className="text-dew-200/70">Subtotal</dt><dd className="font-display font-medium">{money(cart.subtotal)}</dd></div>
                {cart.giftPrice > 0 && <div className="flex justify-between"><dt className="text-dew-200/70">Envoltorio de regalo</dt><dd className="font-display font-medium">{money(cart.giftPrice)}</dd></div>}
                <div className="flex justify-between"><dt className="text-dew-200/70">Envío</dt><dd className="font-display font-medium">Se calcula al pagar</dd></div>
              </dl>
              <div className="mt-6 flex items-baseline justify-between border-t border-white/15 pt-5">
                <span className="font-display text-[20px] font-medium">Total</span>
                <span className="font-display text-[38px] font-medium tracking-[-0.04em]">{money(cart.total)}</span>
              </div>
              <ButtonLink href="/checkout" variant="accent" size="lg" className="mt-6 w-full">Ir a pagar</ButtonLink>
              <ul className="mt-6 grid gap-2 text-[15px] text-dew-200/80">
                {["Pago por transferencia, Yape o Plin", "Entrega en Lima Metropolitana y Callao", "Te respondemos por correo ante cualquier duda"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-leaf-400" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
                    {t}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
