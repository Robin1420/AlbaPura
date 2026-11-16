import type { Post } from "@/lib/content";
import { apiFetch } from "./api";

/** Artículos publicados del diario, pedidos a la API (más nuevos primero). */
export async function getPosts(): Promise<Post[]> {
  const res = await apiFetch("/api/posts");
  if (!res.ok) throw new Error(`La API respondió ${res.status} al pedir el diario.`);
  return ((await res.json()) as { posts: Post[] }).posts;
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (await getPosts()).find((p) => p.slug === slug);
}
