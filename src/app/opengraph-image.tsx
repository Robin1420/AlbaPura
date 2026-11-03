import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Alba Pura, productos orgánicos creados en Lima";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen que se ve al compartir el sitio en WhatsApp, redes o chats. */
export default async function OgImage() {
  const logo = await readFile(path.join(process.cwd(), "public", "img", "logo.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 70, width: "100%", height: "100%", padding: 60, background: "linear-gradient(135deg, #e2f1f5 0%, #ebf3df 52%, #fbe3d3 100%)", color: "#3c503d" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={560} height={394} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 420 }}>
          <div style={{ fontSize: 46, lineHeight: 1.1 }}>Cuida tu piel. Cuida el planeta.</div>
          <div style={{ fontSize: 26, color: "#36544c" }}>Productos orgánicos hechos en Lima.</div>
        </div>
      </div>
    ),
    size,
  );
}
