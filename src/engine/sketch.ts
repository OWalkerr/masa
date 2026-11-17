// Karakalem (çizim oyunu): çizen gizli kelimeyi telefonuna çizer, masa yazarak tahmin eder.
// Çizim noktaları 0..1000 aralığında tam sayılardır (ekran boyundan bağımsız).
import { IntentError, type Fx, type GameState, type SketchState, type TurnResult } from './types';

export const SKETCH = {
  prepMs: 3000, // çizmeden önce kelimeye bakma payı
  defaultSec: 75,
  maxSegNums: 160, // bir mesajdaki sayı (x,y çifti ×2)
  maxTotalNums: 12_000, // tüm çizim (≈6000 nokta)
  maxStrokes: 200,
  maxGuess: 40,
  maxWrongShown: 40,
} as const;

// Türkçe büyük/küçük harf, şapka ve noktalama farkını yok sayar: "Kayınvalide!" == "kayinvalide"
export function normalizeGuess(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/[âà]/g, 'a').replace(/[îı]/g, 'i').replace(/[ûü]/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ş/g, 's')
    .replace(/[^a-z0-9]+/g, '');
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length]!;
}

// Kelimenin kabul edilen yazımları: "Kayınvalide/Kaynana" → iki cevap da doğru. Ekranda ilk biçim görünür.
export function answersOf(word: string): string[] {
  return word.split('/').map((x) => normalizeGuess(x)).filter(Boolean);
}

export function displayWord(word: string): string {
  return word.split('/')[0]!.trim();
}

// Tahmin sonucu: doğru, çok yakın (yalnızca tahmin edene söylenir) ya da yanlış
export function judgeGuess(word: string, raw: string): 'ok' | 'close' | 'no' {
  const g = normalizeGuess(raw);
  if (!g) return 'no';
  let best = Infinity;
  for (const a of answersOf(word)) {
    if (g === a) return 'ok';
    const d = levenshtein(g, a);
    // Uzun kelimelerde tek harflik yazım hatası doğru sayılır
    if (a.length >= 6 && d <= 1) return 'ok';
    best = Math.min(best, d);
  }
  return best <= 2 ? 'close' : 'no';
}

// Tahmin edenlere ipucu: harf sayısı (boşluklar korunur) — "_ _ _ _   _ _ _"
export function hintOf(word: string): string {
  return [...displayWord(word)].map((ch) => (ch === ' ' ? '  ' : /[\p{L}\p{N}]/u.test(ch) ? '_' : ch)).join(' ').replace(/\s{3,}/g, '   ');
}

export function newSketch(now: number, sec: number, drawer: string): SketchState {
  return { drawer, startAt: now + SKETCH.prepMs, endsAt: now + SKETCH.prepMs + sec * 1000, strokes: [], correct: [], wrong: [], guessed: {} };
}

function totalNums(sk: SketchState): number {
  return sk.strokes.reduce((a, s) => a + s.length, 0);
}

// Çizen bir parça gönderir. n=true yeni çizgi başlatır. "tekcizgi"de ikinci çizgiye izin yoktur.
export function drawSegment(sk: SketchState, now: number, by: string, nums: number[], fresh: boolean, singleLine: boolean): Fx {
  if (by !== sk.drawer) throw new IntentError('NOT_DRAWER', 'Çizen sen değilsin.');
  if (now > sk.endsAt) throw new IntentError('TIME', 'Süre doldu.');
  if (nums.length % 2 !== 0 || nums.length > SKETCH.maxSegNums || nums.some((v) => !Number.isInteger(v) || v < 0 || v > 1000))
    throw new IntentError('BAD_INPUT', 'Geçersiz çizgi.');
  if (totalNums(sk) + nums.length > SKETCH.maxTotalNums) throw new IntentError('FULL', 'Kâğıt doldu.');
  const pos = totalNums(sk);
  const strokeIdx = fresh || !sk.strokes.length ? sk.strokes.length : sk.strokes.length - 1;
  if (fresh || !sk.strokes.length) {
    if (singleLine && sk.strokes.length >= 1) throw new IntentError('SINGLE', 'Tek çizgi! Kalem kalktı, çizim bitti.');
    if (sk.strokes.length >= SKETCH.maxStrokes) throw new IntentError('FULL', 'Çok fazla çizgi.');
    sk.strokes.push([...nums]);
  } else {
    sk.strokes[sk.strokes.length - 1]!.push(...nums);
  }
  return { kind: 'draw', payload: { pos, stroke: strokeIdx, fresh: fresh || pos === 0, s: nums } };
}

export function undoStroke(sk: SketchState, by: string, singleLine: boolean): void {
  if (by !== sk.drawer) throw new IntentError('NOT_DRAWER', 'Çizen sen değilsin.');
  if (singleLine) throw new IntentError('SINGLE', 'Tek çizgide geri alma yok.');
  sk.strokes.pop();
}

export function clearSketch(sk: SketchState, by: string, singleLine: boolean): void {
  if (by !== sk.drawer) throw new IntentError('NOT_DRAWER', 'Çizen sen değilsin.');
  if (singleLine) throw new IntentError('SINGLE', 'Tek çizgide silgi yok.');
  sk.strokes = [];
}

// Tahmin: doğruysa doğrular listesine girer; yanlışsa masaya uçuşan balon olur (çok yakınsa yalnızca ona söylenir)
export function guessWord(sk: SketchState, word: string, now: number, by: string, raw: string, clean: (s: string, max: number) => string, fx: Fx[]): boolean {
  if (by === sk.drawer) throw new IntentError('DRAWER', 'Çizen tahmin edemez.');
  if (now < sk.startAt - 500) throw new IntentError('EARLY', 'Daha çizim başlamadı.');
  if (sk.correct.includes(by)) throw new IntentError('ALREADY', 'Sen zaten bildin.');
  const text = clean(raw, SKETCH.maxGuess);
  if (!text) throw new IntentError('EMPTY', 'Bir tahmin yaz.');
  sk.guessed[by] = (sk.guessed[by] ?? 0) + 1;
  const r = judgeGuess(word, text);
  if (r === 'ok') {
    sk.correct.push(by);
    fx.push({ kind: 'guessRight', payload: { playerId: by, order: sk.correct.length } });
    return true;
  }
  sk.wrong = [...sk.wrong, { id: by, text, at: now }].slice(-SKETCH.maxWrongShown);
  fx.push({ kind: 'guessWrong', payload: { playerId: by, text } });
  if (r === 'close') fx.push({ kind: 'guessClose', to: [by] });
  return false;
}

// Sonuç: bilemeyenler içer; kimse bilemezse çizen içer. Bilinirse çizen +2, ilk bilen +1 cesaret.
export function scoreSketch(sk: SketchState, guessers: string[], result: TurnResult, word: string): string[] {
  result.sketch = { word: displayWord(word), drawer: sk.drawer, correct: [...sk.correct], strokes: sk.strokes };
  if (!sk.correct.length) return [sk.drawer];
  result.courage.push({ id: sk.drawer, pts: 2, why: 'çizimi bildirdi' });
  result.courage.push({ id: sk.correct[0]!, pts: 1, why: 'ilk bilen' });
  return guessers.filter((id) => !sk.correct.includes(id));
}
