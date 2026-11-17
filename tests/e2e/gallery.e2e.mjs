// Sergi uçtan uca: 3 telefon aynı konuyu çizer, teslim eder, isimsiz galeride en kötü eseri oylar, sonuçta sanatçılar açılır.
// Kullanım: BASE=http://127.0.0.1:4173 [SHOTS=klasör] node tests/e2e/gallery.e2e.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const SHOTS = process.env.SHOTS;
const assert = (c, m) => { if (!c) throw new Error('BAŞARISIZ: ' + m); console.log('✓', m); };
const NAMES = ['Ayşe', 'Mehmet', 'Zeynep'];
const browser = await chromium.launch();
const errors = [];
const { code } = await (await (await browser.newContext()).request.post(`${BASE}/api/rooms`)).json();
const pages = [];
for (let i = 0; i < 3; i++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(4000);
  p.on('pageerror', (e) => errors.push(`${NAMES[i]}: ${e.message}`));
  await p.goto(`${BASE}/m/${code}?autojoin=1&name=${NAMES[i]}&avatar=${i}`);
  await p.getByText('Masa kodu').waitFor({ timeout: 20000 });
  pages.push(p);
}
await pages[0].getByText('3 kişi · 3 çevrimiçi').waitFor();
await pages[0].getByRole('radio', { name: /Karakalem/ }).click();
await pages[0].getByRole('button', { name: 'Başlat' }).click();
const tv = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
tv.on('pageerror', (e) => errors.push(`TV: ${e.message}`));
await tv.goto(`${BASE}/tv/${code}`);
const vis = (l) => l.isVisible().catch(() => false);

// Sergi kartı gelene kadar oyna
let found = false;
const deadline = Date.now() + 5 * 60_000;
while (Date.now() < deadline && !found) {
  for (const p of pages) {
    const t = await p.locator('main').innerText().catch(() => '');
    if (t.includes('Serginin konusu')) { found = true; break; }
    if (t.includes('Sıra sende. Bir kart seç')) {
      const g = p.locator('main [role=button]:has([aria-label$="Sergi kartı"])').first();
      if (await vis(g) && (await g.getAttribute('aria-label')) === 'Bu karta geç') { await g.click().catch(() => {}); await p.waitForTimeout(400); }
      await p.getByRole('button', { name: 'Oyna', exact: true }).click().catch(() => {});
    } else if (t.includes('Kart kime gidiyor')) {
      await p.locator('main section [aria-pressed]').first().click().catch(() => {});
      await p.getByRole('button', { name: 'Seç', exact: true }).click().catch(() => {});
    } else if (/görevi yaptı mı|cevapladı mı|bildi mi/.test(t)) await p.getByRole('button', { name: /^(Yaptı|Cevapladı|Bildi)$/ }).click().catch(() => {});
    else if (t.includes('Dürüst ol')) await p.getByRole('button', { name: 'Yapmadım' }).click().catch(() => {});
    else if (t.includes('Gizlice birini seç')) await p.locator('main .grid button').first().click().catch(() => {});
    else if (t.includes('Bu ne? Yaz')) { await p.locator('#guess').fill('bilmem').catch(() => {}); }
    const nx = p.getByRole('button', { name: /^Sonraki kart →$/ });
    if (await vis(nx)) await nx.click().catch(() => {});
    const skip = p.getByRole('button', { name: /Beklemeden geç|Hükümsüz geç/ });
    if (await vis(skip)) await skip.click().catch(() => {});
  }
  await pages[0].waitForTimeout(300);
}
assert(found, 'Sergi kartı geldi');
for (const p of pages) await p.getByText('Serginin konusu').waitFor({ timeout: 10000 });
assert(true, 'herkes konuyu görüyor');

// Herkes kendi şeklini çizer
await pages[0].waitForTimeout(2800);
for (let i = 0; i < 3; i++) {
  const p = pages[i];
  const box = await p.locator('canvas[aria-label^="Çizim alanı"]').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await p.mouse.move(cx - 80 + i * 30, cy - 60);
  await p.mouse.down();
  await p.mouse.move(cx + 60 - i * 20, cy + 70, { steps: 15 });
  await p.mouse.move(cx - 40, cy + 90 - i * 40, { steps: 10 });
  await p.mouse.up();
}
await pages[0].waitForTimeout(800);
if (SHOTS) await pages[1].screenshot({ path: `${SHOTS}/gal-draw.png` });
for (const p of pages) await p.getByRole('button', { name: 'Eserimi teslim et' }).click();
for (const p of pages) await p.getByText('En kötü eser hangisi?').waitFor({ timeout: 10000 });
assert(true, 'herkes teslim edince galeri açıldı');
const txt = await pages[0].locator('main').innerText();
assert(!NAMES.some((n) => txt.includes(`${n} ·`)), 'galeri isimsiz');
if (SHOTS) { await pages[0].screenshot({ path: `${SHOTS}/gal-vote.png` }); await tv.screenshot({ path: `${SHOTS}/gal-tv.png` }); }

// Oy: herkes kendisininki dışındaki ilk esere
for (const p of pages) {
  const b = p.locator('ul[aria-label="Galeri"] button:not([disabled])').first();
  await b.click();
}
await pages[0].getByText('Rezalet Ödülü').waitFor({ timeout: 10000 });
assert(true, 'sonuçta Rezalet Ödülü ve sanatçılar açıldı');
const res = await pages[0].locator('main').innerText();
assert(NAMES.some((n) => res.includes(n)), 'sanatçı adları sonuçta görünüyor');
if (SHOTS) await pages[0].screenshot({ path: `${SHOTS}/gal-result.png` });
assert(errors.length === 0, `sayfa hatası yok ${errors.join(' | ')}`);
console.log('Sergi uçtan uca: hepsi geçti');
await browser.close();
