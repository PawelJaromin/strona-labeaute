/**
 * Ikony strony z lotosu (src/assets/logo/logo-znak.png = logo-znak.png z dane/zdjecia,
 * przycięte z przezroczystych marginesów). Logo nie jest przerabiane, tylko skalowane.
 * Generuje do public/: favicon-16.png, favicon-32.png, favicon.ico (16+32+48),
 * apple-touch-icon.png (180, białe tło), icon-192.png i icon-512.png (białe tło, margines bezpieczny
 * dla ikon „maskable”). favicon.svg nie powstaje: znak istnieje tylko jako bitmapa (potrzebny wektor
 * od właścicielki), więc przeglądarki dostają PNG/ICO.
 * Uruchomienie: npm run icons
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src', 'assets', 'logo', 'logo-znak.png');
const out = path.join(root, 'public');
await mkdir(out, { recursive: true });

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * Małe rozmiary (≤ 48 px): cienkie linie lotosu po zmniejszeniu prawie znikają, więc znak dostaje
 * jedną płaską barwę złota (#B8923F) i wzmocnioną maskę krycia (kształt bez zmian).
 */
async function smallMark(inner) {
  // sharp wykonuje operacje w stałej kolejności, więc wzmocnienie maski to osobny krok.
  const rawAlpha = await sharp(src)
    .resize(inner, inner, { fit: 'contain', background: CLEAR, kernel: 'lanczos3' })
    .extractChannel(3)
    .raw()
    .toBuffer();
  const alpha = Buffer.from(rawAlpha.map((v) => Math.min(255, Math.round(v * (inner <= 16 ? 3.2 : 2.4)))));
  return sharp({ create: { width: inner, height: inner, channels: 3, background: { r: 0xb8, g: 0x92, b: 0x3f } } })
    .joinChannel(alpha, { raw: { width: inner, height: inner, channels: 1 } })
    .png()
    .toBuffer();
}

/** Znak wpisany w kwadrat `size` z marginesem `pad` (ułamek boku), na tle `bg`. */
async function icon(size, pad, bg) {
  const inner = Math.max(1, Math.round(size * (1 - 2 * pad)));
  const mark =
    size <= 48
      ? await smallMark(inner)
      : await sharp(src).resize(inner, inner, { fit: 'contain', background: CLEAR, kernel: 'lanczos3' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: mark, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const files = [
  ['favicon-16.png', 16, 0.02, CLEAR],
  ['favicon-32.png', 32, 0.04, CLEAR],
  ['apple-touch-icon.png', 180, 0.16, WHITE],
  ['icon-192.png', 192, 0.18, WHITE],
  ['icon-512.png', 512, 0.18, WHITE],
];
for (const [name, size, pad, bg] of files) {
  await writeFile(path.join(out, name), await icon(size, pad, bg));
  console.log('ok', name);
}

// favicon.ico: PNG-i 16, 32 i 48 w kontenerze ICO.
const icoSizes = [16, 32, 48];
const pngs = await Promise.all(icoSizes.map((s) => icon(s, s <= 16 ? 0.02 : 0.04, CLEAR)));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = 6 + 16 * pngs.length;
const entries = pngs.map((png, i) => {
  const s = icoSizes[i];
  const e = Buffer.alloc(16);
  e.writeUInt8(s, 0);
  e.writeUInt8(s, 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(png.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += png.length;
  return e;
});
await writeFile(path.join(out, 'favicon.ico'), Buffer.concat([header, ...entries, ...pngs]));
console.log('ok favicon.ico');
