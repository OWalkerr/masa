import type { CardType, Target } from '../../../engine/cards';

export const TYPE_LABEL: Record<CardType, string> = {
  question: 'Soru', dare: 'Cesaret', mostLikely: 'Kim Daha?', neverHave: 'Hiç Yapmadım',
  rule: 'Kural', duel: 'Düello', mirror: 'Ayna', confession: 'İtiraf', curse: 'Lanet',
  minigame: 'Mini Oyun', golden: 'Altın Kart', tableEvent: 'Masa Olayı',
};

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
