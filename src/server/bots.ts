// Sunucu botları. M0'da yalnızca masaya otururlar; M1'de seçer, oylar, cevap yazar.
import { BOT_NAMES } from '../engine/names';
import type { Rng } from '../engine/rng';
import type { GameState, SystemIntent } from '../engine/types';

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
