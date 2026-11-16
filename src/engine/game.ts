// Tur döngüsü: actIntro → choose → reveal → action → resolve → (sonraki tur / perde) → summary
import type { Card } from './cards';
import { consents, dealHand, hasToken, isSensitive, needsPick, neighbor, pickInherit, targetPool, weightedRandomPlayer } from './deck';
import { applyPayment, emptyStats } from './penalties';
import { activePlayers, getPlayer } from './state';
import {
  DUR, IntentError, ROUNDS_PER_ACT,
  type Ctx, type Fx, type GameState, type InputValue, type Phase, type Turn, type TurnResult,
} from './types';

export function startGame(s: GameState, ctx: Ctx, fx: Fx[]) {
  s.stats = {};
  for (const p of activePlayers(s)) s.stats[p.id] = emptyStats();
  s.game = {
    act: 1, actTurn: 0, actTurns: 0, turnNo: 0, readerIdx: 0, phaseEndsAt: null, turn: null,
    nextInherit: null, used: [], recentTypes: [], log: [], endedAt: null,
  };
  beginAct(s, ctx, fx, 1);
}

export function ensureStats(s: GameState, id: string) {
  if (!s.stats[id]) s.stats[id] = emptyStats();
}

function setPhase(s: GameState, ctx: Ctx, phase: Phase, dur: number | null) {
  s.phase = phase;
  s.timers = s.timers.filter((t) => t.kind !== 'phase');
  if (dur === null) {
    s.game!.phaseEndsAt = null;
    return;
  }
  const at = ctx.now + dur;
  s.game!.phaseEndsAt = at;
  s.timers.push({ id: `ph-${s.seq++}`, kind: 'phase', at });
}

function beginAct(s: GameState, ctx: Ctx, fx: Fx[], act: 1 | 2 | 3) {
  const g = s.game!;
  g.act = act;
  g.actTurn = 0;
  // Her perde en az 1 tam tur sürer: her oyuncu en az bir kez okuyucu olur
  g.actTurns = Math.max(ROUNDS_PER_ACT[s.settings.length], activePlayers(s).length);
  g.turn = null;
  setPhase(s, ctx, 'actIntro', DUR.actIntro);
  fx.push({ kind: 'actIntro', payload: { act } });
}

function currentReaderOk(s: GameState, id: string | undefined): boolean {
  const p = id ? getPlayer(s, id) : undefined;
  if (!p || p.left) return false;
  ensureStats(s, p.id);
  // 2 tur boyunca bağlı olmayan okuyucunun sırası atlanır
  if (!p.isBot && !p.connected && s.stats[p.id]!.missedTurns >= 2) return false;
  return true;
}

function startTurn(s: GameState, ctx: Ctx, fx: Fx[]) {
  const g = s.game!;
  const n = s.order.length;
  let tries = 0;
  while (tries < n && !currentReaderOk(s, s.order[g.readerIdx % n])) {
    g.readerIdx = (g.readerIdx + 1) % n;
    tries++;
  }
  const readerId = s.order[g.readerIdx % n]!;
  const reader = getPlayer(s, readerId)!;
  ensureStats(s, readerId);
  if (!reader.isBot && !reader.connected) s.stats[readerId]!.missedTurns++;
  s.stats[readerId]!.readerTurns++;

  const inherit = g.nextInherit;
  g.nextInherit = null;
  const hand = dealHand(s, ctx.catalog, ctx.rng, readerId, inherit);
  g.turn = {
    readerId, hand, inherited: inherit && hand.includes(inherit) ? inherit : null,
    cardId: null, step: 'choose', targets: [], tokens: {}, inputs: {}, judgedPayers: null, result: null, pickedTop: false,
  };
  setPhase(s, ctx, 'choose', DUR.deal + DUR.choose);
  fx.push({ kind: 'deal', payload: { readerId } });
}

// --- okuyucu eylemleri ---

