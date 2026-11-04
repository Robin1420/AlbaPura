// Exporta el catálogo (categorías, productos y etiquetas) de la base local a un archivo SQL para D1.
// Usuarios, pedidos y mensajes de prueba no se exportan.
import { createClient } from "@libsql/client";
import { writeFileSync } from "node:fs";

const c = createClient({ url: process.env.DATABASE_URL ?? "file:./data/alba.db" });
const lit = (v: unknown) => (v === null || v === undefined ? "NULL" : typeof v === "number" || typeof v === "bigint" ? String(v) : `'${String(v).replaceAll("'", "''")}'`);

let sql = "";
for (const t of ["badges", "categories", "products"]) {
  const r = await c.execute(`select * from ${t}`);
  for (const row of r.rows) {
    const cols = r.columns;
    sql += `INSERT INTO \`${t}\` (${cols.map((x) => `\`${x}\``).join(", ")}) VALUES (${cols.map((x) => lit(row[x])).join(", ")});\n`;
  }
  console.log(t, r.rows.length);
}
writeFileSync(process.argv[2] ?? "drizzle/catalog-data.sql", sql);
