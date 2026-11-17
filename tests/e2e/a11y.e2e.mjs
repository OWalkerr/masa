// Erişilebilirlik denetimi: axe-core ile giriş, lobi ve oyunun her fazı (telefon) + Ana Ekran.
// Kullanım: BASE=http://127.0.0.1:4173 node tests/e2e/a11y.e2e.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const AXE = require('node:fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch();
const found = new Map(); // kural id -> { impact, help, where:Set, nodes:Set }

async function audit(page, where) {
  await page.addScriptTag({ content: AXE }).catch(() => {});
  const res = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, { resultTypes: ['violations'], runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary ?? '').split('\n')[1]) }));
  });
  for (const v of res) {
    const f = found.get(v.id) ?? { impact: v.impact, help: v.help, where: new Set(), nodes: new Set() };
    f.where.add(where);
    v.nodes.forEach((n) => f.nodes.add(n));
    found.set(v.id, f);
  }
}

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
p.setDefaultTimeout(4000);
await p.goto(BASE);
await p.waitForTimeout(800);
await audit(p, 'giriş');
const { code } = await (await ctx.request.post(`${BASE}/api/rooms?bots=3`)).json();
await p.goto(`${BASE}/m/${code}`);
await p.getByRole('button', { name: /Masaya otur|Otur/ }).first().waitFor({ timeout: 15000 }).catch(() => {});
await audit(p, 'katılım');
await p.goto(`${BASE}/m/${code}?autojoin=1&name=Deneme&avatar=2`);
await p.getByText('Masa kodu').waitFor({ timeout: 15000 });
await p.waitForTimeout(1500);
await audit(p, 'lobi');
await p.getByRole('button', { name: 'Başlat' }).click();

const tv = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await tv.goto(`${BASE}/tv/${code}`);

const seen = new Set();
const deadline = Date.now() + 6 * 60_000;
while (Date.now() < deadline && seen.size < 9) {
  const t = await p.locator('main').innerText().catch(() => '');
  let key = null;
  if (t.includes('Sıra sende: elindeki')) key = 'el';
  else if (t.includes('Kart kime gidiyor')) key = 'hedef';
  else if (t.includes('Gizlice birini seç')) key = 'oy';
  else if (t.includes('Dürüst ol')) key = 'evethayır';
  else if (/görevi yaptı mı|cevapladı mı|bildi mi/.test(t)) key = 'hüküm';
  else if (t.includes('Sonraki kart')) key = 'sonuç';
  else if (t.includes('kart seçiyor') || t.includes('kartlara bakıyor')) key = 'bekleme';
  if (key && !seen.has(key)) {
    seen.add(key);
    await p.waitForTimeout(700);
    await audit(p, key);
    if (key === 'sonuç') await audit(tv, 'TV');
  }
  if (key === 'el') await p.getByRole('button', { name: 'Oyna', exact: true }).click().catch(() => {});
  else if (key === 'hedef') {
    await p.locator('main section [aria-pressed]').first().click().catch(() => {});
    await p.getByRole('button', { name: 'Seç', exact: true }).click().catch(() => {});
  } else if (key === 'oy') await p.locator('main .grid button').first().click().catch(() => {});
  else if (key === 'evethayır') await p.getByRole('button', { name: 'Yapmadım' }).click().catch(() => {});
  else if (key === 'hüküm') await p.getByRole('button', { name: /^(Yaptı|Cevapladı|Bildi)$/ }).click().catch(() => {});
  else if (key === 'sonuç') await p.getByRole('button', { name: /Sonraki kart|özetine geç/ }).click().catch(() => {});
  await p.waitForTimeout(400);
}
console.log('denetlenen ekranlar:', [...seen].join(', '));
for (const [id, f] of found) {
  console.log(`\n✗ ${id} [${f.impact}] ${f.help}\n   ekranlar: ${[...f.where].join(', ')}`);
  [...f.nodes].slice(0, 5).forEach((n) => console.log('   -', n));
}
if (!found.size) console.log('✓ axe ihlali yok');
await browser.close();
process.exit(found.size ? 1 : 0);
