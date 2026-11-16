// Kart kataloğu: content/cards/*.json (build öncesi validate-cards ile doğrulanır).
// import.meta.glob sayesinde yeni bir deste dosyası eklemek kod değişikliği gerektirmez.
import type { Card } from './cards';
import type { Catalog } from './types';

const files = import.meta.glob<{ cards: Card[] }>('../../content/cards/*.json', { eager: true, import: 'default' });

let cached: Catalog | null = null;

export function loadCatalog(): Catalog {
  if (cached) return cached;
  const m = new Map<string, Card>();
  for (const path of Object.keys(files).sort()) for (const c of files[path]!.cards) m.set(c.id, c);
  cached = m;
  return m;
}