export function playCard(s: GameState, ctx: Ctx, fx: Fx[], by: string, cardId: string) {
  const t = requireTurn(s, 'choose');
  if (t.readerId !== by) throw new IntentError('NOT_READER', 'Sıra sende değil.');
  if (t.step !== 'choose') throw new IntentError('BAD_STEP', 'Kart zaten seçildi.');
  if (!t.hand.includes(cardId)) throw new IntentError('BAD_CARD', 'Bu kart elinde yok.');
  const card = ctx.catalog.get(cardId)!;
  const handCards = t.hand.map((id) => ctx.catalog.get(id)!);
  const maxI = Math.max(...handCards.map((c) => c.intensity));
  const minI = Math.min(...handCards.map((c) => c.intensity));
  t.cardId = cardId;
  t.pickedTop = card.intensity === maxI && maxI > minI;
  // Seçilmeyenlerden en yoğunu sonraki okuyucuya miras kalır
  s.game!.nextInherit = pickInherit(ctx.catalog, t.hand.filter((id) => id !== cardId), ctx.rng);
  fx.push({ kind: 'cardPlayed', payload: { readerId: by } });
  const need = needsPick(card);
  // Hassas kartlarda (flört/temas) hedefi sistem seçer: okuyucu kimin katılımı açık olduğunu öğrenemez
  if (need > 0 && !isSensitive(card) && targetPool(s, card, t.readerId).length > need) {
    t.step = 'target';
    setPhase(s, ctx, 'choose', DUR.target);
  } else {
    // Seçecek kadar aday yoksa hedefler kendiliğinden belirlenir
    finalizeTargets(s, ctx, fx, card, null);
  }
}

export function pickTarget(s: GameState, ctx: Ctx, fx: Fx[], by: string, ids: string[]) {
  const t = requireTurn(s, 'choose');
  if (t.readerId !== by) throw new IntentError('NOT_READER', 'Sıra sende değil.');
  if (t.step !== 'target' || !t.cardId) throw new IntentError('BAD_STEP', 'Önce bir kart seç.');
  const card = ctx.catalog.get(t.cardId)!;
  const need = needsPick(card);
  const uniq = [...new Set(ids)];
  const pool = new Set(targetPool(s, card, t.readerId).map((p) => p.id));
  if (uniq.length !== need || !uniq.every((id) => pool.has(id))) throw new IntentError('BAD_TARGET', need === 2 ? 'İki kişi seç.' : 'Bir kişi seç.');
  finalizeTargets(s, ctx, fx, card, uniq);
}

function finalizeTargets(s: GameState, ctx: Ctx, fx: Fx[], card: Card, picked: string[] | null) {
  const t = s.game!.turn!;
  const rng = ctx.rng;
  const pool = targetPool(s, card, t.readerId);
  let targets: string[] = [];
  switch (card.target) {
    case 'all':
      targets = activePlayers(s).filter((p) => p.id === t.readerId ? feasibleSelf(s, card, p.id) : pool.some((x) => x.id === p.id)).map((p) => p.id);
      break;
    case 'reader':
      targets = [t.readerId];
      break;
    case 'picked':
    case 'twoPicked': {
      const need = needsPick(card);
      targets = picked ?? [];
      const rest = pool.filter((p) => !targets.includes(p.id));
      while (targets.length < need && rest.length) {
        const p = weightedRandomPlayer(s, rng, rest)!;
        targets.push(p.id);
        rest.splice(rest.indexOf(p), 1);
      }
      break;
    }
    case 'random': {
      const p = weightedRandomPlayer(s, rng, pool);
      if (p) targets = [p.id];
      break;
    }
    case 'right':
    case 'left': {
      const n = neighbor(s, t.readerId, card.target === 'right' ? 1 : -1);
      if (n) targets = [n];
      break;
    }
  }
  t.targets = targets;
  t.step = 'choose';
  const tokens: Turn['tokens'] = { okuyucu: t.readerId };
  if (card.target === 'picked' || card.target === 'twoPicked') {
    tokens.secilen = targets[0];
    tokens.ikinci = targets[1];
  }
  if (card.target === 'random') tokens.rastgele = targets[0];
  else if (hasToken(card, 'rastgele')) {
    const others = pool.filter((p) => !targets.includes(p.id));
    const r = weightedRandomPlayer(s, rng, others);
    if (r) tokens.rastgele = r.id;
  }
  tokens.sag = neighbor(s, t.readerId, 1);
  tokens.sol = neighbor(s, t.readerId, -1);
  t.tokens = tokens;
  for (const id of targets) if (card.target !== 'all') ensureAndBump(s, id);
  setPhase(s, ctx, 'reveal', DUR.reveal);
  fx.push({ kind: 'reveal', payload: { cardId: card.id, rarity: card.rarity } });
}

function feasibleSelf(s: GameState, card: Card, readerId: string): boolean {
  const p = getPlayer(s, readerId);
  return !!p && consents(p, card);
}

function ensureAndBump(s: GameState, id: string) {
  ensureStats(s, id);
  s.stats[id]!.targeted++;
}

