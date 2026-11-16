// docs/source/cards.seed.json dosyasını content/cards/<deck>.json olarak destelere böler.
// Var olan deste dosyalarındaki kartlar korunur; seed'deki aynı id'li kartlar güncellenir.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { CardSchema, type Card } from '../src/engine/cards';

const seed = JSON.parse(readFileSync('docs/source/cards.seed.json', 'utf8')) as { cards: unknown[] };
const byDeck = new Map<string, Card[]>();
for (const raw of seed.cards) {
  const card = CardSchema.parse(raw);
  const list = byDeck.get(card.deck) ?? [];
  list.push(card);
  byDeck.set(card.deck, list);
}
for (const [deck, cards] of byDeck) {
  const file = `content/cards/${deck}.json`;
  const existing: Card[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).cards : [];
  const ids = new Set(cards.map((c) => c.id));
  const merged = [...cards, ...existing.filter((c) => !ids.has(c.id))];
  const body = merged.map((c) => '    ' + JSON.stringify(c)).join(',\n');
  writeFileSync(file, `{\n  "deck": "${deck}",\n  "cards": [\n${body}\n  ]\n}\n`);
  console.log(`${file}: ${merged.length} kart`);
}
