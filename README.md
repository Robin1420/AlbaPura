# Alba Pura — API

Worker de Cloudflare con la API de la tienda (catálogo, cuentas, pedidos, pagos, panel de administración).
El front vive en otro proyecto (rama `frontend`) y llama a esta API.

- **Base de datos:** D1 (`alba-pura-db`), esquema en `src/server/db/schema.ts`, migraciones en `drizzle/`.
- **Fotos:** R2 (binding `MEDIA`). Hasta activar R2 en la cuenta, subir fotos responde 503.
- **Rutas:** cada archivo de `src/routes/**/route.ts` es un endpoint (`/api/...`). `npm run routes` regenera `src/routes.gen.ts`.

```bash
npm install
npm run dev                  # wrangler dev en :8787 (D1 local simulada)
npm run db:migrate:local     # crea las tablas en la D1 local
npm run deploy               # publica el Worker
npm run db:migrate:remote    # aplica migraciones nuevas en la D1 real
```

Secretos (nunca en el repositorio): `wrangler secret put RESEND_API_KEY | TBK_COMMERCE_CODE | TBK_API_KEY | BANK_INFO | CONTACT_TO`.
Variables no secretas en `wrangler.jsonc` (`APP_URL` = dirección pública de la tienda).

## Notas
- D1 no tiene transacciones interactivas: pedidos, cancelaciones y devolución de stock usan `db.batch` (`src/server/orders.ts`).
- Las contraseñas usan scrypt; en el plan gratuito de Workers (10 ms de CPU) un inicio de sesión puede superar el límite. Si falla, usar el plan de pago o cambiar a PBKDF2.
- El límite de intentos (`rateLimit`) está en memoria de cada instancia: es una defensa débil. Para algo serio, usar reglas de Rate Limiting de Cloudflare.
- Webpay es de Transbank (Chile). Para Perú conviene cambiarlo por Niubiz, Culqi o Mercado Pago; hoy sin credenciales Webpay responde 502 y se paga por transferencia.

## Ingreso con Google
Solo hay inicio de sesión con Google (OAuth con código + PKCE, `src/server/google.ts`). Rutas: `GET /api/auth/google/start` y `GET /api/auth/google/callback`.
- URI de redireccionamiento autorizadas en Google Cloud: `https://<tienda>/api/auth/google/callback` y `http://localhost:3000/api/auth/google/callback`.
- `GOOGLE_CLIENT_ID` y `ADMIN_EMAILS` (correos administradores, separados por coma) son variables en `wrangler.jsonc`. `GOOGLE_CLIENT_SECRET` es un secreto: `npx wrangler secret put GOOGLE_CLIENT_SECRET`.
- Al ingresar por primera vez se crea el cliente con el nombre, el correo y la foto de Google. Teléfono y dirección (`users.phone`, `address_line`, `district`, `region`) se llenan después en `PUT /api/me/profile`.
- Nota: la migración 0000 se aplicó a mano en la D1 real; `d1_migrations` ya registra 0000 y 0001.
