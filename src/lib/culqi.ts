/**
 * Checkout de Culqi (tarjeta y Yape) en el navegador. Culqi captura los datos de la tarjeta en su
 * propia ventana y entrega un token de un solo uso: el número de la tarjeta nunca pasa por nuestro
 * sitio. El token se manda a la API, que cobra con la llave secreta.
 */
type CulqiInstance = {
  token?: { id: string };
  order?: unknown;
  error?: { user_message?: string; merchant_message?: string };
  culqi?: () => void;
  open: () => void;
  close: () => void;
};
type CulqiCtor = new (publicKey: string, config: unknown) => CulqiInstance;

declare global {
  interface Window {
    CulqiCheckout?: CulqiCtor;
  }
}

const SCRIPT = "https://js.culqi.com/checkout-js";
let loading: Promise<CulqiCtor> | null = null;

function load(): Promise<CulqiCtor> {
  if (window.CulqiCheckout) return Promise.resolve(window.CulqiCheckout);
  loading ??= new Promise<CulqiCtor>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => (window.CulqiCheckout ? resolve(window.CulqiCheckout) : reject(new Error("Culqi no cargó")));
    s.onerror = () => {
      loading = null;
      reject(new Error("No pudimos cargar el pago seguro. Revisa tu conexión e inténtalo de nuevo."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export type CulqiOpen = {
  publicKey: string;
  /** Orden de Culqi (ord_…): con ella el checkout agrega el QR de billeteras móviles. */
  order?: string;
  /** Total en soles enteros. */
  total: number;
  email: string;
  firstName: string;
  lastName: string;
  /** Se llama con el token cuando la persona completó los datos de su tarjeta o su código de Yape. */
  onToken: (tokenId: string) => void;
  onError: (message: string) => void;
};

/** Abre el checkout y devuelve un control para cerrarlo (por ejemplo cuando el pago con QR ya se confirmó). */
export async function openCulqi(o: CulqiOpen): Promise<{ close: () => void }> {
  const Culqi = await load();
  const methods = { tarjeta: true, yape: true, billetera: Boolean(o.order), bancaMovil: false, agente: false, cuotealo: false };
  const instance = new Culqi(o.publicKey, {
    settings: { title: "Alba Pura", currency: "PEN", amount: o.total * 100, ...(o.order ? { order: o.order } : {}) }, // Culqi usa céntimos
    client: { email: o.email, firstName: o.firstName, lastName: o.lastName },
    options: { lang: "es", installments: false, modal: true, paymentMethods: methods, paymentMethodsSort: Object.keys(methods) },
    appearance: {
      theme: "default",
      hiddenCulqiLogo: false,
      defaultStyle: { bannerColor: "#0e2a1b", buttonBackground: "#0e2a1b", menuColor: "#456243", linksColor: "#456243", buttonTextColor: "#f7faf3", priceColor: "#0e2a1b" },
    },
  });
  instance.culqi = () => {
    if (instance.token) {
      const id = instance.token.id;
      instance.close();
      o.onToken(id);
    } else if (instance.order) {
      // Con el QR de billeteras la ventana debe seguir abierta: el pago se confirma aparte (ver la consulta del checkout)
    } else if (instance.error) {
      o.onError(instance.error.user_message || "No pudimos procesar los datos. Revisa la tarjeta o el código de Yape.");
    }
  };
  instance.open();
  return { close: () => instance.close() };
}
