// Build öncesi kart doğrulama: şema, tekil id, jetonlar, tür kuralları, yasak kalıplar.
import { readdirSync, readFileSync } from 'node:fs';
import { DeckFileSchema, lintCard } from '../src/engine/cards';

const dir = 'content/cards';
const ids = new Map<string, string>();
const counts: Record<string, number> = {};
let errors = 0;

for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
  const path = `${dir}/${f}`;
  const parsed = DeckFileSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  if (!parsed.success) {
    errors++;
    console.error(`✗ ${path}: şema hatası`);
    for (const issue of parsed.error.issues.slice(0, 10)) console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    continue;
  }
  const { deck, cards } = parsed.data;
  if (`${deck}.json` !== f) { errors++; console.error(`✗ ${path}: dosya adı deste adıyla aynı olmalı (${deck})`); }
  for (const c of cards) {
    if (c.deck !== deck) { errors++; console.error(`✗ ${c.id}: deck alanı ${c.deck}, dosya ${deck}`); }
    if (ids.has(c.id)) { errors++; console.error(`✗ ${c.id}: id tekrar ediyor (${ids.get(c.id)})`); }
    ids.set(c.id, f);
    for (const p of lintCard(c)) { errors++; console.error(`✗ ${c.id}: ${p}`); }
  }
  counts[deck] = cards.length;
}

console.log('Kart sayıları:', Object.entries(counts).map(([d, n]) => `${d}=${n}`).join(' '), `toplam=${ids.size}`);
if (errors) {
  console.error(`${errors} hata bulundu.`);
  process.exit(1);
}
console.log('✓ Tüm kartlar geçerli.');
