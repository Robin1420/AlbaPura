# Alba Pura

Tienda online de productos orgánicos. Next.js 16 (Turbopack) + React 19 + Tailwind 4.
Diseño en Figma: https://www.figma.com/design/1KO4gS19uvua7Xc1dO7dCf

```bash
npm run dev     # http://localhost:3000
npm run build
```

## Arquitectura (dos ramas, dos despliegues en Cloudflare)

| Rama | Qué es | Dónde corre |
| --- | --- | --- |
| `frontend` (esta) | Tienda y panel de administración en Next.js 16 | Worker `alba-pura-web` (OpenNext) |
| `backend` | API (pedidos, cuentas, pagos, administración) | Worker `alba-pura-api` + D1 `alba-pura-db` |

La tienda llama a la API por un *service binding* (`API`): `src/app/api/[...path]/route.ts` reenvía todo `/api/*`, así las cookies de sesión son del mismo sitio y no hace falta CORS. Las páginas del servidor piden el catálogo con `src/server/catalog.ts` (caché de 30 s).

```bash
npm install
npm run dev        # Next en :3000; la API sale de API_URL (por defecto la desplegada)
npm run deploy     # build de OpenNext + despliegue a Cloudflare
```

`API_URL` solo se usa en desarrollo y durante el build. La caché de páginas vive en el KV `alba-pura-cache` (binding `NEXT_INC_CACHE_KV`).

El resto de este archivo describe el proyecto original (todo en uno): las partes de base de datos, API y scripts ahora están en la rama `backend`.

## Estructura

- `src/app/globals.css` tokens del diseño (paleta rocío / tinta de hoja / clorofila, radios, easing)
- `src/lib/products.ts` catálogo de ejemplo
- `src/components/hero/CinematicHero.tsx` hero: el video corre solo y al terminar se revela la marca
- `src/components/cart/` estado del carrito (localStorage), mini-carrito y aviso de producto añadido
- `src/app/` rutas: `/`, `/tienda`, `/producto/[slug]`, `/carrito`, `/checkout`, `/cuenta`, `/nosotros`, `/diario`, `/contacto`, `/preguntas-frecuentes`

## Video del hero

Copia el film a `public/video/hero.mp4` (H.264, 1080p, ≤ 6 MB, 8 a 12 s, sin audio o con audio opcional).
Sin archivo, el hero usa la foto como póster y revela la marca a los 8 s.
Con `prefers-reduced-motion` se muestra directamente el estado final.

## Backend

Todo vive dentro de Next.js (Route Handlers en `src/app/api`, lógica en `src/server`).

| Pieza | Cómo funciona |
| --- | --- |
| Base de datos | Drizzle + libSQL. Local: archivo `data/alba.db`. Producción: Turso (`DATABASE_URL=libsql://…` y `DATABASE_AUTH_TOKEN`). |
| Cuentas | Correo y contraseña (scrypt). Sesión con cookie `HttpOnly` + `SameSite=Lax`; en la base solo se guarda el hash SHA-256 del token. |
| Pedidos | `POST /api/orders` recibe solo producto y cantidad. Precio, envío, regalo y total los calcula el servidor; el stock se reserva en una transacción. |
| Pago | Webpay Plus (SDK oficial de Transbank). Sin claves usa el ambiente de integración; en producción exige `TBK_COMMERCE_CODE` y `TBK_API_KEY`. El retorno confirma con Transbank y compara el monto. También hay transferencia. |
| Correo | Resend (`RESEND_API_KEY`). Sin clave, los correos se imprimen en la consola del servidor. |
| Protecciones | Validación con zod, comprobación de origen en cada POST, límite de intentos en memoria, pedidos visibles solo con el token del enlace o siendo el dueño. |

```bash
cp .env.example .env.local   # y completa lo que necesites
npm run db:push              # crea las tablas
npm run db:seed              # carga el catálogo (precios y stock)
npm run dev
```

Webpay de integración: tarjeta de prueba 4051 8856 0044 6623, CVV 123, cualquier vencimiento futuro; RUT 11.111.111-1, clave 123.

## Panel de administración (`/admin`)

