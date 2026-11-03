// Genera src/routes.gen.ts: importa cada src/routes/**/route.ts y lo asocia a su patrón de URL.
// Se ejecuta solo antes de dev y deploy (npm run routes).
import { readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve("src/routes");
const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f === "route.ts") files.push(p);
  }
})(root);

const entries = files
  .map((p) => path.relative(root, path.dirname(p)).split(path.sep).join("/"))
  .sort((a, b) => b.split("[").length - a.split("[").length || a.localeCompare(b));

const lines = [
  "// Archivo generado por scripts/gen-routes.mjs. No se edita a mano.",
  ...entries.map((e, i) => `import * as r${i} from "./routes/${e}/route";`),
  "",
  "export type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Response | Promise<Response>;",
  "export const routes: { pattern: string; methods: Partial<Record<string, Handler>> }[] = [",
  ...entries.map((e, i) => `  { pattern: "/api/${e}", methods: r${i} as never },`),
  "];",
  "",
];
writeFileSync("src/routes.gen.ts", lines.join("\n"));
console.log(`${entries.length} rutas`);
