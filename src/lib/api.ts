export type Address = { name: string; lastName: string; line: string; region: string; comuna: string; phone: string };

export type ApiOrder = {
  id: string;
  date: string;
  items: { slug: string; name: string; meta: string; qty: number; price: number }[];
  subtotal: number;
  shipping: number;
  gift: number;
  total: number;
  shippingMethod: "standard" | "express" | "pickup";
  payment: "webpay" | "transfer";
  email: string;
  address: Address;
  status: "pending_payment" | "awaiting_transfer" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled" | "failed";
  statusLabel: string;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; fields: Record<string, string> };

/** Llama a la API del sitio y normaliza los errores para mostrarlos en los formularios. */
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: init?.method ?? (init?.body ? "POST" : "GET"),
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? "Algo salió mal. Inténtalo de nuevo.", fields: data.fields ?? {} };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "No pudimos conectar con el servidor. Revisa tu conexión.", fields: {} };
  }
}
