/**
 * Crea una cuenta de administración o promueve una existente.
 * Uso: npm run admin:create -- correo@dominio.cl "Nombre" "contraseña-larga"
 * Si la cuenta ya existe, solo se le da el rol (no se cambia la contraseña).
 */
import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { createClient } from "@libsql/client";

const [email, name, password] = process.argv.slice(2);
if (!email) {
  console.error('Uso: npm run admin:create -- correo@dominio.cl "Nombre" "contraseña"');
  process.exit(1);
}

const client = createClient({ url: process.env.DATABASE_URL ?? "file:./data/alba.db", authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
const e = email.trim().toLowerCase();
const found = await client.execute({ sql: "select id from users where email = ?", args: [e] });

if (found.rows.length) {
  await client.execute({ sql: "update users set role = 'admin' where email = ?", args: [e] });
  console.log(`${e} ahora es administrador.`);
} else {
  if (!name || !password || password.length < 12) {
    console.error("Para crear la cuenta indica nombre y una contraseña de al menos 12 caracteres.");
    process.exit(1);
  }
  const salt = randomBytes(16);
  const hash = (await promisify(scrypt)(password, salt, 64)) as Buffer;
  await client.execute({
    sql: "insert into users (id, email, name, password_hash, role, created_at) values (?, ?, ?, ?, 'admin', ?)",
    args: [randomUUID(), e, name, `${salt.toString("hex")}:${hash.toString("hex")}`, Math.floor(Date.now() / 1000)],
  });
  console.log(`Administrador creado: ${e}`);
}
client.close();
