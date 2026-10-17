/**
 * Obraz Open Graph 1200x630 (public/og.png): pełne logo na kości słoniowej #F6F2EA
 * w cienkiej złotej ramce. Renderowany przez sharp, bez fontów (logo zawiera napis).
 * Uruchomienie: npm run og
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logo = path.join(root, 'src', 'assets', 'logo', 'logo-pelne.png');
const out = path.join(root, 'public');
await mkdir(out, { recursive: true });

const W = 1200;
const H = 630;
const IVORY = '#F6F2EA';
const GOLD = '#B8923F';

// Logo: szerokość 600 px (proporcje zachowane), wyśrodkowane.
const logoBuf = await sharp(logo).resize({ width: 600, kernel: 'lanczos3' }).png().toBuffer();
const meta = await sharp(logoBuf).metadata();
const left = Math.round((W - meta.width) / 2);
const top = Math.round((H - meta.height) / 2);

// Podwójna złota ramka (hairline).
const frame = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect x="36.5" y="36.5" width="${W - 73}" height="${H - 73}" fill="none" stroke="${GOLD}" stroke-width="1"/>
  <rect x="48.5" y="48.5" width="${W - 97}" height="${H - 97}" fill="none" stroke="${GOLD}" stroke-opacity="0.45" stroke-width="1"/>
</svg>`);

await sharp({ create: { width: W, height: H, channels: 3, background: IVORY } })
  .composite([
    { input: frame, left: 0, top: 0 },
    { input: logoBuf, left, top },
  ])
  .png({ compressionLevel: 9 })
  .toFile(path.join(out, 'og.png'));
console.log('ok og.png', `${W}x${H}`, `logo ${meta.width}x${meta.height}`);
