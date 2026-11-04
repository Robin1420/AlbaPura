"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { WhatsAppOrderButton } from "@/components/cart/WhatsAppButtons";
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

type Pending = { id: string; token: string; publicKey: string; culqiOrder: string | null; total: number; sig: string };

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-5 border-t border-ink-800 pt-6">
      <legend className="float-left mb-5 flex w-full items-baseline gap-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-800 font-display text-[14px] font-semibold text-dew-50">{n}</span>
        <span data-step-title tabIndex={-1} className="font-display text-[26px] font-medium tracking-[-0.02em] outline-none">{title}</span>
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
  // Culqi (tarjeta y Yape) es la única forma de pago. Hasta que la API lo tenga configurado, se ofrece pedir por WhatsApp.
  const [culqiOn, setCulqiOn] = useState<boolean | null>(null);
  useEffect(() => {
    void api<{ culqi: boolean }>("/api/payments/config").then((r) => setCulqiOn(r.ok && r.data.culqi));
  }, []);
  // Forma de pago: tarjeta o Yape (ventana de Culqi) o QR de billetera móvil (se muestra en esta página)
  const [method, setMethod] = useState<"card" | "qr">("card");
  const [qr, setQr] = useState<{ orderId: string; image: string; code: string | null } | null>(null);
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
  const qrActive = qr && pending && qr.orderId === pending.id ? qr : null;
  // Las billeteras móviles (QR) solo aceptan montos de S/ 6 a S/ 500
  const qrAllowed = total >= 6 && total <= 500;

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Cada intento de pago tiene un número: al cambiar, la consulta del intento anterior se detiene
  const attemptRef = useRef(0);
  useEffect(() => {
    const ref = attemptRef;
    return () => {
      ref.current += 1;
    };
  }, []);

  function validateStep(s: 1 | 2): Errors {
    if (s === 1) return validateContact(email);
    if (shipping !== "pickup") return validateAddress(addr);
    const e: Errors = {};
    if (addr.name.trim().length < 2) e.name = "Escribe tu nombre.";
    if (addr.phone.replace(/\D/g, "").length < 8) e.phone = "Escribe un teléfono de al menos 8 dígitos.";
    return e;
  }

  function goTo(next: 1 | 2 | 3) {
    setFormError("");
    setStep(next);
  }

  // Al cambiar de paso se sube al inicio del formulario y el foco va al título del paso
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    form.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    form.current?.querySelector<HTMLElement>("[data-step-title]")?.focus({ preventScroll: true });
  }, [step]);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError("");
    // Pasos 1 y 2: se valida lo de ese paso y se avanza
    if (step !== 3) {
      const e = validateStep(step);
      setErrors(e);
      const first = Object.keys(e)[0];
      if (first) {
        form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        return;
      }
      goTo((step + 1) as 2 | 3);
      return;
    }

    // Paso 3: se revisa todo otra vez antes de crear el pedido
    const e: Errors = { ...validateStep(1), ...validateStep(2) };
    if (Object.keys(e).length) {
      setErrors(e);
      goTo(e.email ? 1 : 2);
      return;
    }

    // Se reutiliza el pedido pendiente, salvo que se pida QR y ese pedido no tenga orden de Culqi: entonces se crea uno nuevo
    if (pending && !(method === "qr" && !pending.culqiOrder)) {
      void go(pending);
      return;
    }

    setBusy(true);
    // Solo se envían qué productos y cuántos: los precios y el stock los calcula el servidor
    const r = await api<{ id: string; token: string; total?: number; culqi?: { publicKey: string; order: string | null } }>("/api/orders", {
      body: {
        email: email.trim(),
        items: cart.items.map(({ product, qty }) => ({ slug: product.slug, qty })),
        gift: cart.gift,
        shippingMethod: shipping,
        payment: "culqi",
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
    if (!r.data.culqi) {
      setBusy(false);
      setFormError("No pudimos iniciar el pago. Inténtalo de nuevo o escríbenos por WhatsApp.");
      return;
    }
    const p: Pending = { id: r.data.id, token: r.data.token, publicKey: r.data.culqi.publicKey, culqiOrder: r.data.culqi.order, total: r.data.total ?? total, sig };
    setPendingOrder(p);
    void go(p);
  }

  const go = (p: Pending) => (method === "qr" ? showQr(p) : pay(p));

  /** Pide a la API el QR de pago y empieza a esperar que el cliente lo escanee y pague. */
  async function showQr(p: Pending) {
    setFormError("");
    if (!p.culqiOrder) {
      setBusy(false);
      setFormError("El pago con QR no está disponible ahora. Paga con tarjeta o Yape.");
      return;
    }
    setBusy(true);
    const attempt = ++attemptRef.current;
    const r = await api<{ qr: string; code: string | null }>("/api/payments/culqi/qr", { body: { orderId: p.id, token: p.token } });
    setBusy(false);
    if (!r.ok) {
      setFormError(r.error);
      return;
    }
    setQr({ orderId: p.id, image: r.data.qr, code: r.data.code });
    void watchQr(p, null, attempt);
  }

  /** Mientras el cliente paga con el QR, se le pregunta a la API (y ella a Culqi) si el pago ya llegó. */
  async function watchQr(p: Pending, handle: { close: () => void } | null, attempt: number) {
    const until = Date.now() + 20 * 60_000;
    while (attemptRef.current === attempt && Date.now() < until) {
      await new Promise((r) => setTimeout(r, 4000));
      if (attemptRef.current !== attempt) return;
      const r = await api<{ status: string }>("/api/payments/culqi/sync", { body: { orderId: p.id, token: p.token } });
      if (!r.ok) continue;
      if (r.data.status === "paid") {
        attemptRef.current += 1;
        handle?.close();
        router.push(`/pedido/${p.id}?t=${p.token}&pago=ok`);
        return;
      }
      if (r.data.status === "expired" || r.data.status === "closed") return;
    }
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
          attemptRef.current += 1; // pago con tarjeta o Yape: ya no hace falta consultar el QR
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
          <CheckoutSteps current={step - 1} steps={["Contacto", "Envío", "Pago"]} />
        </div>
      </header>

      <form ref={form} onSubmit={submit} noValidate className="mx-auto grid scroll-mt-32 max-w-[1440px] gap-14 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-20">
        <div className="grid gap-12">
          {step === 1 && (
          <Section n={1} title="Contacto">
            <Field label="Correo electrónico" name="email" type="email" autoComplete="email" placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} hint="Te enviaremos aquí la confirmación del pedido." />
          </Section>
          )}

          {step === 2 && (
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
          )}

          {step === 3 && (
          <Section n={3} title="Pago">
            <dl className="grid gap-4 rounded-lg border border-line p-4 text-[16px]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0"><dt className="italic text-faint">Contacto</dt><dd className="break-all font-display font-medium">{email.trim()}</dd></div>
                <button type="button" onClick={() => goTo(1)} className="shrink-0 font-display text-[14px] font-medium text-leaf-600 underline underline-offset-4">Cambiar</button>
              </div>
              <div className="flex items-start justify-between gap-4 border-t border-line pt-4">
                <div className="min-w-0">
                  <dt className="italic text-faint">Envío</dt>
                  <dd className="font-display font-medium">{shippingOptions.find((o) => o.id === shipping)?.name}</dd>
                  <dd className="text-muted">{shipping === "pickup" ? addr.name : `${addr.name} ${addr.lastName}, ${addr.line}, ${addr.comuna}`} · {addr.phone}</dd>
                </div>
                <button type="button" onClick={() => goTo(2)} className="shrink-0 font-display text-[14px] font-medium text-leaf-600 underline underline-offset-4">Cambiar</button>
              </div>
            </dl>
            {culqiOn === false ? (
              <div className="grid gap-4 rounded-lg bg-dew-100 p-5">
                <p className="font-display text-[19px] font-medium">El pago en línea estará disponible muy pronto.</p>
                <p className="text-[17px] text-muted">Mientras tanto, envíanos tu pedido por WhatsApp y te ayudamos a completarlo.</p>
                <WhatsAppOrderButton className="w-full sm:w-fit" />
              </div>
            ) : (
              <>
                {qrActive ? (
                  <div className="grid justify-items-center gap-5 rounded-lg border border-ink-800 bg-dew-100 p-5 text-center ring-1 ring-ink-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrActive.image} alt="Código QR para pagar el pedido" width={220} height={220} className="mx-auto size-[220px] rounded-md bg-white p-2" />
                    <div className="grid justify-items-center gap-2">
                      <p className="font-display text-[20px] font-medium">Escanea y paga {money(pending?.total ?? total)}</p>
                      <p className="text-[16px] text-muted">Abre Yape, Plin u otra billetera móvil, elige pagar con QR y escanea este código.</p>
                      {qrActive.code && <p className="text-[15px] text-muted">Código de pago: <span className="font-display font-medium text-ink-900">{qrActive.code}</span></p>}
                      <p role="status" className="mt-1 flex items-center gap-2 text-[15px] italic text-faint">
                        <span className="size-2.5 animate-pulse rounded-full bg-leaf-500" aria-hidden="true" />
                        Esperando tu pago… esta página se actualiza sola.
                      </p>
                      <button type="button" onClick={() => setQr(null)} className="w-fit font-display text-[14px] font-medium text-leaf-600 underline underline-offset-4">Elegir otra forma de pago</button>
                    </div>
                  </div>
                ) : (
                  <div role="radiogroup" aria-label="Forma de pago" className="grid gap-3">
                    <label className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${method === "card" ? "border-ink-800 bg-dew-100 ring-1 ring-ink-800" : "border-line hover:border-line-strong"}`}>
                      <input type="radio" name="method" checked={method === "card"} onChange={() => setMethod("card")} className="size-5 accent-ink-800" />
                      <span className="flex-1">
                        <span className="block font-display text-[17px] font-medium">Tarjeta o Yape</span>
                        <span className="block text-[15px] italic text-faint">Visa, Mastercard, American Express, Diners o Yape con tu código. Pago inmediato.</span>
                      </span>
                    </label>
                    {qrAllowed && (
                      <label className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${method === "qr" ? "border-ink-800 bg-dew-100 ring-1 ring-ink-800" : "border-line hover:border-line-strong"}`}>
                        <input type="radio" name="method" checked={method === "qr"} onChange={() => setMethod("qr")} className="size-5 accent-ink-800" />
                        <span className="flex-1">
                          <span className="block font-display text-[17px] font-medium">QR de billetera móvil</span>
                          <span className="block text-[15px] italic text-faint">Escanea con Yape, Plin, BBVA, Scotiabank y otras billeteras.</span>
                        </span>
                      </label>
                    )}
                  </div>
                )}
                <p className="rounded-lg bg-dew-100 p-4 text-[17px] text-muted">Pagas de forma segura con Culqi. Los datos de tu tarjeta no pasan por nuestro sitio.</p>
              </>
            )}
          </Section>
          )}

          {formError && <p role="alert" className="rounded-md bg-peach-100 px-4 py-3 text-[17px] text-danger">{formError}</p>}
          <div className="flex flex-wrap items-center gap-3">
            {step > 1 && <Button type="button" variant="ghost" size="lg" onClick={() => goTo((step - 1) as 1 | 2)} disabled={busy}>Atrás</Button>}
            {step < 3 && <Button type="submit" size="lg" className="w-full sm:w-fit sm:min-w-56">Continuar</Button>}
            {step === 3 && culqiOn !== false && !qrActive && (
              <Button type="submit" size="lg" disabled={busy || culqiOn === null} className="w-full sm:w-fit sm:min-w-72">
                {busy ? "Procesando tu pago…" : method === "qr" ? "Generar QR de pago" : pending ? `Reintentar el pago de ${money(total)}` : `Pagar ${money(total)}`}
              </Button>
            )}
          </div>
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
