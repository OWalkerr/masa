// Ev Kartları: oyuncuların lobide yazdığı, masaya özel kartlar. Yazarı hiçbir zaman açılmaz.
import { lintCard, type Card } from './cards';
import { cleanText } from './text';
import { IntentError, type Catalog, type GameState } from './types';

export type HouseKind = 'question' | 'dare' | 'mostLikely' | 'neverHave';
export const HOUSE = { perPlayer: 3, total: 30, min: 8 } as const;

export interface HouseCard {
  card: Card;
  author: string;
}

// Kullanıcı metnini türüne göre karta çevirir: "Seçilen, …", "Kim …?", "Hiç …"
export function buildHouseCard(id: string, kind: HouseKind, raw: string): Card {
  let text = cleanText(raw.replace(/[{}]/g, ''), 100);
  if ([...text].length < HOUSE.min) throw new IntentError('SHORT', 'Biraz daha uzun yaz.');
  const lower = text.toLocaleLowerCase('tr');
  if (kind === 'question' || kind === 'dare') {
    text = `{secilen}, ${text.charAt(0).toLocaleLowerCase('tr')}${text.slice(1)}`;
  } else if (kind === 'mostLikely') {
    if (!lower.startsWith('kim ')) text = `Kim ${text.charAt(0).toLocaleLowerCase('tr')}${text.slice(1)}`;
    if (!/[?]$/.test(text)) text = `${text.replace(/[.!]+$/, '')}?`;
  } else {
    if (!lower.startsWith('hiç ')) text = `Hiç ${text.charAt(0).toLocaleLowerCase('tr')}${text.slice(1)}`;
    if (!/[.!?]$/.test(text)) text = `${text}.`;
  }
  if ([...text].length > 110) throw new IntentError('LONG', 'Kart çok uzun (en fazla 100 karakter).');
  const all = kind === 'mostLikely' || kind === 'neverHave';
  const card: Card = {
    id,
    deck: 'classic',
    type: kind,
    intensity: 1,
    rarity: 'common',
    target: all ? 'all' : 'picked',
    input: kind === 'mostLikely' ? 'votePlayer' : kind === 'neverHave' ? 'yesNo' : 'judge',
    text,
    penalty: 1,
    tags: ['ev'],
  };
  // Güvenlik kuralları ev kartlarına da uygulanır (dışarı çıkma, araç, masa dışı kişiyi arama…)
  const problems = lintCard(card).filter((p) => p.startsWith('yasak kalıp'));
  if (problems.length) throw new IntentError('UNSAFE', 'Bu kart güvenlik kuralına takıldı: ' + problems[0]!.replace('yasak kalıp: ', ''));
  return card;
}

export function addHouseCard(s: GameState, by: string, kind: HouseKind, raw: string): Card {
  const list = (s.houseCards ??= []);
  if (list.filter((h) => h.author === by).length >= HOUSE.perPlayer) throw new IntentError('LIMIT', `En fazla ${HOUSE.perPlayer} ev kartı yazabilirsin.`);
  if (list.length >= HOUSE.total) throw new IntentError('LIMIT', 'Masanın ev kartı kutusu doldu.');
  const card = buildHouseCard(`house-${s.seq++}`, kind, raw);
  list.push({ card, author: by });
  return card;
}

export function removeHouseCard(s: GameState, by: string, id: string) {
  const list = s.houseCards ?? [];
  const h = list.find((x) => x.card.id === id);
  if (!h || h.author !== by) throw new IntentError('NOT_YOURS', 'Bu kart senin değil.');
  s.houseCards = list.filter((x) => x !== h);
}

// Odanın kataloğu: sabit desteler + bu masanın ev kartları
export function roomCatalog(s: GameState, base: Catalog): Catalog {
  const list = s.houseCards;
  if (!list?.length) return base;
  const m = new Map(base);
  for (const h of list) m.set(h.card.id, h.card);
  return m;
}

export function isHouse(c: Pick<Card, 'tags'>): boolean {
  return !!c.tags?.includes('ev');
}
