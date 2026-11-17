// Sergi: herkes aynı konuyu aynı anda çizer; eserler isimsiz bir galeride açılır, masa en kötüsünü oylar, sanatçısı içer.
// Çizim sırasında kimse başkasının tuvalini görmez (sürpriz galeride).
import { IntentError, type GalleryState, type TurnResult } from './types';
import type { Rng } from './rng';

export const GALLERY = {
  defaultSec: 45,
  maxSegNums: 160,
  maxNumsPerPlayer: 3000,
  maxStrokes: 120,
} as const;

export function newGallery(now: number, sec: number, prompt: string): GalleryState {
  return { prompt, stage: 'draw', startAt: now + 2500, endsAt: now + 2500 + sec * 1000, drawings: {}, done: [], order: [], votes: {} };
}

export function galleryDraw(g: GalleryState, now: number, by: string, nums: number[], fresh: boolean) {
  if (g.stage !== 'draw') throw new IntentError('BAD_PHASE', 'Çizim süresi bitti.');
  if (now > g.endsAt + 400) throw new IntentError('TIME', 'Süre doldu.');
  if (g.done.includes(by)) throw new IntentError('DONE', 'Eserini teslim ettin.');
  if (nums.length % 2 !== 0 || nums.length > GALLERY.maxSegNums || nums.some((v) => !Number.isInteger(v) || v < 0 || v > 1000))
    throw new IntentError('BAD_INPUT', 'Geçersiz çizgi.');
  const mine = (g.drawings[by] ??= []);
  const total = mine.reduce((a, s) => a + s.length, 0);
  if (total + nums.length > GALLERY.maxNumsPerPlayer) throw new IntentError('FULL', 'Tuval doldu.');
  if (fresh || !mine.length) {
    if (mine.length >= GALLERY.maxStrokes) throw new IntentError('FULL', 'Çok fazla çizgi.');
    mine.push([...nums]);
  } else mine[mine.length - 1]!.push(...nums);
}

export function galleryUndo(g: GalleryState, by: string, clear: boolean) {
  if (g.stage !== 'draw' || g.done.includes(by)) throw new IntentError('BAD_PHASE', 'Artık değiştiremezsin.');
  const mine = g.drawings[by] ?? [];
  if (clear) g.drawings[by] = [];
  else mine.pop();
}

export function galleryDone(g: GalleryState, by: string) {
  if (g.stage !== 'draw') throw new IntentError('BAD_PHASE', 'Çizim bitti.');
  if (!g.done.includes(by)) g.done.push(by);
}

// Ramer–Douglas–Peucker: galeride gönderilecek çizgiyi seyreltir (görünüş aynı, veri küçük)
export function simplify(s: number[], eps = 4): number[] {
  const n = s.length / 2;
  if (n <= 2) return s;
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const ax = s[a * 2]!, ay = s[a * 2 + 1]!, bx = s[b * 2]!, by = s[b * 2 + 1]!;
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * s[i * 2]! - dx * s[i * 2 + 1]! + bx * ay - by * ax) / len;
      if (d > best) { best = d; bi = i; }
    }
    if (best > eps) {
      keep[bi] = 1;
      stack.push([a, bi], [bi, b]);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(s[i * 2]!, s[i * 2 + 1]!);
  return out;
}

// Çizim süresi bitti: eserler seyreltilir, karışık sırayla isimsiz galeriye çıkar
export function toVote(g: GalleryState, artists: string[], rng: Rng) {
  for (const id of Object.keys(g.drawings)) g.drawings[id] = g.drawings[id]!.map((s) => simplify(s));
  g.order = rng.shuffle([...artists]);
  g.stage = 'vote';
}

export function galleryVote(g: GalleryState, by: string, index: number) {
  if (g.stage !== 'vote') throw new IntentError('BAD_PHASE', 'Galeri henüz açılmadı.');
  if (!Number.isInteger(index) || index < 0 || index >= g.order.length) throw new IntentError('BAD_INPUT', 'Böyle bir eser yok.');
  if (g.order[index] === by) throw new IntentError('OWN', 'Kendi eserine oy veremezsin. Ne kadar kötü olsa da.');
  if (g.votes[by] !== undefined) throw new IntentError('ALREADY', 'Oyunu verdin.');
  g.votes[by] = index;
}

// En çok oyu alan(lar) içer. Oy almayanlar "temiz eser" ile +1 cesaret alır.
export function scoreGallery(g: GalleryState, result: TurnResult): string[] {
  const count: Record<string, number> = {};
  for (const idx of Object.values(g.votes)) {
    const a = g.order[idx];
    if (a) count[a] = (count[a] ?? 0) + 1;
  }
  const max = Math.max(0, ...Object.values(count));
  const worst = max > 0 ? g.order.filter((id) => count[id] === max) : [];
  result.gallery = {
    prompt: g.prompt,
    items: g.order.map((id) => ({ author: id, strokes: g.drawings[id] ?? [], votes: count[id] ?? 0 })),
    worst,
  };
  for (const id of g.order) if (!count[id]) result.courage.push({ id, pts: 1, why: 'temiz eser' });
  return worst;
}
