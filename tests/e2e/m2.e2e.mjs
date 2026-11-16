// M2 uçtan uca: 4 tarayıcı bağlamı Kaos modunda tam bir Kısa oyun oynar.
// Kural/lanet, Yakala! oylaması, düello/ayna/itiraf ekranları, Pas/Veto, masa olayı ve final görülür.
// Kullanım: BASE=http://127.0.0.1:4173 [SHOTS=klasör] node tests/e2e/m2.e2e.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const SHOTS = process.env.SHOTS;
const assert = (c, m) => { if (!c) throw new Error('BAŞARISIZ: ' + m); console.log('✓', m); };
const NAMES = ['Ayşe', 'Mehmet', 'Zeynep', 'Can'];

const browser = await chromium.launch();
const errors = [];
const { code } = await (await (await browser.newContext()).request.post(`${BASE}/api/rooms`)).json();
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
await pages[0].getByRole('radio', { name: /Kaos/ }).click();
await pages[0].getByRole('radio', { name: /Kısa/ }).click();
await pages[0].getByRole('button', { name: 'Başlat' }).click();
for (const p of pages) await p.getByText('Perde 1').first().waitFor({ timeout: 10000 });
assert(true, `masa ${code}: Kaos + Kısa başladı`);

const seen = new Set();
const shot = async (p, key) => {
  if (seen.has(key)) return;
  seen.add(key);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/m2-${key}.png` });
};
let caught = false;
let vetoed = false;
const deadline = Date.now() + 12 * 60_000;

async function act(p, i) {
  const t = await p.locator('body').innerText().catch(() => '');
  if (t.includes('Yakalandı!')) {
    await shot(p, 'catchvote');
    const b = p.getByRole('button', { name: 'Bozdu' });
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
    return;
  }
  if (t.includes('Kural masada')) await shot(p, 'rule');
  if (t.includes('Lanet tuttu')) await shot(p, 'curse');
  if (t.includes('Masa Olayı')) await shot(p, 'tableEvent');
  if (t.includes('Son Kadeh') || t.includes('Son Çay')) await shot(p, 'finale');
  // bir kez Yakala!
  if (!caught && i === 3) {
    const y = p.getByRole('button', { name: /Yakala! Kuralı/ });
    if (await y.isVisible().catch(() => false)) {
      await y.click();
      const rule = p.locator('[role=dialog] button').first();
      await rule.click().catch(() => {});
      const suspect = p.locator('[role=dialog] .grid button').first();
      if (await suspect.isVisible().catch(() => false)) {
        await suspect.click();
        caught = true;
      } else await p.getByRole('button', { name: 'Vazgeç' }).click().catch(() => {});
      return;
    }
  }
  if (t.includes('Sıra sende. Bir kart seç') || t.includes('Hayalet Saati')) {
    const b = p.getByRole('button', { name: 'Oyna' });
    if (await b.isEnabled().catch(() => false)) { await p.waitForTimeout(300); await b.click().catch(() => {}); }
  } else if (t.includes('Kart kime gidiyor') || t.includes('iki kişiyi seç')) {
    const n = t.includes('iki kişiyi') ? 2 : 1;
    for (let k = 0; k < n; k++) await p.locator('[aria-pressed]').nth(k).click().catch(() => {});
    await p.getByRole('button', { name: 'Seç', exact: true }).click().catch(() => {});
  } else if (t.includes('Kazanan kim?')) {
    await shot(p, 'duel');
    await p.locator('main .relative.flex button').first().click().catch(() => {});
  } else if (t.includes('Anonim yaz.')) {
    await shot(p, 'confessWrite');
    await p.locator('#confess').fill(`${NAMES[i]} gizlice <b>pasta</b> yer`).catch(() => {});
    await p.getByRole('button', { name: 'Gönder' }).click().catch(() => {});
  } else if (t.includes('Spot ışığındakini kim yazdı')) {
    await shot(p, 'confessGuess');
    await p.locator('main .grid button').first().click().catch(() => {});
  } else if (t.includes('Gizlice seç. Kimse') || t.includes('Tahmin et.')) {
    await shot(p, 'mirror');
    await p.locator('main .grid button').nth(i % 2).click().catch(() => {});
  } else if (t.includes('Gizlice birini seç') || t.includes('Kimi seçiyorsun')) {
    await p.locator('main .grid button').nth((i + 1) % 3).click().catch(() => {});
  } else if (t.includes('Dürüst ol')) {
    if (!vetoed && i === 2) {
      await p.getByRole('button', { name: /Anonim veto/ }).click().catch(() => {});
      await p.getByRole('button', { name: /Eminim, veto/ }).click().catch(() => {});
      vetoed = true;
      return;
    }
    await p.getByRole('button', { name: i % 2 ? 'Yaptım' : 'Yapmadım' }).click().catch(() => {});
  } else if (t.includes('görevi yaptı mı')) {
    await p.getByRole('button', { name: i % 2 ? 'Yaptı' : 'Yapmadı' }).click().catch(() => {});
  } else if (t.includes('Yapmayanları işaretle')) {
    await p.getByRole('button', { name: /Herkes yaptı|Hükmü ver/ }).click().catch(() => {});
  } else if (t.includes('Cebinde bir şey var')) {
    await shot(p, 'powerReact');
    await p.getByRole('button', { name: 'Kalkan kaldır' }).click().catch(() => {});
  }
  if (t.includes('Veto!')) await shot(p, 'veto');
}

while (Date.now() < deadline) {
  if (await pages[0].getByText('Gecenin Özeti').isVisible().catch(() => false)) break;
  await Promise.all(pages.map((p, i) => act(p, i)));
  await pages[0].waitForTimeout(250);
}
for (const p of pages) await p.getByText('Gecenin Özeti').waitFor({ timeout: 20000 });
assert(true, 'tüm telefonlar Gecenin Özeti’nde');
console.log('görülen ekranlar:', [...seen].join(', '));
assert(seen.has('rule') || seen.has('curse'), 'kural ya da lanet masaya kondu');
assert(seen.has('tableEvent'), 'masa olayı ya da Su Molası geldi');
assert(seen.has('finale'), 'final kartı geldi');
assert(caught && seen.has('catchvote'), 'Yakala! oylaması tüm ekranlarda açıldı');
assert(errors.length === 0, `sayfa hatası yok ${errors.join(' | ')}`);
await browser.close();
console.log('M2 uçtan uca: hepsi geçti');
