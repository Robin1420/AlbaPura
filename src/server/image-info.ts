
export type ImageInfo = { ext: "jpg" | "png" | "webp"; mime: string; width: number; height: number };

const MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
const u16be = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1];
const u32be = (b: Uint8Array, i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const u16le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u24le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
const tag = (b: Uint8Array, i: number) => String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);

function jpegSize(b: Uint8Array): { width: number; height: number } | null {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = b[i + 1];
    if (marker === 0xff) {
      i++;
      continue;
    }
    // SOF0..SOF15, salvo DHT (C4), JPG (C8) y DAC (CC)
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { height: u16be(b, i + 5), width: u16be(b, i + 7) };
    i += 2 + u16be(b, i + 2);
  }
  return null;
}

function webpSize(b: Uint8Array): { width: number; height: number } | null {
  const kind = tag(b, 12);
  if (kind === "VP8 ") return { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
  if (kind === "VP8L") {
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (kind === "VP8X") return { width: u24le(b, 24) + 1, height: u24le(b, 27) + 1 };
  return null;
}

/** Reconoce el formato por los primeros bytes (no por el nombre) y lee el tamaño en píxeles sin decodificar la imagen. */
export function inspectImage(b: Uint8Array): ImageInfo | null {
  if (b.length < 32) return null;
  let ext: ImageInfo["ext"] | null = null;
  let size: { width: number; height: number } | null = null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    ext = "jpg";
    size = jpegSize(b);
  } else if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    ext = "png";
    size = { width: u32be(b, 16), height: u32be(b, 20) };
  } else if (tag(b, 0) === "RIFF" && tag(b, 8) === "WEBP") {
    ext = "webp";
    size = webpSize(b);
  }
  if (!ext || !size || size.width < 1 || size.height < 1) return null;
  return { ext, mime: MIME[ext], ...size };
}
