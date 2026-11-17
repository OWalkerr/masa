// Kart karnesi: canlı oyundaki "güldürdü / sıktı" oylarını kart metinleriyle birleştirir.
// Kullanım: npm run report:cards [-- --min 3]   (BASE ile başka adres verilebilir)
// Puan: (güldürdü - sıktı) / oy; az oylu kartlar için Wilson alt sınırı ile sıralanır.
import { readdirSync, readFileSync } from 'node:fs';

const BASE = process.env.BASE ?? 'https://masa.oguzhanwalkerr.workers.dev';
const minIdx = process.argv.indexOf('--min');
const MIN = minIdx > 0 ? Number(process.argv[minIdx + 1]) || 3 : 3;

interface Row { id: string; up: number; down: number; shown: number }
const texts = new Map<string, { text: string; type: string; deck: string }>();
for (const f of readdirSync('content/cards').filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(`content/cards/${f}`, 'utf8')) as { cards: { id: string; text: string; type: string; deck: string }[] };
  for (const c of d.cards) texts.set(c.id, c);
}

const res = await fetch(`${BASE}/api/card-stats`);
if (!res.ok) throw new Error(`istatistik alınamadı: ${res.status}`);
const { cards } = (await res.json()) as { cards: Row[] };

// Wilson alt sınırı (%90): az oyla şanslı çıkan kartı öne almaz
function wilson(up: number, n: number): number {
  if (!n) return 0;
  const z = 1.645, p = up / n;
  return (p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / (1 + (z * z) / n);
}

const rated = cards.filter((c) => c.up + c.down >= MIN).map((c) => ({ ...c, n: c.up + c.down, score: wilson(c.up, c.up + c.down) }));
const short = (id: string) => (texts.get(id)?.text ?? '(silinmiş kart)').replace(/\s+/g, ' ').slice(0, 90);
const line = (c: (typeof rated)[number]) => `${c.id.padEnd(18)} ${String(c.up).padStart(3)}↑ ${String(c.down).padStart(3)}↓  açıldı ${String(c.shown).padStart(4)}  ${short(c.id)}`;

const totalShown = cards.reduce((a, c) => a + c.shown, 0);
const totalVotes = cards.reduce((a, c) => a + c.up + c.down, 0);
console.log(`Toplam: ${cards.length} kart açıldı, ${totalShown} gösterim, ${totalVotes} oy. En az ${MIN} oyu olan: ${rated.length}.\n`);
const best = [...rated].sort((a, b) => b.score - a.score).slice(0, 20);
const worst = [...rated].sort((a, b) => wilson(b.down, b.n) - wilson(a.down, a.n)).slice(0, 20);
console.log('— En çok güldürenler —');
best.forEach((c) => console.log(line(c)));
console.log('\n— En çok sıkanlar (ayıklama adayları) —');
worst.filter((c) => c.down > c.up).forEach((c) => console.log(line(c)));
const never = [...texts.keys()].filter((id) => !cards.some((c) => c.id === id));
console.log(`\nHiç açılmamış kart: ${never.length}`);
