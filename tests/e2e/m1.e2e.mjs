// M1 uçtan uca: 4 tarayıcı bağlamı tam bir Kısa oyunu (3 perde) baştan sona oynar, Gecenin Özeti'ne ulaşır.
// Kullanım: BASE=http://127.0.0.1:4173 node tests/e2e/m1.e2e.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const assert = (c, m) => { if (!c) throw new Error('BAŞARISIZ: ' + m); console.log('✓', m); };
const NAMES = ['Ayşe', 'Mehmet', 'Zeynep', 'Can'];

const browser = await chromium.launch();
const errors = [];
const r = await (await browser.newContext()).request.post(`${BASE}/api/rooms`);
const { code } = await r.json();
const pages = [];
for (let i = 0; i < 4; i++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(`${NAMES[i]}: ${e.message}`));
  await p.goto(`${BASE}/m/${code}?autojoin=1&name=${NAMES[i]}&avatar=${i * 3}`);
  await p.getByText('Masa kodu').waitFor({ timeout: 20000 });
  pages.push(p);
}
await pages[0].getByText('4 kişi · 4 çevrimiçi').waitFor();
await pages[0].getByRole('radio', { name: /Kısa/ }).click();
await pages[0].getByRole('radio', { name: /Alkolsüz/ }).click();
await pages[0].getByRole('button', { name: 'Başlat' }).click();
for (const p of pages) await p.getByText('Perde 1').first().waitFor({ timeout: 10000 });
assert(true, `masa ${code}: 4 oyuncu, Kısa + alkolsüz başladı`);

const vis = (loc) => loc.isVisible().catch(() => false);
let acts = new Set();
let actions = 0;
const deadline = Date.now() + 9 * 60_000;
// Her telefon ekranda ne görüyorsa onu yapar
async function act(p, i) {
  const t = await p.locator('main').innerText().catch(() => '');
  const m = t.match(/Perde (\d)/);
  if (m) acts.add(m[1]);
  if (t.includes('Sıra sende. Bir kart seç')) {
    const b = p.getByRole('button', { name: 'Oyna' });
    if (await b.isEnabled().catch(() => false)) { await p.waitForTimeout(400); await b.click().catch(() => {}); actions++; }
  } else if (t.includes('Kart kime gidiyor') || t.includes('iki kişiyi seç')) {
    const opts = p.locator('[aria-pressed]');
    const n = t.includes('iki kişiyi') ? 2 : 1;
    for (let k = 0; k < n; k++) await opts.nth(k).click().catch(() => {});
    await p.getByRole('button', { name: 'Seç' }).click().catch(() => {});
    actions++;
  } else if (t.includes('Gizlice birini seç')) {
    await p.locator('main .grid button').nth((i + 1) % 3).click().catch(() => {});
    actions++;
  } else if (t.includes('Dürüst ol')) {
    await p.getByRole('button', { name: i % 2 ? 'Yaptım' : 'Yapmadım' }).click().catch(() => {});
    actions++;
  } else if (t.includes('görevi yaptı mı')) {
    await p.getByRole('button', { name: actions % 3 ? 'Yaptı' : 'Yapmadı' }).click().catch(() => {});
    actions++;
  } else if (t.includes('Yapmayanları işaretle')) {
    await p.getByRole('button', { name: /Herkes yaptı|Hükmü ver/ }).click().catch(() => {});
    actions++;
  }
}

while (Date.now() < deadline) {
  if (await vis(pages[0].getByText('Gecenin Özeti'))) break;
  await Promise.all(pages.map((p, i) => act(p, i)));
  await pages[0].waitForTimeout(300);
}
for (const p of pages) await p.getByText('Gecenin Özeti').waitFor({ timeout: 15000 });
assert(true, `tüm telefonlar Gecenin Özeti'nde (${actions} eylem)`);
assert(['1', '2', '3'].every((a) => acts.has(a)), '3 perde de oynandı');
const played = await pages[1].getByText(/kart oynandı/).innerText();
assert(/^18 kart/.test(played), `Kısa oyun: ${played}`);
assert(await vis(pages[0].getByText('Burada yatıyor:').first()), 'mezar taşı ödülleri göründü');
assert(errors.length === 0, `sayfa hatası yok ${errors.join(' | ')}`);
if (process.env.SHOTS) await pages[0].screenshot({ path: `${process.env.SHOTS}/summary.png`, fullPage: true });

await pages[0].getByRole('button', { name: 'Tekrar Oyna' }).click();
for (const p of pages) await p.getByText('Masa kodu').waitFor({ timeout: 10000 });
assert(true, 'Tekrar Oyna ile herkes lobiye döndü');
await browser.close();
console.log('M1 uçtan uca: hepsi geçti');
