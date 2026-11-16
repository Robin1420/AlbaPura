import { json } from "@/server/http";
import { getPosts } from "@/server/posts";

/** Artículos publicados del diario (público). */
export async function GET() {
  const res = json({ posts: await getPosts() });
  res.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
  return res;
}