Resumen, pedidos (estados, código de seguimiento, historial y correos al cliente), productos (crear, editar, eliminar, fotos, notas y origen; precio, stock y visibilidad desde la lista), categorías (crear, editar, eliminar si están vacías), etiquetas de producto como “Más vendido” o “Nuevo” (crear, editar, color, ocultar, eliminar), mensajes de contacto y suscriptores con descarga CSV.

```bash
npm run admin:create -- correo@dominio.cl "Nombre" "contraseña-de-12-o-más-caracteres"
```

Solo las cuentas con rol `admin` entran; cada ruta de `/api/admin/*` lo comprueba en el servidor. Los estados siguen un flujo fijo (transferencia → pagado → preparando → enviado → entregado; se puede cancelar antes de enviar y eso devuelve el stock). Cancelar un pedido ya pagado no reembolsa: queda anotado como "reembolso pendiente".

El catálogo vive en la base de datos: `npm run db:seed` solo carga los productos de ejemplo la primera vez (no pisa lo que edites). Las fotos subidas desde el panel (JPG/PNG/WebP, hasta 5 MB, validadas por contenido) se guardan en `data/uploads` y se sirven en `/api/media/…`. En hosting sin disco persistente (Vercel, etc.) hay que cambiar `src/app/api/admin/upload/route.ts` por un almacenamiento de objetos (S3, R2, Vercel Blob).

Las etiquetas viven en la tabla `badges` (nombre, color `ink|leaf|peach|sky`, orden, visible). El producto guarda solo el slug en `products.badge`; la tienda lo traduce a nombre y color. Al eliminar una etiqueta, los productos que la usaban quedan sin etiqueta. Si vienes de una base anterior con etiquetas en texto libre, ejecuta una vez `npx tsx --env-file=.env.local scripts/migrate-badges.mts` (después de `npm run db:push` y `npm run db:seed`).

### Ventanas emergentes (pop-ups)

Todo lo que se crea, edita o confirma en el panel abre una ventana sobre la página, sin recargarla ni cambiar de ruta: productos, categorías, etiquetas, detalle de pedido (desde la lista y desde “Para atender”) y confirmaciones de borrado. Se usan dos piezas, y no hay `window.confirm` en el código:

- `src/components/ui/Modal.tsx`: `<Modal open onClose title description? size="sm|md|lg|xl" dismissible?>`. Cierra con Escape, clic en el fondo o la X; atrapa el foco y lo devuelve al botón que la abrió; bloquea el scroll; en celular sube como hoja inferior. Admite ventanas apiladas (solo la de arriba responde a Escape). `<ModalActions>` fija la barra de botones al pie.
- `src/components/ui/useConfirm.tsx`: `const { confirm, dialog } = useConfirm()` y `confirm({ title, message, danger, action })`; si `action` devuelve un texto, la ventana sigue abierta y lo muestra como error. Dibuja `{dialog}` en el componente.

Para una pantalla nueva: guarda en un estado qué se está editando y renderiza el formulario dentro de `<Modal open={estado !== null}>`; al guardar, cierra y recarga la lista.

## Productos "Próximamente"

Cada producto tiene un **Estado**: *Disponible*, *Próximamente* u *Oculto* (en el formulario y en un selector en cada fila de `/admin/productos`). Con *Próximamente* el producto aparece en la tienda con su foto y nombre, pero **sin precio, sin botón de compra y con la etiqueta "Próximamente"**; su ficha explica que aún no está a la venta e invita a escribirnos para que avisemos. No hace falta poner precio mientras esté marcado. El servidor también rechaza cualquier pedido que lo incluya, y no se publica precio ni oferta para buscadores. Cuando salga a la venta, cámbialo a *Disponible* y escribe el precio.

**Ojo con los cambios de esquema:** `npm run db:push --force` puede recrear una tabla y vaciarla. Haz una copia de `data/alba.db` antes y, si se vaciaron los productos, vuelve a cargar los de ejemplo con `scripts/update-content.mts`.

## Imágenes de productos y portada

Las fotos de los seis productos de ejemplo están en `public/img/products/` (una por producto, 1024×1280) y la portada en `public/img/portada.jpg` (1280×1024). Se generaron con IA (envases con la etiqueta en blanco) y el **logotipo real** (`public/img/logo.png`) se pegó encima con un script, para que salga exacto y no deformado por la IA. Al cambiar un producto desde el panel puedes subir tus propias fotos; estas quedan como ejemplo.

