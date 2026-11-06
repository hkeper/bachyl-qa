import { deflateSync } from "node:zlib";

/**
 * Synthetic test images, generated in code. The public repo never holds frames
 * from real films (copyright): a gradient is enough for the server to accept
 * an upload and for the UI to show a preview.
 */

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = (crcTable[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** A 16:9 RGB gradient PNG. `seed` changes the colours, so two frames never hash alike. */
export function gradientPng(width = 160, height = 90, seed = 0): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.writeUInt8(8, 8); // bit depth
  header.writeUInt8(2, 9); // colour type: RGB
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) {
      row[1 + x * 3] = (x * 255) / width + seed;
      row[2 + x * 3] = (y * 255) / height;
      row[3 + x * 3] = (seed * 37) % 256;
    }
    rows.push(row);
  }
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export const frames = {
  /** A small valid PNG, base64 without a data: prefix. */
  pngBase64: (seed = 0) => gradientPng(160, 90, seed).toString("base64"),
  /** The same image as a data URL, the way a browser's FileReader produces it. */
  pngDataUrl: (seed = 0) => `data:image/png;base64,${gradientPng(160, 90, seed).toString("base64")}`,
  /** A file payload for Playwright's setInputFiles. */
  pngFile: (seed = 0) => ({
    name: `frame-${seed}.png`,
    mimeType: "image/png",
    buffer: gradientPng(160, 90, seed),
  }),
  /** Text that isn't an image at all. */
  notAnImageBase64: Buffer.from("this is not an image").toString("base64"),
};
