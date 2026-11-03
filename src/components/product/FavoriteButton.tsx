"use client";

import { useAccount } from "@/components/account/AccountProvider";

export function FavoriteButton({ slug, name }: { slug: string; name: string }) {
  const { favorites, toggleFavorite } = useAccount();
  const on = favorites.includes(slug);
  return (
    <button
      onClick={() => toggleFavorite(slug)}
      aria-pressed={on}
      aria-label={on ? `Quitar ${name} de favoritos` : `Guardar ${name} en favoritos`}
      className="glass absolute right-3 top-3 grid size-10 place-items-center rounded-full text-white transition-transform hover:scale-105"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
}