Para rehacerlas con otro envase: genera la foto con la etiqueta en blanco, de frente y bien iluminada, y estampa el logo con multiplicación (para conservar luz y sombra) en el rectángulo de la etiqueta.

## Logotipo

Los logotipos oficiales (árbol con "ALBA PURA" en arco) están en `brand/`: `alba-pura-color.svg` (verde `#3c503d`) y `alba-pura-claro.svg` (árbol blanco y letras en gris verdoso claro `#dfe4db`, para fondos oscuros). Son los archivos maestros; pesan más de 1 MB porque el árbol es un dibujo muy detallado, por eso no se sirven en la web.

El sitio usa dos PNG con fondo transparente generados desde ellos (`public/img/logo.png` y `public/img/logo-light.png`), el favicon (`src/app/icon.png`, `src/app/apple-icon.png`) y la imagen para compartir (`src/app/opengraph-image.tsx`). Si cambias el logotipo, vuelve a exportar esos PNG a 1000 px de ancho y reemplázalos.

## Contenido y marca

Alba Pura es una línea de productos orgánicos creada en **Lima, Perú** por la bióloga **Yuleisi Cucho** (Universidad Nacional Federico Villarreal), dueña y fundadora. El sitio está en **fase de prueba de producto**, y el texto lo refleja: no promete envío gratis, lotes, cosechas ni reseñas que todavía no existen.

- **Dónde está cada texto:** el nombre, la fundadora y los datos de contacto en `src/lib/site.ts`; Diario y preguntas frecuentes en `src/lib/content.ts`; Inicio en `src/app/(site)/page.tsx`; Nosotros en `src/app/(site)/nosotros/page.tsx`.
- **Contacto:** define `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_WHATSAPP` y `NEXT_PUBLIC_INSTAGRAM` en `.env` y aparecen solos en la página de contacto. Sin ellos solo se muestra la ciudad.
- **Moneda y envíos:** precios en soles enteros (`S/ 18`). El delivery (S/ 10) y las zonas (Lima Metropolitana y Callao) son valores de ejemplo en `src/lib/checkout.ts`.
- **Pagos:** transferencia, Yape o Plin; los datos salen de `BANK_INFO`. Webpay es de Transbank (Chile) y no se ofrece. Para cobrar con tarjeta en Perú habría que integrar Culqi, Niubiz o Mercado Pago.
- **Catálogo de ejemplo:** `scripts/seed-data.ts` trae seis productos de ejemplo (jabones, bálsamo, aceite, miel, infusión). Para cargarlos en una base existente: `npx tsx --env-file=.env.local scripts/update-content.mts` (sobrescribe los productos con el mismo slug). Reemplázalos por tu catálogo real desde `/admin`.
- **Afirmaciones sobre los productos:** términos como "orgánico" o "sin químicos dañinos" deben poder respaldarse (certificaciones, fichas técnicas, registro sanitario según el tipo de producto). Detalla los ingredientes reales de cada ficha.

## Seguridad

