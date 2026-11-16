// Modlar: kart havuzunu ve tür ağırlıklarını belirleyen ön ayarlar.
// (Ağırlıklar M1'de çekiliş motoruyla birlikte kullanılacak.)
import type { CardType, DeckId } from './cards';

export interface ModeDef {
  id: DeckId;
  name: string;
  blurb: string;
  accent: string;
  pools: DeckId[]; // hangi destelerden kart çekilir
  weights: Partial<Record<CardType, number>>;
  available: boolean;
  adultOnly?: boolean;
  forceSober?: boolean;
}

export const MODES: ModeDef[] = [
  { id: 'classic', name: 'Klasik Masa', blurb: 'Tüm türler dengeli.', accent: '#E8B04A', pools: ['classic', 'homeland'], weights: {}, available: true },
  { id: 'who', name: 'Kim Daha?', blurb: 'Parmaklar birbirini gösterir.', accent: '#A3E635', pools: ['who', 'classic'], weights: { mostLikely: 5, neverHave: 2 }, available: true },
  { id: 'confess', name: 'İtiraf Gecesi', blurb: 'Sorular, aynalar, anonim itiraflar.', accent: '#7FB2E5', pools: ['confess', 'classic'], weights: { question: 3, mirror: 3, confession: 3 }, available: true },
  { id: 'chaos', name: 'Kaos', blurb: 'Kurallar, lanetler, bombalar.', accent: '#D7263D', pools: ['chaos', 'classic'], weights: { rule: 3, curse: 3, minigame: 5, tableEvent: 2, mission: 2 }, available: true },
  { id: 'duel', name: 'Düello Ligi', blurb: 'v2 ile geliyor.', accent: '#8E6CD8', pools: ['classic'], weights: { duel: 5 }, available: false },
  { id: 'spicy', name: 'Ateşli 18+', blurb: 'Yalnızca katılımı açık olanlar.', accent: '#E0457B', pools: ['spicy', 'classic'], weights: {}, available: true, adultOnly: true },
  { id: 'clean', name: 'Temiz', blurb: 'Aile ve ofis. Hep alkolsüz.', accent: '#5ED6B4', pools: ['clean'], weights: {}, available: true, forceSober: true },
  { id: 'homeland', name: 'Memleket', blurb: 'Teyzeler, düğünler, çay ocakları.', accent: '#F28C28', pools: ['homeland', 'classic'], weights: {}, available: true },
];

export const modeById = (id: DeckId): ModeDef => MODES.find((m) => m.id === id) ?? MODES[0]!;
