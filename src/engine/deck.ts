// Çekiliş: deste havuzu, tür ağırlıkları, 3 kartlık el, miras, uygunluk (flört/temas katılımı).
import type { Card, CardType } from './cards';
import { modeById } from './modes';
import type { Rng } from './rng';
import { activePlayers } from './state';
import type { Catalog, GameState, Player } from './types';

export const ACT_INTENSITY: Record<1 | 2 | 3, number[]> = { 1: [1], 2: [1, 2], 3: [2, 3] };

export const ACT_TYPES: Record<1 | 2 | 3, CardType[]> = {
  1: ['question', 'dare', 'mostLikely', 'neverHave', 'sketch'],
  2: ['question', 'dare', 'mostLikely', 'neverHave', 'rule', 'duel', 'mirror', 'confession', 'golden', 'mission', 'sketch'],
  3: ['question', 'dare', 'mostLikely', 'neverHave', 'rule', 'duel', 'mirror', 'confession', 'golden', 'curse', 'minigame', 'mission', 'sketch'],
};

// Motorda çözümü yazılmış türler (M2/M3'te genişleyecek)
export const IMPLEMENTED_TYPES: ReadonlySet<CardType> = new Set([
  'question', 'dare', 'mostLikely', 'neverHave', 'rule', 'duel', 'mirror', 'confession', 'curse', 'golden', 'minigame', 'mission', 'sketch',
]);

const RARITY_W = { common: 1, rare: 0.35, legendary: 0.06 } as const;

export function needsPick(card: Card): number {
  return card.target === 'picked' ? 1 : card.target === 'twoPicked' ? 2 : 0;
}

export function hasToken(card: Card, token: string): boolean {
  return card.text.includes(`{${token}}`);
}

// Kartın etiketlerine göre katılımı açık oyuncu mu?
export function consents(p: Player, card: Card): boolean {
  const tags = card.tags ?? [];
  const spicy = tags.includes('flort') || card.deck === 'spicy';
  if (spicy && !(p.consent.ageOk && p.consent.spicy)) return false;
  if (tags.includes('temas') && !(p.consent.ageOk && p.consent.contact)) return false;
  return true;
}

export function isSensitive(card: Card): boolean {
  const tags = card.tags ?? [];
  return card.deck === 'spicy' || tags.includes('flort') || tags.includes('temas');
}

// Okuyucu dışında bu karta hedef olabilecek oyuncular
export function targetPool(s: GameState, card: Card, readerId: string): Player[] {
  // Oyuncu başına en fazla 1 aktif lanet
  const cursed = new Set(card.type === 'curse' ? (s.game?.effects ?? []).filter((e) => e.kind === 'curse').map((e) => e.targetId) : []);
  return activePlayers(s).filter((p) => p.id !== readerId && consents(p, card) && !cursed.has(p.id));
}

export function neighbor(s: GameState, readerId: string, dir: 1 | -1): string | undefined {
  const ids = s.order.filter((id) => activePlayers(s).some((p) => p.id === id));
  const i = ids.indexOf(readerId);
  if (i < 0 || ids.length < 2) return undefined;
  return ids[(i + dir + ids.length) % ids.length];
}

// Kart bu masada, bu okuyucuyla oynanabilir mi?
export function feasible(s: GameState, card: Card, readerId: string): boolean {
  if (isSensitive(card) && !s.settings.adult) return false;
  // En fazla 3 aktif kural: sınır doluysa kural kartı elde çıkmaz
  if (card.type === 'rule' && (s.game?.effects ?? []).filter((e) => e.kind !== 'curse' && e.kind !== 'mission').length >= 3) return false;
  // Aynı anda tek gizli görev
  if (card.type === 'mission' && (s.game?.effects ?? []).some((e) => e.kind === 'mission')) return false;
  if ((card.type === 'confession' || card.type === 'mirror' || card.type === 'duel' || card.type === 'mission' || card.type === 'sketch') && activePlayers(s).length < 3) return false;
  const pool = targetPool(s, card, readerId);
  let need = 0;
  switch (card.target) {
    case 'picked': need = 1; break;
    case 'twoPicked': need = 2; break;
    case 'random': need = 1; break;
    case 'all': need = isSensitive(card) ? 2 : 1; break;
    case 'reader': {
      const r = s.players.find((p) => p.id === readerId);
      if (!r || !consents(r, card)) return false;
      break;
    }
    case 'right':
    case 'left': {
      const n = neighbor(s, readerId, card.target === 'right' ? 1 : -1);
      const np = s.players.find((p) => p.id === n);
      if (!np || !consents(np, card)) return false;
      break;
    }
  }
  if (hasToken(card, 'rastgele') && card.target !== 'random') need += 1;
  if (hasToken(card, 'ikinci')) need = Math.max(need, 2);
  return pool.length >= need;
}

