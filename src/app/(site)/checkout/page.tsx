"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import { useCart } from "@/components/cart/CartProvider";
import { ProductArt } from "@/components/product/ProductArt";
import { CheckoutSteps } from "@/components/site/CheckoutSteps";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { api } from "@/lib/api";
import { regions, shippingCost, shippingOptions, validateAddress, validateContact, type Errors, type ShippingMethod } from "@/lib/checkout";
import { money } from "@/lib/products";

type Payment = "webpay" | "transfer";

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-5 border-t border-ink-800 pt-6">
      <legend className="float-left mb-5 flex w-full items-baseline gap-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-800 font-display text-[14px] font-semibold text-dew-50">{n}</span>
        <span className="font-display text-[26px] font-medium tracking-[-0.02em]">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

/** Mensaje cuando el cliente vuelve de Webpay sin completar el pago. */
function PaymentNotice() {
  const pago = useSearchParams().get("pago");
  if (!pago) return null;
  const msg = pago === "anulado" ? "Anulaste el pago en Webpay. Tu carrito sigue intacto; puedes intentarlo de nuevo." : "No pudimos completar el pago. Tu carrito sigue intacto; inténtalo de nuevo.";
  return <p role="alert" className="rounded-md bg-peach-100 px-4 py-3 text-[17px] text-danger">{msg}</p>;
}

