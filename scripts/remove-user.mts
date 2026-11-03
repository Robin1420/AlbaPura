/**
 * Elimina una cuenta (y sus sesiones y favoritos). Los pedidos que hizo se conservan, sin dueño.
 * Uso: npx tsx --env-file=.env.local scripts/remove-user.mts correo@dominio.cl
 */
import { createClient } from "@libsql/client";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Indica el correo: npx tsx --env-file=.env.local scripts/remove-user.mts correo@dominio.cl");
  process.exit(1);
}

const client = createClient({ url: process.env.DATABASE_URL ?? "file:./data/alba.db", authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
const found = (await client.execute({ sql: "select id, role from users where email = ?", args: [email] })).rows[0];
if (!found) {
  console.log("No existe una cuenta con ese correo.");
  process.exit(0);
}
const id = String(found.id);
await client.batch(
  [
    { sql: "delete from sessions where user_id = ?", args: [id] },
    { sql: "delete from favorites where user_id = ?", args: [id] },
    { sql: "update orders set user_id = null where user_id = ?", args: [id] },
    { sql: "delete from users where id = ?", args: [id] },
  ],
  "write",
);
console.log(`Cuenta eliminada: ${email} (${found.role})`);
