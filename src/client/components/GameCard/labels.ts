import type { CardType, Target } from '../../../engine/cards';

export const TYPE_LABEL: Record<CardType, string> = {
  question: 'Soru', dare: 'Cesaret', mostLikely: 'Kim Daha?', neverHave: 'Hiç Yapmadım',
  rule: 'Kural', duel: 'Düello', mirror: 'Ayna', confession: 'İtiraf', curse: 'Lanet',
  minigame: 'Mini Oyun', golden: 'Altın Kart', tableEvent: 'Masa Olayı', mission: 'Gizli Görev', sketch: 'Karakalem', gallery: 'Sergi',
};

// Etikete göre özel ad (aynı motor türünün farklı oyunları)
export function cardLabel(card: { type: CardType; tags?: string[] }): string {
  const tags = card.tags ?? [];
  if (card.type === 'mirror' && tags.includes('yalan')) return 'Yalan Makinesi';
  if (card.type === 'mirror' && tags.includes('olcek')) return 'Ölçek';
  if (card.type === 'dare' && tags.includes('anlat')) return 'Anlat Bakalım';
  if (card.type === 'sketch' && tags.includes('tekcizgi')) return 'Tek Çizgi';
  if (card.type === 'sketch' && tags.includes('kor')) return 'Kör Ressam';
  if (card.type === 'sketch' && tags.includes('tersel')) return 'Ters El';
  return TYPE_LABEL[card.type];
}

export const TARGET_LABEL: Record<Target, string> = {
  all: 'Herkes', reader: 'Okuyucu', picked: 'Seçilen', twoPicked: 'İki kişi',
  random: 'Rastgele', right: 'Sağındaki', left: 'Solundaki',
};

// id'den deterministik küçük sayı (görsel varyant seçimi için)
export function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}
