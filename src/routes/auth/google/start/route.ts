import { cookies } from "@/shims/cookies";
import { newPkce, OAUTH_COOKIE, redirectUri, safeNext } from "@/server/google";

/** Empieza el ingreso con Google: guarda state + PKCE en una cookie breve y manda a la pantalla de Google. */
export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return Response.json({ error: "El ingreso con Google no está configurado." }, { status: 503 });

  const next = safeNext(new URL(req.url).searchParams.get("next"));
  const { state, verifier, challenge } = newPkce();
  (await cookies()).set(OAUTH_COOKIE, `${state}.${verifier}.${encodeURIComponent(next)}`, { httpOnly: true, sameSite: "lax", secure: true, path: "/api/auth/google", maxAge: 600 });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return new Response(null, { status: 302, headers: { Location: url.toString(), "Cache-Control": "no-store" } });
}
