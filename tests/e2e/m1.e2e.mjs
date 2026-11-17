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
  p.setDefaultTimeout(4000);
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
const shots = new Set();
let actions = 0;
const deadline = Date.now() + 12 * 60_000;
// Her telefon ekranda ne görüyorsa onu yapar
async function act(p, i) {
  const t = await p.locator('main').innerText().catch(() => '');
  for (const [key, re] of [['drink', /Ceza!|İçiyor!/], ['missionMine', /Görevin var/], ['lie', /hangisi yalan/], ['scale', /kaç dedi/], ['secret', /Gizli kelimen/], ['hostNext', /Sonraki kart →/], ['judge', /hüküm verecek/], ['choose', /Sıra sende: elindeki/]]) {
    if (re.test(t) && !shots.has(key)) {
      shots.add(key);
      if (process.env.SHOTS) await p.screenshot({ path: `${process.env.SHOTS}/m1-${key}.png` });
    }
  }
  const m = t.match(/Perde (\d)/);
  if (m) acts.add(m[1]);
  if (t.includes('Sıra sende. Bir kart seç')) {
    const b = p.getByRole('button', { name: 'Oyna', exact: true });
    if (await b.isEnabled().catch(() => false)) { await p.waitForTimeout(400); await b.click().catch(() => {}); actions++; }
  } else if (t.includes('Kart kime gidiyor') || t.includes('iki kişiyi seç')) {
    const opts = p.locator('main section [aria-pressed]');
    const n = t.includes('iki kişiyi') ? 2 : 1;
    for (let k = 0; k < n; k++) await opts.nth(k).click().catch(() => {});
    await p.getByRole('button', { name: 'Seç' }).click().catch(() => {});
    actions++;
  } else if (/Gizlice seç\. Kimse|Tahmin et\.|hangisi yalan|Gizli puanını ver|Üç şey söyle/.test(t)) {
    await p.locator('main .grid button').nth(i % 2).click().catch(() => {});
    actions++;
  } else if (t.includes('Kazanan kim?')) {
    await p.locator('main .relative.flex button').first().click().catch(() => {});
  } else if (t.includes('Gizlice birini seç') || t.includes('Kimi seçiyorsun')) {
    await p.locator('main .grid button').nth((i + 1) % 3).click().catch(() => {});
    actions++;
  } else if (t.includes('Dürüst ol')) {
    await p.getByRole('button', { name: i % 2 ? 'Yaptım' : 'Yapmadım' }).click().catch(() => {});
    actions++;
  } else if (/görevi yaptı mı|dürüstçe cevapladı mı|kelimeyi bildi mi/.test(t)) {
    await p.getByRole('button', { name: actions % 3 ? /^(Yaptı|Cevapladı|Bildi)$/ : /^(Yapmadı|Kaçtı|Bilemedi)/ }).click().catch(() => {});
    actions++;
  } else if (t.includes('Yapmayanları işaretle')) {
    await p.getByRole('button', { name: /Herkes yaptı|Hükmü ver/ }).click().catch(() => {});
    actions++;
  } else if (t.includes('Anonim yaz.')) {
    await p.locator('#confess').fill(`${NAMES[i]} yazdı`).catch(() => {});
    await p.getByRole('button', { name: 'Gönder' }).click().catch(() => {});
  } else if (t.includes('Spot ışığındakini kim yazdı')) {
    await p.locator('main .grid button').first().click().catch(() => {});
  }
  // Rahat tempo: yalnızca host ilerletir; uyuyan biri olursa "beklemeden geç"
  if (i === 0) {
    const next = p.getByRole('button', { name: /^(Sonraki kart →|Gecenin özetine geç)$/ });
    if (await vis(next)) {
      hostAdvances++;
      await p.waitForTimeout(500);
      await next.click().catch(() => {});
    }
    const skip = p.getByRole('button', { name: /Beklemeden geç|Okuyucu yerine kart oynat|Hükümsüz geç/ });
    if (await vis(skip)) await skip.click().catch(() => {});
  } else if (await vis(p.getByRole('button', { name: /^Sonraki kart →$/ }))) {
    nonHostButton = true;
  }
}
let hostAdvances = 0;
let nonHostButton = false;

let lastLog = 0;
while (Date.now() < deadline) {
  if (await vis(pages[0].getByText('Gecenin Özeti', { exact: true }))) break;
  if (Date.now() - lastLog > 30000) {
    lastLog = Date.now();
    console.log('…', (await pages[0].locator('[role=status]').first().innerText().catch(() => '?')), '| host ilerletme:', hostAdvances);
  }
  await Promise.all(pages.map((p, i) => act(p, i)));
  await pages[0].waitForTimeout(300);
}
if (!(await vis(pages[0].getByText('Gecenin Özeti', { exact: true })))) {
  for (let k = 0; k < pages.length; k++) {
    console.log(`--- ${NAMES[k]}:`, (await pages[k].locator('main').innerText().catch(() => '')).slice(0, 600).replace(/\n+/g, ' | '));
    if (process.env.SHOTS) await pages[k].screenshot({ path: `${process.env.SHOTS}/stuck-${k}.png` });
  }
}
for (const p of pages) await p.getByText('Gecenin Özeti', { exact: true }).waitFor({ timeout: 15000 });
assert(true, `tüm telefonlar Gecenin Özeti'nde (${actions} eylem)`);
assert(hostAdvances >= 18, `rahat tempo: host ${hostAdvances} kez “Sonraki kart” dedi`);
assert(!nonHostButton, 'Sonraki kart düğmesi yalnızca host’ta');
assert(['1', '2', '3'].every((a) => acts.has(a)), '3 perde de oynandı');
const played = await pages[1].getByText(/kart oynandı/).innerText();
assert(/^18 kart/.test(played), `Kısa oyun: ${played}`);
assert(await vis(pages[0].getByText('Burada yatıyor:').first()), 'mezar taşı ödülleri göründü');
assert(errors.length === 0, `sayfa hatası yok ${errors.join(' | ')}`);
if (process.env.SHOTS) await pages[0].screenshot({ path: `${process.env.SHOTS}/summary.png`, fullPage: true });

await pages[1].getByRole('button', { name: 'Gecenin Afişi' }).click();
await pages[1].getByRole('img', { name: 'Gecenin Afişi' }).waitFor({ timeout: 15000 });
const posterW = await pages[1].getByRole('img', { name: 'Gecenin Afişi' }).evaluate((img) => img.naturalWidth);
assert(posterW === 1080, `Gecenin Afişi çizildi (${posterW} px)`);
if (process.env.SHOTS) await pages[1].screenshot({ path: `${process.env.SHOTS}/poster-sheet.png` });
await pages[1].getByRole('button', { name: 'Kapat' }).click();
await pages[0].getByRole('button', { name: 'Rövanş' }).click();
for (const p of pages) await p.getByText('Masa kodu').waitFor({ timeout: 10000 });
assert(true, 'Rövanş ile herkes lobiye döndü');
await browser.close();
console.log('M1 uçtan uca: hepsi geçti');
