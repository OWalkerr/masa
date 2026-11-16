// Sistem kartları: desteden çekilmez, motor araya sokar (Su Molası, final).
import type { Card } from './cards';
import type { Catalog } from './types';

export const SYSTEM_CARDS: ReadonlyMap<string, Card> = new Map(
  (
    [
      { id: 'sys-water', deck: 'classic', type: 'tableEvent', intensity: 1, rarity: 'common', target: 'all', input: 'none', penalty: 0,
        text: 'Su Molası: Herkes bir bardak su içer. Telefonu bırak, bir nefes al.', quip: 'Ben zaten hep doluyum.' },
      { id: 'sys-final-drink', deck: 'classic', type: 'golden', intensity: 3, rarity: 'legendary', target: 'reader', input: 'none', penalty: 0,
        text: 'Son Kadeh: Herkes kadehini kaldırsın. {okuyucu} gecenin kapanış sözünü söylesin.', quip: 'Şerefe. Ya da benim durumumda: şerefsizce dolu.' },
      { id: 'sys-final-tea', deck: 'classic', type: 'golden', intensity: 3, rarity: 'legendary', target: 'reader', input: 'none', penalty: 0,
        text: 'Son Çay: Herkes bardağını kaldırsın. {okuyucu} gecenin kapanış sözünü söylesin.', quip: 'Demlendik. Hem çay hem biz.' },
    ] satisfies Card[]
  ).map((c) => [c.id, c]),
);

export function getCard(catalog: Catalog, id: string): Card | undefined {
  return catalog.get(id) ?? SYSTEM_CARDS.get(id);
}

// Kart davranış etiketleri (kart yazarları için, docs/DECISIONS.md'de belgeli)
export const TAG = {
  decree: 'ferman', // altın: perde sonuna kadar bir kural koyma hakkı
  pocket: 'cep', // altın: cebe Kalkan + Ayna
  transfer: 'devir', // altın: son 3 bedeli seçilen kişiye devret
  reverse: 'yon', // olay: sıra yönü ters döner
  eclipse: 'tutulma', // olay: en çok ödeyene Ayna
  ghost: 'hayalet', // olay: sonraki 2 tur okuyucu kartları kapalı görür
} as const;
