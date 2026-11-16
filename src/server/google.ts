import { createHash, randomBytes } from "node:crypto";

/**
 * Inicio de sesión con Google (OAuth 2.0 con código + PKCE). El usuario vuelve a la tienda, que
 * reenvía /api/* a esta API, así la cookie de sesión queda en el mismo sitio.
 */
export const OAUTH_COOKIE = "alba_oauth";

const sha256 = (s: string) => createHash("sha256").update(s).digest("base64url");

export function newPkce() {
  const verifier = randomBytes(32).toString("base64url");
  return { state: randomBytes(16).toString("base64url"), verifier, challenge: sha256(verifier) };
}

/** Dirección pública desde la que llegó el navegador (la tienda), o APP_URL si no se puede saber. */
export function publicOrigin(req: Request) {
  const host = req.headers.get("x-forwarded-host");
  if (host) return `${/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https"}://${host}`;
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export const redirectUri = (req: Request) => `${publicOrigin(req)}/api/auth/google/callback`;

/** Solo rutas internas: evita que /start?next=https://otro-sitio sirva de redirección abierta. */
export function safeNext(next: string | null) {
  return next && /^\/(?!\/)[^\\\s]*$/.test(next) ? next : "/cuenta";
}

export type GoogleProfile = { sub: string; email: string; name: string; picture: string | null };

type IdToken = { iss: string; aud: string; exp: number; sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string };

/**
 * Cambia el código por los datos de la persona. El id_token llega directo del servidor de Google
 * por HTTPS, así que basta con comprobar emisor, destinatario, vigencia y correo verificado.
 */
export async function exchangeCode(code: string, verifier: string, redirect: string): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET.");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: secret, redirect_uri: redirect, grant_type: "authorization_code", code_verifier: verifier }),
  });
  if (!res.ok) throw new Error(`Google respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("Google no devolvió id_token.");

  const t = JSON.parse(atob(id_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as IdToken;
  if (t.iss !== "https://accounts.google.com" && t.iss !== "accounts.google.com") throw new Error("Emisor no válido.");
  if (t.aud !== clientId) throw new Error("El token no es para esta aplicación.");
  if (t.exp * 1000 < Date.now()) throw new Error("El token venció.");
  if (!t.email || t.email_verified !== true) throw new Error("Google no verificó este correo.");
  return { sub: t.sub, email: t.email.toLowerCase(), name: (t.name ?? t.email.split("@")[0]).slice(0, 80), picture: t.picture ?? null };
}
