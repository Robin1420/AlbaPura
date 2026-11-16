import { desc, eq } from "drizzle-orm";
import { db, posts } from "./db";

type Row = typeof posts.$inferSelect;

/** Forma pública de un artículo: el cuerpo se entrega como lista de párrafos. */
export function publicPost(p: Row) {
  return {
    slug: p.slug,
    title: p.title,
    topic: p.topic,
    excerpt: p.excerpt,
    date: p.publishedAt,
    minutes: p.minutes,
    image: p.image ?? undefined,
    art: p.art,
    body: p.body.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
  };
}

export async function getPosts() {
  const rows = await db.select().from(posts).where(eq(posts.active, true)).orderBy(desc(posts.publishedAt), desc(posts.sortOrder));
  return rows.map(publicPost);
}
