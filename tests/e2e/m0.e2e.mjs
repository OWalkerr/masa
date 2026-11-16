// M0 uçtan uca: /dev/table ile 4 telefon oturur, yenileyen aynı koltuğa döner, host düşünce devredilir.
// Kullanım: BASE=http://127.0.0.1:4173 node tests/e2e/m0.e2e.mjs
import { createRequire } from 'node:module';
// Playwright ortamda global kurulu olabilir; require çözümlemesi NODE_PATH'i de dener
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const SHOTS = process.env.SHOTS;
const assert = (c, m) => { if (!c) throw new Error('BAŞARISIZ: ' + m); console.log('✓', m); };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', (e) => console.error('sayfa hatası', e));
await page.goto(`${BASE}/dev/table`);
await page.getByRole('button', { name: /Masa kur/ }).click();
await page.waitForURL(/code=/);
const code = new URL(page.url()).searchParams.get('code');
assert(/^[A-Z]{4}$/.test(code), `masa kuruldu: ${code}`);

const frame = (i) => page.frameLocator(`iframe[title="Telefon ${i}"]`);
// 4 telefon sırayla oturur
for (let i = 1; i <= 4; i++) await frame(i).getByText('Masa kodu').waitFor({ timeout: 20000 });
await frame(4).getByText('4 kişi · 4 çevrimiçi').waitFor({ timeout: 10000 });
assert(true, '4 telefon lobide, 4 çevrimiçi');
assert(await frame(1).getByRole('button', { name: 'Başlat' }).isVisible(), 'ilk telefon host, Başlat görünüyor');
assert(await frame(2).getByText(/Ayşe başlatınca/).isVisible(), 'diğerleri host bekliyor');
if (SHOTS) await page.screenshot({ path: `${SHOTS}/devtable.png` });

// Yenile: aynı koltuğa dönüş
await page.getByRole('button', { name: 'Yenile' }).nth(1).click();
await frame(2).getByText('Masa kodu').waitFor({ timeout: 15000 });
await frame(2).getByText('Mehmet (sen)').waitFor({ timeout: 5000 });
await frame(1).getByText('4 kişi · 4 çevrimiçi').waitFor({ timeout: 5000 });
assert(true, 'yenilenen telefon aynı koltuğa döndü (hâlâ 4 kişi)');

// Host düşer: 10 sn sonra en eski bağlı oyuncu (Mehmet) host olur
await page.getByRole('button', { name: 'Kopar' }).first().click();
await frame(2).getByText('4 kişi · 3 çevrimiçi').waitFor({ timeout: 10000 });
await frame(2).getByRole('button', { name: 'Başlat' }).waitFor({ timeout: 20000 });
assert(true, 'host koptu, hostluk Mehmet’e geçti');

// Ayar değişikliği herkese canlı gider
await frame(2).getByRole('radio', { name: /Alkolsüz/ }).click();
await frame(3).getByRole('radio', { name: /Alkolsüz/, checked: true }).waitFor({ timeout: 5000 });
assert(true, 'ayar değişikliği canlı yayıldı');

// Başlat
await frame(2).getByRole('button', { name: 'Başlat' }).click();
await frame(3).getByText('Perde 1: Isınma').waitFor({ timeout: 5000 });
assert(true, 'oyun başladı, herkes perdeyi görüyor');
if (SHOTS) await page.screenshot({ path: `${SHOTS}/devtable-started.png` });

// Botlu masa
const r = await page.request.post(`${BASE}/api/rooms?bots=3`);
const { code: botCode } = await r.json();
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await phone.goto(`${BASE}/m/${botCode}`);
await phone.getByLabel('Masadaki adın').fill('Oğuzhan');
if (SHOTS) await phone.screenshot({ path: `${SHOTS}/join.png`, fullPage: true });
await phone.getByRole('button', { name: 'Masaya Otur' }).click();
await phone.getByText('4 kişi · 4 çevrimiçi').waitFor({ timeout: 10000 });
assert(true, '?bots=3 ile kurulan masaya 3 bot oturdu');
if (SHOTS) await phone.screenshot({ path: `${SHOTS}/lobby.png`, fullPage: true });
await phone.goto(BASE);
if (SHOTS) await phone.screenshot({ path: `${SHOTS}/home.png` });
await browser.close();
console.log('M0 uçtan uca: hepsi geçti');
