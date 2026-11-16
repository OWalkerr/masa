// Sunucu botları: masaya otururlar, kart seçer, hedef seçer, oylar, hüküm verir, itiraf yazar, Yakala! oylar.
// Saf fonksiyonlardır; motor yalnızca "botun sırası geldi" sinyali verir (1–4 sn gecikmeyle).
import { needsPick, targetPool } from '../engine/deck';
import { actionKind, catchVoters, expectedInputs } from '../engine/game';
import { BOT_NAMES } from '../engine/names';
import type { Rng } from '../engine/rng';
import { getCard } from '../engine/systemCards';
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

const BOT_CONFESSIONS = [
  'Bulaşık makinesini hiç doğru dizemedim.',
  'Gizlice çizgi film izliyorum.',
  'Bitkilerime isim koydum, biri küstü.',
  'Asansörde aynaya poz veriyorum.',
  'Hâlâ karanlıktan korkuyorum.',
  'Duşta konser veriyorum, biletler tükendi.',
];

// Botun şu anki karar anı için niyeti (yoksa null)
export function botDecide(s: GameState, botId: string, rng: Rng, catalog: Catalog): ClientIntent | null {
  const g = s.game;
  if (!g) return null;
  // Yakala! oylaması her şeyden önce
  if (g.catchVote && catchVoters(s).includes(botId) && g.catchVote.votes[botId] === undefined) {
    return { t: 'catchVote', yes: rng.next() < 0.55 };
  }
  const t = g.turn;
  if (!t) return null;
  if (s.phase === 'choose' && t.readerId === botId && !t.system) {
    if (t.step === 'choose') {
      if (t.blind) return { t: 'playCard', cardId: `blind-${rng.int(t.hand.length)}` };
      // Yarı yarıya en yoğun kartı seçer (cesaret puanı peşinde)
      const cards = t.hand.map((id) => getCard(catalog, id)!).filter(Boolean);
      const top = Math.max(...cards.map((c) => c.intensity));
      const pick = rng.next() < 0.5 ? cards.find((c) => c.intensity === top)! : rng.pick(cards);
      return { t: 'playCard', cardId: pick.id };
    }
    const card = getCard(catalog, t.cardId!)!;
    const pool = rng.shuffle(targetPool(s, card, botId).map((p) => p.id));
    return { t: 'pickTarget', playerIds: pool.slice(0, needsPick(card)) };
  }
  if (s.phase !== 'action' || !t.cardId) return null;
  if (!expectedInputs(s, { catalog }).includes(botId)) return null;
  const card = getCard(catalog, t.cardId)!;
  const k = actionKind(card);
  if (k === 'judge') {
    if (card.target === 'all') return { t: 'judge', payers: t.targets.filter((id) => !t.passed.includes(id) && rng.next() < 0.3) };
    return { t: 'judge', done: rng.next() < 0.7 };
  }
  if (k === 'text') {
    if (t.stage === 'write') return t.texts[botId] === undefined ? { t: 'answerText', text: rng.pick(BOT_CONFESSIONS) } : null;
    if (t.inputs[botId]) return null;
    const others = s.players.filter((p) => !p.left && p.id !== botId);
    return others.length ? { t: 'vote', playerId: rng.pick(others).id } : null;
  }
  if (t.inputs[botId]) return null;
  if (k === 'votePlayer') {
    const pool = card.type === 'duel' ? t.targets : s.players.filter((p) => !p.left && p.id !== botId).map((p) => p.id);
    const opts = pool.filter((id) => id !== botId);
    return opts.length ? { t: 'vote', playerId: rng.pick(opts) } : null;
  }
  if (k === 'yesNo') return { t: 'answer', yes: rng.next() < 0.4 };
  if (k === 'choice') return t.options.length ? { t: 'choose', index: rng.int(t.options.length) } : null;
  return null;
}
