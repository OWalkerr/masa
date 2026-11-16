// Sunucu botları: masaya otururlar, kart seçer, hedef seçer, oylar, hüküm verirler (1–4 sn gecikmeyle).
import { BOT_NAMES } from '../engine/names';
import type { Rng } from '../engine/rng';
import { needsPick, targetPool } from '../engine/deck';
import { actionKind } from '../engine/game';
import type { Catalog, ClientIntent, GameState, SystemIntent } from '../engine/types';

export function botJoinIntents(s: GameState, count: number, rng: Rng): SystemIntent[] {
  const used = new Set(s.players.map((p) => p.name));
  const names = rng.shuffle(BOT_NAMES.filter((n) => !used.has(n)));
  const out: SystemIntent[] = [];
  for (let i = 0; i < count && i < names.length; i++) {
    out.push({
      t: 'join',
      playerId: `bot-${s.seq + i}-${rng.int(1e6).toString(36)}`,
      secret: 'bot',
      name: names[i]!,
      avatar: rng.int(12),
      isBot: true,
      consent: { ageOk: true, spicy: false, contact: false },
    });
  }
  return out;
}

// Botun şu anki karar anı için niyeti (yoksa null)
export function botDecide(s: GameState, botId: string, rng: Rng, catalog: Catalog): ClientIntent | null {
  const g = s.game;
  const t = g?.turn;
  if (!g || !t) return null;
  if (s.phase === 'choose' && t.readerId === botId) {
    if (t.step === 'choose') {
      // Yarı yarıya en yoğun kartı seçer (cesaret puanı peşinde)
      const cards = t.hand.map((id) => catalog.get(id)!).filter(Boolean);
      const top = Math.max(...cards.map((c) => c.intensity));
      const pick = rng.next() < 0.5 ? cards.find((c) => c.intensity === top)! : rng.pick(cards);
      return { t: 'playCard', cardId: pick.id };
    }
    const card = catalog.get(t.cardId!)!;
    const pool = rng.shuffle(targetPool(s, card, botId).map((p) => p.id));
    return { t: 'pickTarget', playerIds: pool.slice(0, needsPick(card)) };
  }
  if (s.phase === 'action') {
    const card = catalog.get(t.cardId!)!;
    const k = actionKind(card);
    if (k === 'judge' && t.readerId === botId) {
      if (card.target === 'all') return { t: 'judge', payers: t.targets.filter(() => rng.next() < 0.3) };
      return { t: 'judge', done: rng.next() < 0.7 };
    }
    if (t.inputs[botId]) return null;
    if (k === 'votePlayer') {
      const others = s.players.filter((p) => !p.left && p.id !== botId);
      if (!others.length) return null;
      return { t: 'vote', playerId: rng.pick(others).id };
    }
    if (k === 'yesNo' && t.targets.includes(botId)) return { t: 'answer', yes: rng.next() < 0.4 };
  }
  return null;
}
