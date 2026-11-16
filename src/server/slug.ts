
/** "Aceite de oliva extra" → "aceite-de-oliva-extra" (sin tildes ni símbolos). */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Devuelve un slug libre agregando -2, -3… si ya existe. */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>) {
  const root = slugify(base) || "item";
  let slug = root;
  for (let n = 2; await exists(slug); n++) slug = `${root}-${n}`;
  return slug;
}
