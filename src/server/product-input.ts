import "server-only";
import { z } from "zod";

/** Solo se aceptan fotos subidas desde el panel o las que ya vienen en /public/img. */
const imageUrl = z.string().regex(/^(\/api\/media\/[a-f0-9-]{36}\.(jpg|png|webp)|\/img\/(?:[A-Za-z0-9_-]+\/)?[A-Za-z0-9._-]+)$/, "Foto no válida.");

const note = z.object({ title: z.string().trim().min(1).max(60), text: z.string().trim().min(1).max(120) });
const fact = z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(120) });

export const productInput = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del producto.").max(120),
  categorySlug: z.string().min(1, "Elige una categoría."),
  meta: z.string().trim().min(1, "Indica formato y origen, por ejemplo “100 g, hecho en Lima”.").max(160),
  latin: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().max(4000).default(""),
  price: z.number().int("El precio debe ser un número entero.").min(0).max(10_000_000),
  oldPrice: z.number().int().min(0).max(10_000_000).nullable().optional(),
  stock: z.number().int().min(0).max(100_000),
  active: z.boolean().default(true),
  comingSoon: z.boolean().default(false),
  badge: z.string().max(60).nullable().optional(),
  images: z.array(imageUrl).max(8, "Máximo 8 fotos.").default([]),
  notes: z.array(note).max(8).default([]),
  provenance: z.array(fact).max(8).default([]),
  art: z.enum(["oil", "honey", "soap", "tea"]).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const badgeInput = z.object({
  name: z.string().trim().min(2, "Escribe el nombre de la etiqueta.").max(30, "Máximo 30 caracteres."),
  tone: z.enum(["ink", "leaf", "peach", "sky"]).default("ink"),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  active: z.boolean().default(true),
});

export const categoryInput = z.object({
  name: z.string().trim().min(2, "Escribe el nombre de la categoría.").max(60),
  description: z.string().trim().max(300).default(""),
  image: imageUrl.nullable().optional(),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  active: z.boolean().default(true),
});
