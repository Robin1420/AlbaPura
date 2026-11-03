/**
 * Revisa que el entorno de producción esté listo. Uso (con las variables de producción cargadas):
 *   npx tsx scripts/check-prod.mts
 * Termina con error si falta algo crítico.
 */
const env = process.env;
const problems: string[] = [];
const warnings: string[] = [];

const must = (cond: unknown, msg: string) => { if (!cond) problems.push(msg); };
const should = (cond: unknown, msg: string) => { if (!cond) warnings.push(msg); };

must(env.APP_URL?.startsWith("https://"), "APP_URL debe ser la URL pública con https:// (ej. https://albapura.cl).");
must(env.DATABASE_URL && !env.DATABASE_URL.startsWith("file:"), "DATABASE_URL apunta a un archivo local. En producción usa una base remota (libsql://… de Turso).");
must(!env.DATABASE_URL?.startsWith("libsql://") || env.DATABASE_AUTH_TOKEN, "Falta DATABASE_AUTH_TOKEN para la base de Turso.");
must(env.RESEND_API_KEY, "Falta RESEND_API_KEY: sin ella los clientes no reciben correos de confirmación.");
must(env.BANK_INFO && !/9XX|000000000/.test(env.BANK_INFO), "BANK_INFO tiene los datos de pago de ejemplo. Escribe tu número de Yape/Plin o tu cuenta real.");
should(env.NEXT_PUBLIC_CONTACT_EMAIL || env.NEXT_PUBLIC_WHATSAPP, "Define NEXT_PUBLIC_CONTACT_EMAIL o NEXT_PUBLIC_WHATSAPP para que la página de contacto muestre cómo escribirte.");
should(env.EMAIL_FROM && !env.EMAIL_FROM.includes("albapura.cl") || env.EMAIL_FROM, "Define EMAIL_FROM con un dominio verificado en Resend.");
should(env.CONTACT_TO, "Define CONTACT_TO: el correo que recibe los mensajes del formulario de contacto.");
should(env.NODE_ENV === "production", "NODE_ENV no es production en este entorno (el hosting lo define al desplegar).");

for (const w of warnings) console.log("Aviso:", w);
for (const p of problems) console.log("ERROR:", p);
if (problems.length) {
  console.log(`\n${problems.length} problema(s) por resolver antes de publicar.`);
  process.exit(1);
}
console.log("Entorno listo para publicar.");
