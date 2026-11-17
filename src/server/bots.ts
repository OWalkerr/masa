// Sunucu botları: masaya otururlar, kart seçer, hedef seçer, oylar, hüküm verir, itiraf yazar, Yakala! oylar.
// Saf fonksiyonlardır; motor yalnızca "botun sırası geldi" sinyali verir (1–4 sn gecikmeyle).
import { roomCatalog } from '../engine/house';
import { needsPick, targetPool } from '../engine/deck';
import { actionKind, catchVoters, expectedInputs, nextReaderId } from '../engine/game';
import { currentHolder } from '../engine/minigames';
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

const BOT_GUESSES = ['kedi', 'mezar', 'ay', 'ev', 'rakı', 'balık', 'kayınvalide', 'iskelet', 'fener', 'patates', 'bu ne ya'];

const BOT_CONFESSIONS = [
  'Bulaşık makinesini hiç doğru dizemedim.',
  'Gizlice çizgi film izliyorum.',
  'Bitkilerime isim koydum, biri küstü.',
  'Asansörde aynaya poz veriyorum.',
  'Hâlâ karanlıktan korkuyorum.',
  'Duşta konser veriyorum, biletler tükendi.',
];

// Botun şu anki karar anı için niyeti (yoksa null)
export function botDecide(s: GameState, botId: string, rng: Rng, baseCatalog: Catalog): ClientIntent | null {
  const catalog = roomCatalog(s, baseCatalog);
  const g = s.game;
  if (!g) return null;
  // Yakala! oylaması her şeyden önce
  if (g.catchVote && catchVoters(s).includes(botId) && g.catchVote.votes[botId] === undefined) {
    return { t: 'catchVote', yes: rng.next() < 0.55 };
  }
  const t = g.turn;
  if (!t) return null;
  const st = s.stats[botId];
  const powers = st?.powers ?? [];
  // Sonuç anı: Kalkan kaldır, Ayna tut ya da Sabotaj yap
  if (s.phase === 'resolve' && t.result && !t.system) {
    const paying = t.result.payments.some((x) => x.id === botId);
    if (paying && powers.includes('shield')) return { t: 'usePower', power: 'shield' };
    if (paying && powers.includes('mirror')) {
      const others = s.players.filter((p) => !p.left && p.id !== botId);
      return others.length ? { t: 'usePower', power: 'mirror', targetId: rng.pick(others).id } : null;
    }
    if (powers.includes('sabotage') && !t.sabotagedBy && t.rest.length && nextReaderId(s) !== botId)
      return { t: 'usePower', power: 'sabotage', cardId: rng.pick(t.rest) };
    return null;
  }
  if (s.phase === 'choose' && t.readerId === botId && !t.system) {
    // Elini beğenmeyen bot Takas kullanır
    if (t.step === 'choose' && !t.cardId && !t.swapped && powers.includes('swap') && rng.next() < 0.4) return { t: 'usePower', power: 'swap' };
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
  // Pas (perde başına 1) ve çok nadiren anonim Veto
  {
    const c = getCard(catalog, t.cardId);
    const passable = c && !['rule', 'curse', 'golden', 'mission'].includes(c.type) && !t.system;
    if (passable && t.targets.includes(botId) && !t.passed.includes(botId) && st && st.passAct !== g.act && !t.mg && rng.next() < 0.12)
      return { t: 'pass' };
    if (passable && st && !st.vetoUsed && c!.intensity === 3 && rng.next() < 0.03) return { t: 'veto' };
  }
  if (t.mg) {
    if (t.mg.stage !== 'live') return null;
    if (t.mg.kind === 'bomb') {
      const i = t.mg.bombs.findIndex((b, k) => !b.exploded && currentHolder(t.mg!, k) === botId);
      return i >= 0 ? { t: 'minigameInput', action: 'throw', bomb: i } : null;
    }
    return t.mg.taps[botId] === undefined ? { t: 'minigameInput', action: 'tap' } : null;
  }
  if (t.gal) {
    const gl = t.gal;
    if (gl.stage === 'draw') {
      if (gl.done.includes(botId) || t.passed.includes(botId)) return null;
      if ((gl.drawings[botId]?.length ?? 0) >= 4) return { t: 'galDone' };
      const pts: number[] = [];
      let x = 150 + rng.int(700), y = 150 + rng.int(700);
      for (let i = 0; i < 20; i++) {
        x = Math.max(0, Math.min(1000, x + rng.int(101) - 50));
        y = Math.max(0, Math.min(1000, y + rng.int(101) - 50));
        pts.push(x, y);
      }
      return { t: 'drawSeg', s: pts, n: true };
    }
    if (gl.votes[botId] !== undefined) return null;
    const opts = gl.order.map((a, i) => (a === botId ? -1 : i)).filter((i) => i >= 0);
    return opts.length ? { t: 'galVote', index: rng.pick(opts) } : null;
  }
  if (t.sk && t.secret) {
    // Ressam bot: rastgele kıvrımlı bir çizgi
    if (t.sk.drawer === botId) {
      if (t.sk.strokes.length >= 5) return null;
      const pts: number[] = [];
      let x = 200 + rng.int(600), y = 200 + rng.int(600);
      for (let i = 0; i < 24; i++) {
        x = Math.max(0, Math.min(1000, x + rng.int(81) - 40));
        y = Math.max(0, Math.min(1000, y + rng.int(81) - 40));
        pts.push(x, y);
      }
      return { t: 'drawSeg', s: pts, n: true };
    }
    if (t.sk.correct.includes(botId) || (t.sk.guessed[botId] ?? 0) >= 4) return null;
    // Zaman geçtikçe bilme ihtimali artar
    const p = Math.min(0.7, ((Date.now() - t.sk.startAt) / Math.max(1, t.sk.endsAt - t.sk.startAt)) * 0.9);
    return { t: 'guess', text: rng.next() < p ? t.secret.split('/')[0]! : rng.pick(BOT_GUESSES) };
  }
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