function CheckoutForm() {
  const router = useRouter();
  const cart = useCart();
  const account = useAccount();
  const form = useRef<HTMLFormElement>(null);
  const webpayForm = useRef<HTMLFormElement>(null);

  const [email, setEmail] = useState(account.user?.email ?? "");
  const [addr, setAddr] = useState({
    name: account.user?.name.split(" ")[0] ?? "",
    lastName: account.user?.name.split(" ").slice(1).join(" ") ?? "",
    line: "",
    region: "",
    comuna: "",
    phone: "",
  });
  const [shipping, setShipping] = useState<ShippingMethod>("standard");
  const [payment] = useState<Payment>("transfer");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wp, setWp] = useState<{ url: string; token: string } | null>(null);

  const shippingPrice = shippingCost(shipping);
  const total = cart.subtotal + cart.giftPrice + shippingPrice;

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError("");
    const e: Errors = { ...validateContact(email), ...(shipping === "pickup" ? {} : validateAddress(addr)) };
    if (shipping === "pickup") {
      if (addr.name.trim().length < 2) e.name = "Escribe tu nombre.";
      if (addr.phone.replace(/\D/g, "").length < 8) e.phone = "Escribe un teléfono de al menos 8 dígitos.";
    }
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setBusy(true);
    // Solo se envían qué productos y cuántos: los precios y el stock los calcula el servidor
    const r = await api<{ id: string; token: string; webpay?: { url: string; token: string } }>("/api/orders", {
      body: {
        email: email.trim(),
        items: cart.items.map(({ product, qty }) => ({ slug: product.slug, qty })),
        gift: cart.gift,
        shippingMethod: shipping,
        payment,
        address: addr,
      },
    });
    if (!r.ok) {
      setBusy(false);
      setErrors(r.fields);
      setFormError(r.error);
      const f = Object.keys(r.fields)[0];
      if (f) form.current?.querySelector<HTMLElement>(`[name="${f}"]`)?.focus();
      return;
    }
    if (r.data.webpay) {
      // Webpay exige un POST con token_ws; se envía un formulario oculto
      setWp(r.data.webpay);
      setTimeout(() => webpayForm.current?.submit(), 0);
      return;
    }
    router.push(`/pedido/${r.data.id}?t=${r.data.token}&pago=transferencia`);
  }

  const set = (k: keyof typeof addr) => (e: { target: { value: string } }) => setAddr((a) => ({ ...a, [k]: e.target.value }));

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 pb-24 pt-48 lg:px-20">
        <h1 className="text-[clamp(40px,6vw,80px)] font-semibold tracking-[-0.04em]">No hay nada que pagar</h1>
        <p className="mt-4 max-w-[46ch] text-[20px] text-muted">Tu carrito está vacío. Añade un producto para continuar con el pago.</p>
        <ButtonLink href="/tienda" size="lg" className="mt-8">Explorar la tienda</ButtonLink>
      </div>
    );
  }

  return (
    <>
      <header className="bg-dawn grain pb-12 pt-44">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-20">
          <h1 className="text-[clamp(44px,6vw,88px)] font-semibold tracking-[-0.04em]">Finalizar compra</h1>
          <p className="mt-3 text-[20px] italic text-muted">
            {account.user ? `Hola, ${account.user.name.split(" ")[0]}.` : <>¿Ya tienes cuenta? <Link href="/cuenta/ingresar" className="text-ink-900 underline underline-offset-4">Ingresa</Link> para llenar tus datos más rápido.</>}
          </p>
          <CheckoutSteps current={1} />
        </div>
      </header>

      <form ref={form} onSubmit={submit} noValidate className="mx-auto grid max-w-[1440px] gap-14 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-20">
        <div className="grid gap-12">
          <Suspense fallback={null}><PaymentNotice /></Suspense>

          <Section n={1} title="Contacto">
            <Field label="Correo electrónico" name="email" type="email" autoComplete="email" placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} hint="Te enviaremos aquí la confirmación del pedido." />
          </Section>

          <Section n={2} title="Envío">
            <div role="radiogroup" aria-label="Método de envío" className="grid gap-3">
              {shippingOptions.map((o) => {
                const price = shippingCost(o.id);
                const on = shipping === o.id;
                return (
                  <label key={o.id} className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${on ? "border-ink-800 bg-dew-100 ring-1 ring-ink-800" : "border-line hover:border-line-strong"}`}>
                    <input type="radio" name="shipping" checked={on} onChange={() => setShipping(o.id)} className="size-5 accent-ink-800" />
                    <span className="flex-1">
                      <span className="block font-display text-[17px] font-medium">{o.name}</span>
                      <span className="block text-[15px] italic text-faint">{o.eta}</span>
                    </span>
                    <span className="font-display text-[16px] font-medium">{price === 0 ? "Gratis" : money(price)}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" name="name" autoComplete="given-name" value={addr.name} onChange={set("name")} error={errors.name} />
              {shipping !== "pickup" && <Field label="Apellido" name="lastName" autoComplete="family-name" value={addr.lastName} onChange={set("lastName")} error={errors.lastName} />}
              {shipping !== "pickup" && (
                <>
                  <Field label="Dirección" name="line" autoComplete="street-address" className="sm:col-span-2" placeholder="Av. Los Aromos 1234, depto 56" value={addr.line} onChange={set("line")} error={errors.line} />
                  <div className="grid gap-1.5">
                    <label htmlFor="region" className="font-display text-[14px] font-medium">Zona</label>
                    <select id="region" name="region" value={addr.region} onChange={set("region")} aria-invalid={!!errors.region} className={`h-12 rounded-md border bg-white px-3 font-text text-[17px] ${errors.region ? "border-danger" : "border-line-strong/60"}`}>
                      <option value="">Elige una zona</option>
                      {regions.map((r) => <option key={r}>{r}</option>)}
                    </select>
                    {errors.region && <p className="text-[14px] text-danger">{errors.region}</p>}
                  </div>
                  <Field label="Distrito" name="comuna" autoComplete="address-level2" value={addr.comuna} onChange={set("comuna")} error={errors.comuna} />
                </>
              )}
              <Field label="Teléfono" name="phone" type="tel" autoComplete="tel" placeholder="987 654 321" value={addr.phone} onChange={set("phone")} error={errors.phone} />
            </div>
          </Section>

          <Section n={3} title="Pago">
            <div className="rounded-lg border border-ink-800 bg-dew-100 p-4 ring-1 ring-ink-800">
              <span className="block font-display text-[17px] font-medium">Transferencia, Yape o Plin</span>
              <span className="block text-[15px] italic text-faint">Preparamos tu pedido cuando recibimos el pago</span>
            </div>
            <p className="rounded-lg bg-dew-100 p-4 text-[17px] text-muted">
              Al confirmar te mostramos los datos para pagar y te los enviamos por correo. Escribe el número de pedido al hacer el pago.
            </p>
          </Section>

          {formError && <p role="alert" className="rounded-md bg-peach-100 px-4 py-3 text-[17px] text-danger">{formError}</p>}
          <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-fit sm:min-w-72">
            {busy ? "Procesando tu pedido…" : payment === "webpay" ? `Ir a pagar ${money(total)}` : `Confirmar pedido por ${money(total)}`}
          </Button>
          <p className="flex items-center gap-2 text-[15px] italic text-faint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            Tus datos viajan cifrados. <Link href="/carrito" className="not-italic underline underline-offset-4">Volver al carrito</Link>
          </p>
        </div>

        <aside className="h-fit rounded-3xl bg-ink-800 p-8 text-dew-50 lg:sticky lg:top-36 lg:max-h-[calc(100svh-10rem)] lg:overflow-y-auto" aria-label="Tu pedido">
          <h2 className="text-[28px]">Tu pedido</h2>
          <ul className="mt-6 grid gap-4">
            {cart.items.map(({ product, qty }) => (
              <li key={product.slug} className="flex items-center gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-t-[999px] rounded-b-md bg-dew-100"><ProductArt product={product} sizes="64px" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[16px] font-medium leading-tight">{product.name}</p>
                  <p className="text-[14px] italic text-dew-200/60">{product.meta}, × {qty}</p>
                </div>
                <p className="font-display text-[16px] font-medium">{money(product.price * qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 grid gap-2.5 border-t border-white/15 pt-5 text-[17px]">
            <div className="flex justify-between"><dt className="text-dew-200/70">Subtotal</dt><dd className="font-display font-medium">{money(cart.subtotal)}</dd></div>
            {cart.giftPrice > 0 && <div className="flex justify-between"><dt className="text-dew-200/70">Envoltorio de regalo</dt><dd className="font-display font-medium">{money(cart.giftPrice)}</dd></div>}
            <div className="flex justify-between"><dt className="text-dew-200/70">Envío</dt><dd className="font-display font-medium">{shippingPrice === 0 ? "Gratis" : money(shippingPrice)}</dd></div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-white/15 pt-5">
            <span className="font-display text-[20px] font-medium">Total</span>
            <span className="font-display text-[36px] font-medium tracking-[-0.04em]">{money(total)}</span>
          </div>
          <p className="mt-3 text-[14px] italic text-dew-200/60">Impuestos incluidos. Devolución gratis dentro de 30 días. El total final lo confirma el servidor.</p>
        </aside>
      </form>

      {wp && (
        <form ref={webpayForm} action={wp.url} method="POST" className="hidden">
          <input type="hidden" name="token_ws" value={wp.token} />
        </form>
      )}
    </>
  );
}

export default function CheckoutPage() {
  const { ready } = useAccount();
  if (!ready) return <div className="min-h-[60vh]" aria-busy="true" />;
  return <CheckoutForm />;
}
