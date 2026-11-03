"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import { useCart } from "@/components/cart/CartProvider";
import { ProductArt } from "@/components/product/ProductArt";
import { CheckoutSteps } from "@/components/site/CheckoutSteps";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { api } from "@/lib/api";
import { regions, shippingCost, shippingOptions, validateAddress, validateContact, type Errors, type ShippingMethod } from "@/lib/checkout";
import { openCulqi } from "@/lib/culqi";
import { money } from "@/lib/products";

type Payment = "culqi" | "transfer";
type Pending = { id: string; token: string; publicKey: string; total: number; sig: string };

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

function CheckoutForm() {
  const router = useRouter();
  const cart = useCart();
  const account = useAccount();
  const form = useRef<HTMLFormElement>(null);

  const [email, setEmail] = useState(account.user?.email ?? "");
  const [addr, setAddr] = useState({
    name: account.user?.name.split(" ")[0] ?? "",
    lastName: account.user?.name.split(" ").slice(1).join(" ") ?? "",
    line: "",
    region: "",
    comuna: "",
    phone: "",
  });
  // Cuando carga la sesión, se llenan los datos guardados en el perfil (solo los campos vacíos)
  const profile = account.user;
  const prefilled = useRef(false);
  useEffect(() => {
    if (!profile || prefilled.current) return;
    prefilled.current = true;
    setEmail((v) => v || profile.email);
    setAddr((a) => ({
      name: a.name || profile.name.split(" ")[0],
      lastName: a.lastName || profile.name.split(" ").slice(1).join(" "),
      line: a.line || profile.addressLine || "",
      region: a.region || profile.region || "",
      comuna: a.comuna || profile.district || "",
      phone: a.phone || profile.phone || "",
    }));
  }, [profile]);

  const [shipping, setShipping] = useState<ShippingMethod>("standard");
  const [payment, setPayment] = useState<Payment>("transfer");
  // Tarjeta o Yape solo aparece cuando la API tiene Culqi configurado
  const [culqiOn, setCulqiOn] = useState(false);
  useEffect(() => {
    void api<{ culqi: boolean }>("/api/payments/config").then((r) => {
      if (r.ok && r.data.culqi) {
        setCulqiOn(true);
        setPayment("culqi");
      }
    });
  }, []);
  // Pedido ya creado y pendiente de pago: permite reintentar sin crear otro
  const [pendingOrder, setPendingOrder] = useState<Pending | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const shippingPrice = shippingCost(shipping);
  const total = cart.subtotal + cart.giftPrice + shippingPrice;
  // El pedido pendiente solo se reutiliza si nada cambió desde que se creó (productos, envío, datos)
  const sig = JSON.stringify([email.trim(), shipping, addr, cart.gift, cart.items.map(({ product, qty }) => [product.slug, qty])]);
  const pending = pendingOrder && pendingOrder.sig === sig ? pendingOrder : null;

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

    if (payment === "culqi" && pending) {
      void pay(pending);
      return;
    }

    setBusy(true);
    // Solo se envían qué productos y cuántos: los precios y el stock los calcula el servidor
    const r = await api<{ id: string; token: string; total?: number; culqi?: { publicKey: string } }>("/api/orders", {
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
    if (r.data.culqi) {
      const p: Pending = { id: r.data.id, token: r.data.token, publicKey: r.data.culqi.publicKey, total: r.data.total ?? total, sig };
      setPendingOrder(p);
      void pay(p);
      return;
    }
    router.push(`/pedido/${r.data.id}?t=${r.data.token}&pago=transferencia`);
  }

  /** Abre el pago seguro de Culqi; con el token que entrega, la API cobra el pedido. */
  async function pay(p: Pending) {
    setBusy(true);
    setFormError("");
    try {
      await openCulqi({
        publicKey: p.publicKey,
        total: p.total,
        email: email.trim(),
        firstName: addr.name.trim(),
        lastName: addr.lastName.trim(),
        onToken: async (tokenId) => {
          setBusy(true);
          const r = await api("/api/payments/culqi/charge", { body: { orderId: p.id, token: p.token, tokenId } });
          if (!r.ok) {
            setBusy(false);
            setFormError(r.error);
            return;
          }
          router.push(`/pedido/${p.id}?t=${p.token}&pago=ok`);
        },
        onError: (message) => {
          setBusy(false);
          setFormError(message);
        },
      });
      // El pago seguro se abrió: se vuelve a habilitar el botón por si la persona cierra la ventana
      setBusy(false);
    } catch (e) {
      setBusy(false);
      setFormError(e instanceof Error ? e.message : "No pudimos abrir el pago seguro.");
    }
  }

  const set = (k: keyof typeof addr) => (e: { target: { value: string } }) => setAddr((a) => ({ ...a, [k]: e.target.value }));

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 pb-16 pt-36 sm:pb-24 sm:pt-48 lg:px-20">
        <h1 className="text-[clamp(30px,6vw,80px)] font-semibold tracking-[-0.04em]">No hay nada que pagar</h1>
        <p className="mt-4 max-w-[46ch] text-[20px] text-muted">Tu carrito está vacío. Añade un producto para continuar con el pago.</p>
        <ButtonLink href="/tienda" size="lg" className="mt-8">Explorar la tienda</ButtonLink>
      </div>
    );
  }

  return (
    <>
      <header className="bg-dawn grain pb-10 pt-36 sm:pb-12 sm:pt-44">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-20">
          <h1 className="text-[clamp(34px,6vw,88px)] font-semibold tracking-[-0.04em]">Finalizar compra</h1>
          <p className="mt-3 text-[20px] italic text-muted">
            {account.user ? `Hola, ${account.user.name.split(" ")[0]}.` : <>¿Ya tienes cuenta? <Link href="/cuenta/ingresar" className="text-ink-900 underline underline-offset-4">Ingresa</Link> para llenar tus datos más rápido.</>}
          </p>
          <CheckoutSteps current={1} />
        </div>
      </header>

      <form ref={form} onSubmit={submit} noValidate className="mx-auto grid max-w-[1440px] gap-14 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-20">
        <div className="grid gap-12">
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
            <div role="radiogroup" aria-label="Forma de pago" className="grid gap-3">
              {culqiOn && (
                <label className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${payment === "culqi" ? "border-ink-800 bg-dew-100 ring-1 ring-ink-800" : "border-line hover:border-line-strong"}`}>
                  <input type="radio" name="payment" checked={payment === "culqi"} onChange={() => setPayment("culqi")} className="size-5 accent-ink-800" />
                  <span className="flex-1">
                    <span className="block font-display text-[17px] font-medium">Tarjeta o Yape</span>
                    <span className="block text-[15px] italic text-faint">Visa, Mastercard, American Express, Diners y Yape. Pago inmediato y seguro con Culqi.</span>
                  </span>
                </label>
              )}
              <label className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${payment === "transfer" ? "border-ink-800 bg-dew-100 ring-1 ring-ink-800" : "border-line hover:border-line-strong"}`}>
                <input type="radio" name="payment" checked={payment === "transfer"} onChange={() => setPayment("transfer")} className="size-5 accent-ink-800" />
                <span className="flex-1">
                  <span className="block font-display text-[17px] font-medium">Transferencia, Yape o Plin</span>
                  <span className="block text-[15px] italic text-faint">Preparamos tu pedido cuando recibimos el pago</span>
                </span>
              </label>
            </div>
            <p className="rounded-lg bg-dew-100 p-4 text-[17px] text-muted">
              {payment === "culqi"
                ? "Pagas en una ventana segura de Culqi. Tus datos de tarjeta no pasan por nuestro sitio."
                : "Al confirmar te mostramos los datos para pagar y te los enviamos por correo. Escribe el número de pedido al hacer el pago."}
            </p>
          </Section>

          {formError && <p role="alert" className="rounded-md bg-peach-100 px-4 py-3 text-[17px] text-danger">{formError}</p>}
          <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-fit sm:min-w-72">
            {busy ? (payment === "culqi" ? "Procesando tu pago…" : "Procesando tu pedido…") : payment === "culqi" ? (pending ? `Reintentar el pago de ${money(total)}` : `Pagar ${money(total)}`) : `Confirmar pedido por ${money(total)}`}
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

    </>
  );
}

export default function CheckoutPage() {
  const { ready } = useAccount();
  if (!ready) return <div className="min-h-[60vh]" aria-busy="true" />;
  return <CheckoutForm />;
}