**Ya implementado**
- Contraseñas con scrypt y sal; sesiones con token aleatorio guardado como hash (cookie `HttpOnly`, `SameSite=Lax`, `Secure` en producción).
- Toda ruta `/api/admin/*` comprueba el rol en el servidor. Los precios y el stock de un pedido los calcula el servidor; el stock se reserva en una transacción.
- Validación con zod en cada entrada, consultas parametrizadas (Drizzle) y subida de fotos validada por contenido.
- Peticiones que cambian datos: se rechaza el origen distinto (`Origin` y `Sec-Fetch-Site`). Límite de intentos en login (por IP y por IP + correo), registro, pedidos, contacto y subidas.
- Un pedido solo se ve con su enlace secreto (18 bytes aleatorios) o siendo su dueño. Los pedidos con tarjeta que nadie paga se liberan solos a los 45 minutos (devuelven el stock).
- Cabeceras: `Content-Security-Policy` (solo recursos propios; el formulario de pago solo puede ir a Webpay), `Strict-Transport-Security`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` y `Permissions-Policy`.
- Webpay falla cerrado: sin `TBK_COMMERCE_CODE` y `TBK_API_KEY` en producción no se cobra (nunca cae al ambiente de pruebas).

**Corregido en la revisión de seguridad**
- La URL de vuelta de Webpay aceptaba un número de pedido sin prueba: cualquiera podía anular pedidos ajenos y obtener el enlace secreto (con nombre, dirección y teléfono). Ahora solo actúa si llega el token que Webpay entregó para ese pedido.
- Pedidos con tarjeta abandonados dejaban el stock reservado para siempre.
- El limitador de intentos crecía sin límite y el login se podía probar con muchos correos desde una IP.

**Límites conocidos**
- El limitador de intentos está en memoria: con varias instancias del servidor hay que pasarlo a Redis/Upstash.
- Las cabeceras IP (`x-forwarded-for`) se confían tal cual: despliega detrás del proxy del hosting (Vercel, Cloudflare), que las reescribe.
- El registro avisa si un correo ya existe (comodidad sobre privacidad).
- `script-src` permite `'unsafe-inline'` porque Next inyecta scripts de hidratación; un CSP con nonce exigiría renderizar todo bajo demanda.
- No hay recuperación de contraseña, verificación de correo ni autenticación en dos pasos en el panel.

## Publicar en producción

1. **Base de datos:** crea una base en [Turso](https://turso.tech) (`turso db create alba-pura`) y un token. Define `DATABASE_URL=libsql://…` y `DATABASE_AUTH_TOKEN`. Luego `npm run db:push` y `npm run db:seed` apuntando a esa base.
2. **Fotos:** el disco de Vercel y similares no persiste. Cambia `src/app/api/admin/upload/route.ts` y `src/app/api/media/[name]/route.ts` por Cloudflare R2, S3 o Vercel Blob (la tabla `media` y las URLs pueden quedar igual).
3. **Pagos:** pide a Transbank el código de comercio y la API key de producción (`TBK_COMMERCE_CODE`, `TBK_API_KEY`). Prueba un cobro real de monto bajo antes de abrir.
4. **Correo:** crea una cuenta en [Resend](https://resend.com), verifica tu dominio y define `RESEND_API_KEY`, `EMAIL_FROM` y `CONTACT_TO`.
5. **Dominio:** `APP_URL=https://tudominio.cl` (de ahí salen Webpay, enlaces de correo, sitemap y canonical).
6. **Revisión:** con las variables de producción cargadas, `npm run check:prod` dice qué falta.
7. **Administrador:** `npm run admin:create` con una contraseña larga y única. Elimina las cuentas de prueba: `npx tsx --env-file=.env.local scripts/remove-user.mts correo@dominio.cl`.
8. **Después de publicar:** abre `/api/health` (debe responder `{"ok":true}`) y configúralo en un monitor (UptimeRobot, Better Stack). Verifica el dominio en Google Search Console y envía `/sitemap.xml`.

**Copias de seguridad:** Turso hace respaldos automáticos según el plan; además exporta cada semana con `turso db shell alba-pura .dump > respaldo.sql` y guárdalo fuera del hosting. Prueba restaurar una vez.

**Errores en producción:** conecta Sentry (`@sentry/nextjs`) para enterarte de los fallos antes que tus clientes.

## Velocidad

Medido con Lighthouse en móvil (red lenta simulada) sobre la compilación de producción:

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
| --- | --- | --- | --- | --- |
| Inicio | 100 | 97 | 100 | 100 |
| Tienda | 88 | 97 | 100 | 100 |
| Producto | 90 | 96 | 100 | 100 |

Qué se hizo: el inicio ya no espera un video que no existe (antes tardaba 4,9 s en mostrar el título; ahora 1,0 s), `/tienda` es estática con las primeras fotos priorizadas, las animaciones (`motion`) se cargan bajo demanda con `LazyMotion`, los colores de texto cumplen contraste AA y el carrito lateral cerrado es inerte. Para volver a medir: `npm run build`, `npx next start -p 3100` y `npx lighthouse http://localhost:3100/`.

Con video: sube `public/video/hero.mp4` y define `NEXT_PUBLIC_HERO_VIDEO=1`. Comprímelo (idealmente menos de 3 MB) o la portada volverá a cargar lento.

## SEO

Lo que ya está implementado:

- **Dominio:** define `APP_URL` con el dominio real (`https://tudominio.cl`) antes de publicar. De ahí salen el sitemap, los canonical, las imágenes sociales y los datos estructurados.
- **`/sitemap.xml` y `/robots.txt`** se generan solos desde el catálogo (productos, categorías y artículos del Diario). `robots.txt` bloquea `/admin`, `/api`, `/carrito`, `/checkout`, `/cuenta` y `/pedido`.
- **Una página por categoría** (`/categoria/aceites-y-vinagres`, etc.) con su título, descripción y lista de productos. Reemplazan a `/tienda?c=…`, que no se indexa bien.
- **Metadatos por página:** título con palabras clave, meta descripción de hasta 155 caracteres, URL canónica, Open Graph y Twitter. Los productos usan su primera foto al compartirse.
- **Datos estructurados (schema.org):** `Organization` y `WebSite` en el inicio, `Product` con precio en CLP y disponibilidad, `BreadcrumbList`, `CollectionPage`, `Article` y `FAQPage`.
- **Páginas privadas** (carrito, pago, cuenta, pedido, admin) con `noindex`.
- **Imagen para compartir** del sitio en `/opengraph-image`.

No se marcan reseñas (`aggregateRating`) a propósito: las calificaciones actuales son de ejemplo y Google penaliza las inventadas. Actívalas cuando existan reseñas reales.

Lo que hay que hacer fuera del código para posicionar: ver la guía en la conversación (Search Console, Google Business Profile, contenido y enlaces).

## Imágenes: dónde viven y cómo se sirven

| Tipo | Dónde está | Cómo se usa |
| --- | --- | --- |
| Fotos de marca y de ejemplo | `public/img/` | Se sirven como archivos estáticos en `/img/…` y `next/image` las optimiza (WebP/AVIF, tamaños por pantalla). |
| Fotos subidas desde el panel | Archivo en `data/uploads/<uuid>.<ext>` y ficha en la tabla `media` | Se sirven por `/api/media/<uuid>.<ext>` con caché de un año (`immutable`) y `nosniff`. |

**Qué se guarda de cada foto subida** (tabla `media`, visible en `/admin/imagenes`): nombre del archivo, nombre original, formato (`image/jpeg`, `image/png` o `image/webp`), ancho y alto en píxeles, peso en bytes, texto alternativo (`alt`), quién la subió y cuándo.

**Reglas al subir** (`src/app/api/admin/upload/route.ts`):
- Solo admins, con comprobación de origen y límite de 60 subidas cada 10 minutos.
- Máximo 5 MB y 8000 px por lado.
- El formato y las medidas se leen de los primeros bytes del archivo (`src/server/image-info.ts`), no del nombre ni del `Content-Type`. Un archivo falso con extensión `.jpg` se rechaza.
- El archivo se guarda con un nombre aleatorio (uuid), así que no hay colisiones ni nombres adivinables.

**Dónde se referencian**: los productos guardan una lista de URLs en `products.images` (la primera es la principal) y las categorías una en `categories.image`. La URL solo se acepta si empieza por `/api/media/<uuid>.<ext>` o `/img/<archivo>` (`src/server/product-input.ts`).

**Texto alternativo**: en producto y categoría se usa el nombre como `alt`. En `/admin/imagenes` puedes escribir una descripción por foto y ver cuáles aún no la tienen. Una foto en uso no se puede borrar; primero hay que quitarla del producto o la categoría.

**Producción**: el disco de `data/uploads` no persiste en Vercel y similares. Hay que cambiar `upload/route.ts` y `api/media/[name]/route.ts` por S3, R2 o Vercel Blob; la tabla `media` y las URLs pueden quedar iguales.

## Pendiente


- Editar desde el panel los artículos del Diario y las preguntas frecuentes (hoy están en `src/lib/content.ts`).
- Almacenamiento de objetos para las fotos en producción.
- Reembolsos y anulaciones de Webpay, y recuperación de contraseña.
- Video del hero (`public/video/hero.mp4`) y fotos reales de jabón y té.
