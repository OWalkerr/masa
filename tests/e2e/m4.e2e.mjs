// M4 dayanıklılık: 6 telefon, rahat tempo, tam Kısa oyun. Oyun sırasında:
//  - bir telefon sayfayı yeniler, biri 25 sn kopup geri gelir,
//  - host 15 sn kaybolur (hostluk devredilir, oyun yeni hostla ilerler), sonra geri döner,
//  - ajan görevini "yaptım" der, masa oylar.
// Hiçbir telefon kilitlenmeden herkes Gecenin Özeti'ne ulaşmalı.
// Kullanım: BASE=http://127.0.0.1:4173 [SHOTS=klasör] node tests/e2e/m4.e2e.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const SHOTS = process.env.SHOTS;
const assert = (c, m) => { if (!c) throw new Error('BAŞARISIZ: ' + m); console.log('✓', m); };
const NAMES = ['Ayşe', 'Mehmet', 'Zeynep', 'Can', 'Elif', 'Burak'];
const vis = (loc) => loc.isVisible().catch(() => false);

const browser = await chromium.launch();
const errors = [];
const { code } = await (await (await browser.newContext()).request.post(`${BASE}/api/rooms`)).json();
const ctxs = [];
const pages = [];
const gone = new Set(); // şu an kopuk olan telefonlar

async function openPage(i, url) {
  const p = await ctxs[i].newPage();
  p.setDefaultTimeout(4000);
  p.on('pageerror', (e) => errors.push(`${NAMES[i]}: ${e.message}`));
  await p.goto(url);
  pages[i] = p;
  return p;
}

for (let i = 0; i < 6; i++) {
  ctxs[i] = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await openPage(i, `${BASE}/m/${code}?autojoin=1&name=${NAMES[i]}&avatar=${i * 2}`);
  await p.getByText('Masa kodu').waitFor({ timeout: 20000 });
}
await pages[0].getByText('6 kişi · 6 çevrimiçi').waitFor();
await pages[0].getByRole('radio', { name: /Kısa/ }).click();
await pages[0].getByRole('button', { name: 'Başlat' }).click();
for (const p of pages) await p.getByText('Perde 1').first().waitFor({ timeout: 10000 });
assert(true, `masa ${code}: 6 oyuncu, Klasik + Kısa + rahat tempo başladı`);

let advances = 0;
const advancers = new Set();
let missionClaimed = false;
let missionVoteSeen = false;

async function act(p, i) {
  const t = await p.locator('body').innerText().catch(() => '');
  // Yakala!/görev oylaması önce
  if (t.includes('Görev tamam mı?')) {
    missionVoteSeen = true;
    await p.getByRole('button', { name: 'Yaptı', exact: true }).click().catch(() => {});
    return;
  }
  if (t.includes('Yakalandı!')) {
    await p.getByRole('button', { name: i % 2 ? 'Bozdu' : 'Bozmadı' }).click().catch(() => {});
    return;
  }
  if (!missionClaimed && t.includes('Görevin var! · dokun')) {
    await p.getByRole('button', { name: /aktif kural/ }).click().catch(() => {});
    const done = p.getByRole('button', { name: 'Görevi yaptım!' });
    if (await done.isVisible({ timeout: 1500 }).catch(() => false)) {
      await done.click().catch(() => {});
      missionClaimed = true;
      if (SHOTS) await p.screenshot({ path: `${SHOTS}/m4-mission-claim.png` });
    }
    return;
  }
  if (t.includes('Sıra sende. Bir kart seç') || t.includes('Hayalet Saati: kartlar kapalı')) {
    const b = p.getByRole('button', { name: 'Oyna', exact: true });
    if (await b.isEnabled().catch(() => false)) { await p.waitForTimeout(300); await b.click().catch(() => {}); }
  } else if (t.includes('Kart kime gidiyor') || t.includes('iki kişiyi seç')) {
    const n = t.includes('iki kişiyi') ? 2 : 1;
    for (let k = 0; k < n; k++) await p.locator('main section [aria-pressed]').nth(k).click().catch(() => {});
    await p.getByRole('button', { name: 'Seç', exact: true }).click().catch(() => {});
  } else if (/Gizlice seç\. Kimse|Tahmin et\.|hangisi yalan|Gizli puanını ver|Üç şey söyle/.test(t)) {
    await p.locator('main .grid button').nth(i % 3).click().catch(() => {});
  } else if (t.includes('Kazanan kim?')) {
    await p.locator('main .relative.flex button').nth(i % 2).click().catch(() => {});
  } else if (t.includes('Gizlice birini seç') || t.includes('Kimi seçiyorsun')) {
    await p.locator('main .grid button').nth((i + 1) % 4).click().catch(() => {});
  } else if (t.includes('Dürüst ol')) {
    await p.getByRole('button', { name: i % 2 ? 'Yaptım' : 'Yapmadım' }).click().catch(() => {});
  } else if (/görevi yaptı mı|dürüstçe cevapladı mı|kelimeyi bildi mi/.test(t)) {
    await p.getByRole('button', { name: i % 2 ? /^(Yaptı|Cevapladı|Bildi)$/ : /^(Yapmadı|Kaçtı|Bilemedi)/ }).click().catch(() => {});
  } else if (t.includes('Yapmayanları işaretle')) {
    await p.getByRole('button', { name: /Herkes yaptı|Hükmü ver/ }).click().catch(() => {});
  } else if (t.includes('Anonim yaz.')) {
    await p.locator('#confess').fill(`${NAMES[i]} bir şey itiraf etti`).catch(() => {});
    await p.getByRole('button', { name: 'Gönder' }).click().catch(() => {});
  } else if (t.includes('Spot ışığındakini kim yazdı')) {
    await p.locator('main .grid button').nth(i % 3).click().catch(() => {});
  }
  // Masayı kim yönetiyorsa o ilerletir (host kaybolunca devralan)
  const next = p.getByRole('button', { name: /^(Sonraki kart →|Gecenin özetine geç)$/ });
  if (await vis(next)) {
    await p.waitForTimeout(400);
    await next.click().catch(() => {});
    advances++;
    advancers.add(i);
  }
  const skip = p.getByRole('button', { name: /Beklemeden geç|Okuyucu yerine kart oynat|Hükümsüz geç/ });
  if (await vis(skip)) await skip.click().catch(() => {});
}

