// PWA ikonları: favicon.svg'den 192/512 px PNG, maskable (güvenli alan payı) ve Apple dokunma ikonu üretir.
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const svg = readFileSync('public/favicon.svg', 'utf8').trim();
// Maskable: köşesiz kare zemin, içerik %70 güvenli alanda
const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '').replace(/<rect[^>]*\/>/, '');
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0D0B10"/><g transform="translate(9.6 9.6) scale(0.7)">${inner}</g></svg>`;

const jobs: [string, string, number][] = [
  [svg, 'public/icons/icon-192.png', 192],
  [svg, 'public/icons/icon-512.png', 512],
  [maskable, 'public/icons/maskable-512.png', 512],
  [maskable, 'public/icons/apple-touch-icon.png', 180],
];
for (const [src, out, size] of jobs) {
  await sharp(Buffer.from(src), { density: 600 }).resize(size, size).png().toFile(out);
  console.log('✓', out);
}
