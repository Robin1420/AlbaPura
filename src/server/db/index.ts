import { drizzle } from "drizzle-orm/d1";
import { store } from "@/shims/context";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

/** Base de datos D1 de la petición en curso: el código usa `db` igual que antes. */
export const db = new Proxy({} as Db, {
  get(_t, prop) {
    const s = store();
    const cache = s as unknown as { __db?: Db };
    cache.__db ??= drizzle(s.env.DB, { schema });
    const value = (cache.__db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(cache.__db) : value;
  },
});

export * from "./schema";
