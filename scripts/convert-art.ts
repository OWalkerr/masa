// assets-raw/ altındaki görselleri 800 ve 400 px WebP'ye çevirir, public/art/manifest.json'u günceller.
// Ad kuralı: type-question-01.png, deck-chaos.png, avatar-03.png, bg-phone.png, bg-tv.png, card-back.png, tik-sheet.png
// ya da kartın kendi "art" anahtarı (örn. gold-01.png). Kullanım: npm run convert:art
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

const SRC = 'assets-raw';
const OUT = 'public/art';
const MAX_BYTES = 120 * 1024;

interface Item { w800: string; w400: string; width: number; height: number; bytes: number }
const manifest = {
  version: Date.now(),
  items: {} as Record<string, Item>,
  byType: {} as Record<string, string[]>,
  decks: {} as Record<string, string>,
  avatars: {} as Record<string, string>,
};

mkdirSync(OUT, { recursive: true });
// style-* dosyaları yalnızca stil referansıdır, oyuna girmez
const files = existsSync(SRC) ? readdirSync(SRC).filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && !/^style-/i.test(f)).sort() : [];

async function encode(input: string, width: number, out: string): Promise<number> {
  // Hedef boyutun altına inene kadar kaliteyi düşür
  for (const quality of [80, 72, 64, 56, 48, 40]) {
    const buf = await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer();
    if (buf.byteLength <= MAX_BYTES || quality === 40) {
      writeFileSync(out, buf);
      return buf.byteLength;
    }
  }
  return 0;
}

for (const f of files) {
  if (/^tik-sheet\./i.test(f)) continue; // poz sayfası aşağıda kesilir
  const key = basename(f, extname(f)).toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const input = join(SRC, f);
  const o800 = join(OUT, `${key}-800.webp`);
  const o400 = join(OUT, `${key}-400.webp`);
  const fresh = existsSync(o800) && existsSync(o400) && statSync(o800).mtimeMs > statSync(input).mtimeMs;
  let bytes = fresh ? statSync(o800).size : 0;
  if (!fresh) {
    bytes = await encode(input, 800, o800);
    await encode(input, 400, o400);
  }
  const meta = await sharp(o800).metadata();
  manifest.items[key] = { w800: `/art/${key}-800.webp`, w400: `/art/${key}-400.webp`, width: meta.width ?? 800, height: meta.height ?? 600, bytes };
  let m = key.match(/^type-([a-z]+)-\d+$/i);
  if (m) {
    const type = m[1]!.replace(/(likely|have|event)$/, (x) => x[0]!.toUpperCase() + x.slice(1));
    (manifest.byType[type] ??= []).push(key);
  }
  m = key.match(/^deck-([a-z]+)$/);
  if (m) manifest.decks[m[1]!] = key;
  m = key.match(/^avatar-(\d+)$/);
  if (m) manifest.avatars[String(Number(m[1]) - 1)] = key; // avatar-01 → 0. avatar
  console.log(`${fresh ? '·' : '✓'} ${key} (${Math.round(bytes / 1024)} KB)`);
}

// TIK poz sayfası (3 sütun: önden, yarı yandan, yandan; üst sıra rakı, alt sıra çay).
// Önden ve yarı yandan pozlar 200:260 kesilir; TIK bileşeni bunları gotik kemer içinde gösterir.
const sheetFile = files.find((f) => /^tik-sheet\./i.test(f));
if (sheetFile) {
  const sheet = sharp(join(SRC, sheetFile));
  const meta = await sheet.metadata();
  const W = meta.width ?? 2048, H = meta.height ?? 1143;
  // Oranlar 2048×1143 sayfaya göre ölçüldü; başka boyutta da aynı düzen varsayılır
  const fx = W / 2048, fy = H / 1143;
  const cells: Record<string, [number, number]> = { 'tik-raki': [597, 50], 'tik-raki-turn': [1035, 50], 'tik-tea': [597, 590], 'tik-tea-turn': [1035, 590] };
  for (const [key, [cx, top]] of Object.entries(cells)) {
    const w = Math.round(400 * fx), h = Math.min(Math.round(520 * fy), H - Math.round(top * fy));
    const region = { left: Math.round(cx * fx - w / 2), top: Math.round(top * fy), width: w, height: h };
    const o800 = join(OUT, `${key}-800.webp`), o400 = join(OUT, `${key}-400.webp`);
    const buf = await sharp(join(SRC, sheetFile)).extract(region).toBuffer();
    writeFileSync(o800, await sharp(buf).resize({ width: 400 }).webp({ quality: 82 }).toBuffer());
    writeFileSync(o400, await sharp(buf).resize({ width: 200 }).webp({ quality: 80 }).toBuffer());
    const m2 = await sharp(o800).metadata();
    manifest.items[key] = { w800: `/art/${key}-800.webp`, w400: `/art/${key}-400.webp`, width: m2.width ?? 400, height: m2.height ?? 520, bytes: statSync(o800).size };
    console.log(`✓ ${key} (poz sayfasından)`);
  }
}

writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest: ${Object.keys(manifest.items).length} görsel`);
