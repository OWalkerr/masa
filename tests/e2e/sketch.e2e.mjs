// Karakalem uçtan uca: 3 telefon + Ana Ekran. Çizen tuvale çizer, çizim diğer telefonlarda ve TV'de canlı görünür,
// biri yanlış sonra doğru tahmin eder, sonuçta eser ve bilenler görünür.
// Kullanım: BASE=http://127.0.0.1:4173 [SHOTS=klasör] node tests/e2e/sketch.e2e.mjs
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
let drawerIdx = -1;
let word = '';
const deadline = Date.now() + 4 * 60_000;
// Kart seç; Karakalem değilse oynayıp geç (host ilerletir)
while (Date.now() < deadline && drawerIdx < 0) {
  for (let i = 0; i < 3; i++) {
    const p = pages[i];
    const t = await p.locator('main').innerText().catch(() => '');
    if (t.includes('Çizeceğin')) { drawerIdx = i; break; }
    if (t.includes('Sıra sende. Bir kart seç')) {
      // Elde Karakalem varsa onu seç
      const sk = p.locator('main [role=button]:has([aria-label$="Karakalem kartı"], [aria-label$="Tek Çizgi kartı"], [aria-label$="Kör Ressam kartı"], [aria-label$="Ters El kartı"])').first();
      if (await vis(sk) && (await sk.getAttribute('aria-label')) === 'Bu karta geç') { await sk.click().catch(() => {}); await p.waitForTimeout(400); }
      await p.getByRole('button', { name: 'Oyna', exact: true }).click().catch(() => {});
    } else if (t.includes('Kart kime gidiyor')) {
      await p.locator('main section [aria-pressed]').first().click().catch(() => {});
      await p.getByRole('button', { name: 'Seç', exact: true }).click().catch(() => {});
    } else if (/görevi yaptı mı|cevapladı mı|bildi mi/.test(t)) await p.getByRole('button', { name: /^(Yaptı|Cevapladı|Bildi)$/ }).click().catch(() => {});
    else if (t.includes('Dürüst ol')) await p.getByRole('button', { name: 'Yapmadım' }).click().catch(() => {});
    else if (t.includes('Gizlice birini seç')) await p.locator('main .grid button').first().click().catch(() => {});
    const nx = p.getByRole('button', { name: /^Sonraki kart →$/ });
    if (await vis(nx)) await nx.click().catch(() => {});
  }
  await pages[0].waitForTimeout(300);
}
assert(drawerIdx >= 0, `Karakalem kartı geldi, çizen: ${NAMES[drawerIdx]}`);
const dp = pages[drawerIdx];
word = (await dp.locator('text=Çizeceğin').locator('..').innerText()).split('\n').pop().trim();
assert(word.length > 1, `çizen gizli kelimeyi görüyor: “${word}”`);
const guessers = pages.filter((_, i) => i !== drawerIdx);
for (const g of guessers) assert(!(await g.locator('main').innerText()).includes(word), 'tahmin edenler kelimeyi görmüyor');

// Çiz: bir daire ve bir çizgi
await dp.waitForTimeout(3200); // hazırlık payı
const box = await dp.locator('canvas[aria-label^="Çizim alanı"]').boundingBox();
const cx = box.x + box.width / 2, cy = box.y + box.height / 2, r = box.width * 0.3;
await dp.mouse.move(cx + r, cy);
await dp.mouse.down();
for (let a = 0; a <= 64; a++) await dp.mouse.move(cx + r * Math.cos((a / 64) * 2 * Math.PI), cy + r * Math.sin((a / 64) * 2 * Math.PI), { steps: 2 });
await dp.mouse.up();
await dp.mouse.move(box.x + 20, box.y + 20); await dp.mouse.down(); await dp.mouse.move(box.x + box.width - 20, box.y + box.height - 20, { steps: 20 }); await dp.mouse.up();
await dp.waitForTimeout(1500);

// İzleyenin tuvalinde mürekkep var mı (boş parşömen değil)
const inked = async (p) => p.evaluate(() => {
  const c = document.querySelector('canvas[aria-label="Canlı çizim"]');
  if (!c) return 0;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 16) if (d[i] < 80 && d[i + 1] < 80 && d[i + 2] < 80) n++;
  return n;
});
const g0 = guessers[0], g1 = guessers[1];
assert((await inked(g0)) > 50, 'çizim tahmin edenin telefonunda canlı görünüyor');
assert((await inked(tv)) > 50, 'çizim Ana Ekran’da canlı görünüyor');
if (SHOTS) { await dp.screenshot({ path: `${SHOTS}/sk-drawer.png` }); await tv.screenshot({ path: `${SHOTS}/sk-tv.png` }); }

// Yanlış, sonra doğru tahmin
await g0.locator('#guess').fill('patates');
await g0.getByRole('button', { name: 'Tahmin' }).click();
await g1.getByText('patates?').waitFor({ timeout: 5000 });
assert(true, 'yanlış tahmin herkesin ekranında uçuştu');
if (SHOTS) await g1.screenshot({ path: `${SHOTS}/sk-guesser.png` });
await g1.locator('#guess').fill(word.toLocaleUpperCase('tr'));
await g1.getByRole('button', { name: 'Tahmin' }).click();
await g0.getByText(/bildi \(ilk!\)/).waitFor({ timeout: 5000 });
assert(true, 'doğru tahmin büyük harfle de kabul edildi, herkes “bildi” gördü');

// Süre dolunca sonuç: eser + bilenler
await pages[0].getByText(/^Eser:/).waitFor({ timeout: 100_000 });
const res = await pages[0].locator('main').innerText();
assert(res.includes(word), 'sonuçta kelime açıldı');
assert(/Bilenler: /.test(res), 'sonuçta bilenler listelendi');
if (SHOTS) await pages[0].screenshot({ path: `${SHOTS}/sk-result.png` });
assert(errors.length === 0, `sayfa hatası yok ${errors.join(' | ')}`);
console.log('Karakalem uçtan uca: hepsi geçti');
await browser.close();