// Kesinti senaryosu (oyun başlangıcından itibaren saniye)
const t0 = Date.now();
const plan = [
  { at: 15, done: false, run: async () => { console.log('↻ Zeynep sayfayı yeniliyor'); await pages[2].reload(); } },
  { at: 35, done: false, run: async () => {
    console.log('✕ Can 25 sn kopuyor');
    gone.add(3);
    await pages[3].close();
    setTimeout(async () => { await openPage(3, `${BASE}/m/${code}`); gone.delete(3); console.log('✓ Can geri döndü'); }, 25_000);
  } },
  { at: 70, done: false, run: async () => {
    console.log('✕ host Ayşe 15 sn kayboluyor');
    gone.add(0);
    await pages[0].close();
    setTimeout(async () => { await openPage(0, `${BASE}/m/${code}`); gone.delete(0); console.log('✓ Ayşe geri döndü'); }, 15_000);
  } },
  { at: 95, done: false, run: async () => { console.log('↻ Mehmet sayfayı yeniliyor'); await pages[1].reload(); } },
];

const deadline = Date.now() + 15 * 60_000;
let lastLog = 0;
const live = () => pages.map((p, i) => [p, i]).filter(([, i]) => !gone.has(i));
while (Date.now() < deadline) {
  if (!gone.size && (await Promise.all(pages.map((p) => vis(p.getByText('Gecenin Özeti', { exact: true }))))).every(Boolean)) break;
  const s = (Date.now() - t0) / 1000;
  for (const step of plan) if (!step.done && s >= step.at) { step.done = true; await step.run(); }
  if (Date.now() - lastLog > 30_000) {
    lastLog = Date.now();
    const line = await pages[1].locator('[role=status]').first().innerText().catch(() => '?');
    console.log(`… ${Math.round(s)} sn | ${line} | ilerletme: ${advances}`);
  }
  await Promise.all(live().map(([p, i]) => act(p, i)));
  await new Promise((r) => setTimeout(r, 250));
}

for (const p of pages) await p.getByText('Gecenin Özeti', { exact: true }).waitFor({ timeout: 20000 });
assert(true, 'altı telefonun hepsi Gecenin Özeti’nde');
assert(plan.every((x) => x.done), 'tüm kesintiler uygulandı (yenileme, 25 sn kopma, host kaybı)');
assert(advancers.has(0) && [...advancers].some((i) => i !== 0), `host kaybolunca başkası ilerletti (ilerletenler: ${[...advancers].map((i) => NAMES[i]).join(', ')})`);
const played = await pages[2].getByText(/kart oynandı/).innerText();
assert(/^18 kart/.test(played), `Kısa oyun tamam: ${played}`);
console.log(missionClaimed ? (missionVoteSeen ? '✓ ajan “yaptım” dedi, masa oyladı' : '· ajan “yaptım” dedi ama oylama görülmedi') : '· bu oyunda ajana görev düşmedi');
// Geri dönenler koltuğuna oturdu mu: özet ekranında "Tekrar Oyna" yalnızca host'ta, herkes kendi adını görür
assert(errors.length === 0, `sayfa hatası yok ${errors.join(' | ')}`);
if (SHOTS) await pages[3].screenshot({ path: `${SHOTS}/m4-summary.png`, fullPage: true });
console.log('M4 dayanıklılık: hepsi geçti');
await browser.close();