// --- eylem fazı ---

export type ActionKind = 'judge' | 'votePlayer' | 'yesNo';

export function actionKind(card: Card): ActionKind {
  if (card.input === 'votePlayer') return 'votePlayer';
  if (card.input === 'yesNo') return 'yesNo';
  return 'judge';
}

// Bu fazda girdi vermesi beklenen oyuncular
export function expectedInputs(s: GameState, ctx: Pick<Ctx, 'catalog'>): string[] {
  const t = s.game?.turn;
  if (!t || !t.cardId) return [];
  const card = ctx.catalog.get(t.cardId)!;
  const k = actionKind(card);
  if (k === 'judge') return [t.readerId];
  if (k === 'votePlayer') return activePlayers(s).map((p) => p.id);
  return t.targets.filter((id) => getPlayer(s, id) && !getPlayer(s, id)!.left);
}

function beginAction(s: GameState, ctx: Ctx) {
  const t = s.game!.turn!;
  const card = ctx.catalog.get(t.cardId!)!;
  const k = actionKind(card);
  const dur = k === 'votePlayer' ? DUR.vote : k === 'yesNo' ? DUR.yesNo : DUR.judge + (card.timer ?? 0) * 1000;
  setPhase(s, ctx, 'action', dur);
}

export function submitInput(s: GameState, ctx: Ctx, fx: Fx[], by: string, value: InputValue) {
  const t = requireTurn(s, 'action');
  const card = ctx.catalog.get(t.cardId!)!;
  const k = actionKind(card);
  if (!expectedInputs(s, ctx).includes(by)) throw new IntentError('NOT_YOURS', 'Bu turda senden girdi beklenmiyor.');
  if (t.inputs[by]) throw new IntentError('ALREADY', 'Zaten verdin.');
  if (value.k === 'vote') {
    if (k !== 'votePlayer') throw new IntentError('BAD_INPUT', 'Bu kartta oy yok.');
    if (value.playerId === by) throw new IntentError('BAD_TARGET', 'Kendine oy veremezsin.');
    const target = getPlayer(s, value.playerId);
    if (!target || target.left) throw new IntentError('BAD_TARGET', 'Böyle biri masada yok.');
  } else if (k !== 'yesNo') throw new IntentError('BAD_INPUT', 'Bu kartta evet/hayır yok.');
  t.inputs[by] = value;
  fx.push({ kind: 'inputIn', payload: { playerId: by } });
  const waiting = expectedInputs(s, ctx).filter((id) => !t.inputs[id]);
  if (waiting.length === 0) resolveTurn(s, ctx, fx);
}

export function judge(s: GameState, ctx: Ctx, fx: Fx[], by: string, done: boolean | undefined, payers: string[] | undefined) {
  const t = requireTurn(s, 'action');
  const card = ctx.catalog.get(t.cardId!)!;
  if (actionKind(card) !== 'judge') throw new IntentError('BAD_INPUT', 'Bu kartta hüküm yok.');
  if (t.readerId !== by) throw new IntentError('NOT_READER', 'Hükmü okuyucu verir.');
  if (payers) {
    const valid = new Set(t.targets);
    t.judgedPayers = [...new Set(payers)].filter((id) => valid.has(id));
  } else {
    t.judgedPayers = done === false ? [...t.targets] : [];
  }
  resolveTurn(s, ctx, fx);
}