// Modun havuzundaki kartlar (sıra: katalog sırası, deterministik)
export function modePool(s: GameState, catalog: Catalog): Card[] {
  const mode = modeById(s.settings.deck);
  const decks = new Set(mode.pools);
  if (s.settings.adult && s.settings.deck !== 'clean') decks.add('spicy');
  return [...catalog.values()].filter((c) => decks.has(c.deck));
}

export function cardWeight(s: GameState, card: Card): number {
  const g = s.game!;
  const mode = modeById(s.settings.deck);
  let w = mode.weights[card.type] ?? 1;
  if (g.recentTypes.includes(card.type)) w *= 0.5; // son 2 turda oynanan tür yarı ağırlık
  let r: number = RARITY_W[card.rarity];
  if (card.rarity === 'legendary' && g.act === 3) r *= 2;
  return w * r;
}

// Okuyucuya 3 kart: miras varsa biri odur; en az 2 farklı tür; en az biri perdenin en düşük yoğunluğunda.
export function dealHand(s: GameState, catalog: Catalog, rng: Rng, readerId: string, inheritId: string | null): string[] {
  const g = s.game!;
  const act = g.act;
  const hand: Card[] = [];
  const inherit = inheritId ? catalog.get(inheritId) : undefined;
  if (inherit && feasible(s, inherit, readerId)) hand.push(inherit);

  const allowedTypes = new Set(ACT_TYPES[act].filter((t) => IMPLEMENTED_TYPES.has(t)));
  const base = modePool(s, catalog).filter((c) => allowedTypes.has(c.type) && feasible(s, c, readerId) && !hand.some((h) => h.id === c.id));
  const used = new Set(g.used);
  const intensities = ACT_INTENSITY[act];
  const maxI = Math.max(...intensities);

  let cands = base.filter((c) => !used.has(c.id) && intensities.includes(c.intensity));
  if (cands.length < 3 - hand.length) cands = base.filter((c) => !used.has(c.id) && c.intensity <= maxI);
  // Havuz tükenen türler için o türün en eski kartı geri döner
  for (const t of allowedTypes) {
    if (cands.some((c) => c.type === t)) continue;
    const oldest = g.used.map((id) => catalog.get(id)).find((c) => c && c.type === t && base.includes(c) && c.intensity <= maxI);
    if (oldest) cands.push(oldest);
  }
  // Hâlâ yetmiyorsa en eski kullanılanlar sırayla döner
  for (const id of g.used) {
    if (cands.length >= 3 - hand.length) break;
    const c = catalog.get(id);
    if (c && base.includes(c) && !cands.includes(c)) cands.push(c);
  }

  const minI = Math.min(...intensities);
  while (hand.length < 3 && cands.length > 0) {
    const last = hand.length === 2;
    let opts = cands;
    if (!hand.some((h) => h.intensity === minI)) {
      const low = opts.filter((c) => c.intensity === minI);
      if (low.length) opts = low;
    }
    if (last && hand.length === 2 && hand[0]!.type === hand[1]!.type) {
      const diff = opts.filter((c) => c.type !== hand[0]!.type);
      if (diff.length) opts = diff;
      else {
        const diffAll = cands.filter((c) => c.type !== hand[0]!.type);
        if (diffAll.length) opts = diffAll;
      }
    }
    const pick = rng.weighted(opts, (c) => cardWeight(s, c)) ?? opts[0]!;
    hand.push(pick);
    cands = cands.filter((c) => c.id !== pick.id);
  }
  return rng.shuffle(hand.map((c) => c.id));
}

// Seçilmeyen kartlardan yoğunluğu en yüksek olan miras kalır
export function pickInherit(catalog: Catalog, rest: string[], rng: Rng): string | null {
  const cards = rest.map((id) => catalog.get(id)).filter((c): c is Card => !!c);
  if (!cards.length) return null;
  const top = Math.max(...cards.map((c) => c.intensity));
  const best = cards.filter((c) => c.intensity === top);
  return rng.pick(best).id;
}

// Az hedef olmuş oyuncunun ağırlığı daha yüksek
export function weightedRandomPlayer(s: GameState, rng: Rng, pool: Player[]): Player | undefined {
  return rng.weighted(pool, (p) => 1 / (1 + (s.stats[p.id]?.targeted ?? 0)));
}
