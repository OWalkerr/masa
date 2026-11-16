// Tohumlu RNG (mulberry32). Durum tek bir 32-bit sayıdır, oyun durumunda saklanır.
export interface Rng {
  next(): number; // [0,1)
  int(maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly T[], weight: (t: T) => number): T | undefined;
  shuffle<T>(items: T[]): T[];
  state(): number;
}

export function makeRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (max) => Math.floor(next() * max),
    pick: (items) => {
      if (items.length === 0) throw new Error('pick: boş dizi');
      return items[Math.floor(next() * items.length)]!;
    },
    weighted: (items, weight) => {
      const ws = items.map((i) => Math.max(0, weight(i)));
      const total = ws.reduce((a, b) => a + b, 0);
      if (total <= 0) return undefined;
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= ws[i]!;
        if (r < 0) return items[i];
      }
      return items[items.length - 1];
    },
    shuffle: (items) => {
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [items[i], items[j]] = [items[j]!, items[i]!];
      }
      return items;
    },
    state: () => s,
  };
  return rng;
}

// Tohum üretmek için (sunucu tarafı); testlerde sabit tohum verilir
export function randomSeed(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0]!;
}