function resolveTurn(s: GameState, ctx: Ctx, fx: Fx[]) {
  const g = s.game!;
  const t = g.turn!;
  const card = ctx.catalog.get(t.cardId!)!;
  const k = actionKind(card);
  const result: TurnResult = { payments: [], courage: [], mini: [], waterBreak: [] };
  let payers: string[] = [];

  if (k === 'judge') {
    payers = t.judgedPayers ?? []; // hüküm gelmediyse kimse ödemez
    result.done = payers.length === 0;
    for (const id of t.targets) {
      ensureStats(s, id);
      if (payers.includes(id)) s.stats[id]!.failed++;
      else {
        s.stats[id]!.done++;
        result.courage.push({ id, pts: 1, why: 'görevi yaptı' });
      }
    }
  } else if (k === 'votePlayer') {
    const tally: Record<string, number> = {};
    for (const v of Object.values(t.inputs)) if (v.k === 'vote') tally[v.playerId] = (tally[v.playerId] ?? 0) + 1;
    result.tally = tally;
    const max = Math.max(0, ...Object.values(tally));
    // En çok oy alan öder, eşitlikte hepsi öder
    if (max > 0) payers = Object.keys(tally).filter((id) => tally[id] === max);
  } else {
    result.yesIds = Object.entries(t.inputs).filter(([, v]) => v.k === 'yesNo' && v.yes).map(([id]) => id);
    payers = result.yesIds;
  }

  if (t.pickedTop) result.courage.push({ id: t.readerId, pts: 1, why: 'en yoğun kartı seçti' });
  for (const c of result.courage) {
    ensureStats(s, c.id);
    s.stats[c.id]!.courage += c.pts;
  }
  // Ödeme sırası deterministik: oturma düzenine göre
  const ordered = s.order.filter((id) => payers.includes(id));
  for (const id of ordered) {
    const p = getPlayer(s, id);
    if (!p) continue;
    ensureStats(s, id);
    applyPayment(s, ctx.rng, ctx.now, p, card.penalty, result);
  }
  t.result = result;
  g.used = g.used.filter((id) => id !== card.id);
  g.used.push(card.id);
  g.recentTypes = [...g.recentTypes, card.type].slice(-2);
  g.log.push({ n: g.turnNo + 1, act: g.act, readerId: t.readerId, cardId: card.id, type: card.type, payers });
  setPhase(s, ctx, 'resolve', DUR.resolve);
  fx.push({ kind: 'resolve', payload: { payers } });
  for (const id of result.waterBreak) fx.push({ kind: 'waterBreak', to: [id] });
}

function nextTurn(s: GameState, ctx: Ctx, fx: Fx[]) {
  const g = s.game!;
  g.actTurn++;
  g.turnNo++;
  g.readerIdx = (g.readerIdx + 1) % Math.max(1, s.order.length);
  if (g.actTurn >= g.actTurns) {
    if (g.act < 3) beginAct(s, ctx, fx, (g.act + 1) as 2 | 3);
    else endGame(s, ctx, fx);
    return;
  }
  startTurn(s, ctx, fx);
}

function endGame(s: GameState, ctx: Ctx, fx: Fx[]) {
  const g = s.game!;
  g.turn = null;
  g.endedAt = ctx.now;
  setPhase(s, ctx, 'summary', null);
  fx.push({ kind: 'summary' });
}

// Faz süresi doldu
export function onPhaseTimeout(s: GameState, ctx: Ctx, fx: Fx[]) {
  const g = s.game;
  if (!g) return;
  // Bağlı insan kalmadıysa masa bekler (boşuna tur dönmez)
  if (!activePlayers(s).some((p) => !p.isBot && p.connected)) {
    s.timers.push({ id: `ph-${s.seq++}`, kind: 'phase', at: ctx.now + 30_000 });
    g.phaseEndsAt = ctx.now + 30_000;
    return;
  }
  switch (s.phase) {
    case 'actIntro':
      startTurn(s, ctx, fx);
      break;
    case 'choose': {
      const t = g.turn!;
      if (t.step === 'choose') {
        // Süre dolarsa en düşük yoğunluklu kart oynanır
        const cards = t.hand.map((id) => ctx.catalog.get(id)!);
        const minI = Math.min(...cards.map((c) => c.intensity));
        playCard(s, ctx, fx, t.readerId, cards.find((c) => c.intensity === minI)!.id);
        if (s.phase === 'choose' && (t.step as Turn['step']) === 'target') finalizeTargets(s, ctx, fx, ctx.catalog.get(t.cardId!)!, null);
      } else {
        finalizeTargets(s, ctx, fx, ctx.catalog.get(t.cardId!)!, null);
      }
      break;
    }
    case 'reveal':
      beginAction(s, ctx);
      break;
    case 'action':
      resolveTurn(s, ctx, fx);
      break;
    case 'resolve':
      nextTurn(s, ctx, fx);
      break;
  }
}

function requireTurn(s: GameState, phase: Phase): Turn {
  if (s.phase !== phase || !s.game?.turn) throw new IntentError('BAD_PHASE', 'Şu an bunu yapamazsın.');
  return s.game.turn;
}

// Şu an eylem bekleyen oyuncular (botlar için)
export function pendingActors(s: GameState, ctx: Pick<Ctx, 'catalog'>): string[] {
  const t = s.game?.turn;
  if (!t) return [];
  if (s.phase === 'choose') return [t.readerId];
  if (s.phase === 'action') return expectedInputs(s, ctx).filter((id) => !t.inputs[id]);
  return [];
}
