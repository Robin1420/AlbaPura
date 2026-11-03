/**
 * Convierte las etiquetas antiguas de los productos (texto libre, ej. "Más vendido") en el slug de la
 * etiqueta equivalente. Las que no coinciden con ninguna etiqueta se quitan. Uso: npx tsx --env-file=.env.local scripts/migrate-badges.mts
 */
import { createClient } from "@libsql/client";

const client = createClient({ url: process.env.DATABASE_URL ?? "file:./data/alba.db", authToken: process.env.DATABASE_AUTH_TOKEN || undefined });

const badges = (await client.execute("select slug, name from badges")).rows;
const products = (await client.execute("select slug, badge from products where badge is not null")).rows;
const slugs = new Set(badges.map((b) => String(b.slug)));
let changed = 0;
for (const p of products) {
  const cur = String(p.badge);
  if (slugs.has(cur)) continue;
  const match = badges.find((b) => String(b.name).toLowerCase() === cur.toLowerCase());
  await client.execute({ sql: "update products set badge = ? where slug = ?", args: [match ? String(match.slug) : null, String(p.slug)] });
  changed++;
}
console.log(`Etiquetas migradas: ${changed}`);
