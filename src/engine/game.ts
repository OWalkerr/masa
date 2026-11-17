// Tur döngüsü:
// actIntro → choose → reveal → action → resolve → (tableEvent) → sonraki tur … → finale → summary
// Kurallar/lanetler masada kalır; "Yakala!" oylaması herhangi bir fazda paralel çalışır.
import type { Card } from './cards';
import {
  consents, dealHand, hasToken, isSensitive, modePool, needsPick, neighbor, pickInherit, targetPool, weightedRandomPlayer,
} from './deck';
import { currentHolder, minigameInput, scoreMinigame, startMinigame, tickMinigame } from './minigames';
import { clearSketch, drawSegment, guessWord, newSketch, scoreSketch, SKETCH, undoStroke } from './sketch';
import { GALLERY, galleryDone, galleryDraw, galleryUndo, galleryVote, newGallery, scoreGallery, toVote } from './gallery';
import { applyPayment, emptyStats, revertPayment } from './penalties';
import { activePlayers, getPlayer } from './state';
import { getCard, TAG } from './systemCards';
import {
  DUR, IntentError, MAX_CONFESSION, MAX_POCKET, MAX_RULES, POT_MAX, ROUNDS_PER_ACT,
  type ActiveEffect, type Ctx, type MinigameState, type Fx, type GameState, type InputValue, type Phase, type PowerKind, type TokenKey,
  type Turn, type TurnResult,
} from './types';

const POWERS: PowerKind[] = ['shield', 'mirror', 'swap', 'sabotage'];
export const POWER_NAMES: Record<PowerKind, string> = { shield: 'Kalkan', mirror: 'Ayna', swap: 'Takas', sabotage: 'Sabotaj' };

export function startGame(s: GameState, ctx: Ctx, fx: Fx[]) {
  s.stats = {};
  for (const p of activePlayers(s)) s.stats[p.id] = emptyStats();
  s.game = {
    act: 1, actTurn: 0, actTurns: 0, turnNo: 0, readerIdx: 0, phaseEndsAt: null, turn: null,
    nextInherit: null, used: [], recentTypes: [], log: [], endedAt: null,
    direction: 1, effects: [], catchVote: null, blindTurns: 0, pendingEvent: null, pot: 0,
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

// Rahat tempoda yalnızca geri sayımın oyunun parçası olduğu anlar (mini oyun, perde/açılış animasyonu) sürelidir;
// gerisinde masa konuşur, host "Sonraki" der.
function pdur(s: GameState, ms: number): number | null {
  return s.settings.pace === 'timed' ? ms : null;
}

function card(ctx: Pick<Ctx, 'catalog'>, id: string): Card {
  const c = getCard(ctx.catalog, id);
  if (!c) throw new IntentError('BAD_CARD', 'Kart bulunamadı.');
  return c;
}

function newTurn(readerId: string, over: Partial<Turn> = {}): Turn {
  return {
    readerId, hand: [], inherited: null, cardId: null, step: 'choose', targets: [], tokens: {}, inputs: {},
    judgedPayers: null, result: null, pickedTop: false, rest: [], swapped: false, sabotagedBy: null, passed: [],
    vetoed: false, stage: 'main', texts: {}, spotlightAuthor: null, shuffled: [], system: false, blind: false,
    options: [], optionPlayers: false, mg: null, sk: null, gal: null, secret: null, ...over,
  };
}

function emptyResult(): TurnResult {
  return { payments: [], courage: [], mini: [], waterBreak: [] };
}

// --- perde ---

function beginAct(s: GameState, ctx: Ctx, fx: Fx[], act: 1 | 2 | 3) {
  const g = s.game!;
  if (act > 1) endActEffects(s, fx);
  g.act = act;
  g.actTurn = 0;
  // Her perde en az 1 tam tur sürer: her oyuncu en az bir kez okuyucu olur
  g.actTurns = Math.max(ROUNDS_PER_ACT[s.settings.length], activePlayers(s).length);
  g.turn = null;
  setPhase(s, ctx, 'actIntro', DUR.actIntro);
  fx.push({ kind: 'actIntro', payload: { act } });
}

// Perde sonu: "perde sonuna kadar" süren etkiler ve fermanlar biter
function endActEffects(s: GameState, fx: Fx[]) {
  const g = s.game!;
  const gone = g.effects.filter((e) => e.turnsLeft === 'act');
  g.effects = g.effects.filter((e) => e.turnsLeft !== 'act');
  for (const st of Object.values(s.stats)) st.decree = false;
  if (gone.length) fx.push({ kind: 'effectsEnded', payload: { ids: gone.map((e) => e.id) } });
}

function currentReaderOk(s: GameState, id: string | undefined): boolean {
  const p = id ? getPlayer(s, id) : undefined;
  if (!p || p.left) return false;
  ensureStats(s, p.id);
  // 2 tur boyunca bağlı olmayan okuyucunun sırası atlanır
  if (!p.isBot && !p.connected && s.stats[p.id]!.missedTurns >= 2) return false;
  return true;
}

function stepReader(s: GameState) {
  const g = s.game!;
  const n = Math.max(1, s.order.length);
  g.readerIdx = (((g.readerIdx + g.direction) % n) + n) % n;
}

function startTurn(s: GameState, ctx: Ctx, fx: Fx[]) {
  const g = s.game!;
  const n = s.order.length;
  let tries = 0;
  while (tries < n && !currentReaderOk(s, s.order[g.readerIdx % n])) {
    stepReader(s);
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
  const blind = g.blindTurns > 0;
  if (blind) g.blindTurns--;
  g.turn = newTurn(readerId, { hand, inherited: inherit && hand.includes(inherit) ? inherit : null, blind });
  setPhase(s, ctx, 'choose', pdur(s, DUR.deal + DUR.choose));
  fx.push({ kind: 'deal', payload: { readerId } });
}

// --- okuyucu eylemleri ---

export function playCard(s: GameState, ctx: Ctx, fx: Fx[], by: string, rawId: string) {
  const t = requireTurn(s, 'choose');
  if (t.system || t.readerId !== by) throw new IntentError('NOT_READER', 'Sıra sende değil.');
  if (t.step !== 'choose' || t.cardId) throw new IntentError('BAD_STEP', 'Kart zaten seçildi.');
  // Hayalet Saati: okuyucu kartları kapalı görür, sırayla "blind-0..2" ile seçer
  const blindIdx = rawId.startsWith('blind-') ? Number(rawId.slice(6)) : -1;
  const cardId = t.blind && blindIdx >= 0 ? t.hand[blindIdx] : rawId;
  if (!cardId || !t.hand.includes(cardId)) throw new IntentError('BAD_CARD', 'Bu kart elinde yok.');
  const c = card(ctx, cardId);
  const handCards = t.hand.map((id) => card(ctx, id));
  const maxI = Math.max(...handCards.map((x) => x.intensity));
  const minI = Math.min(...handCards.map((x) => x.intensity));
  t.cardId = cardId;
  t.pickedTop = c.intensity === maxI && maxI > minI;
  t.rest = t.hand.filter((id) => id !== cardId);
  // Seçilmeyenlerden en yoğunu sonraki okuyucuya miras kalır
  s.game!.nextInherit = pickInherit(ctx.catalog, t.rest, ctx.rng);
  fx.push({ kind: 'cardPlayed', payload: { readerId: by } });
  const need = needsPick(c);
  // Hassas kartlarda (flört/temas) hedefi sistem seçer: okuyucu kimin katılımı açık olduğunu öğrenemez
  if (need > 0 && !isSensitive(c) && targetPool(s, c, t.readerId).length > need) {
    t.step = 'target';
    setPhase(s, ctx, 'choose', pdur(s, DUR.target));
  } else {
    finalizeTargets(s, ctx, fx, c, null);
  }
}

export function pickTarget(s: GameState, ctx: Ctx, fx: Fx[], by: string, ids: string[]) {
  const t = requireTurn(s, 'choose');
  if (t.readerId !== by) throw new IntentError('NOT_READER', 'Sıra sende değil.');
  if (t.step !== 'target' || !t.cardId) throw new IntentError('BAD_STEP', 'Önce bir kart seç.');
  const c = card(ctx, t.cardId);
  const need = needsPick(c);
  const uniq = [...new Set(ids)];
  const pool = new Set(targetPool(s, c, t.readerId).map((p) => p.id));
  if (uniq.length !== need || !uniq.every((id) => pool.has(id))) throw new IntentError('BAD_TARGET', need === 2 ? 'İki kişi seç.' : 'Bir kişi seç.');
  finalizeTargets(s, ctx, fx, c, uniq);
}

function finalizeTargets(s: GameState, ctx: Ctx, fx: Fx[], c: Card, picked: string[] | null) {
  const t = s.game!.turn!;
  const rng = ctx.rng;
  const pool = targetPool(s, c, t.readerId);
  let targets: string[] = [];
  switch (c.target) {
    case 'all':
      targets = activePlayers(s).filter((p) => (p.id === t.readerId ? consents(p, c) : pool.some((x) => x.id === p.id))).map((p) => p.id);
      break;
    case 'reader':
      targets = [t.readerId];
      break;
    case 'picked':
    case 'twoPicked': {
      const need = needsPick(c);
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
      // Gizli görev: ajan okuyucu dahil herkesten seçilir, kimse (okuyucu da) bilmez
      const from = c.type === 'mission' ? activePlayers(s).filter((p) => consents(p, c)) : pool;
      const p = c.type === 'mission' ? rng.pick(from) : weightedRandomPlayer(s, rng, from);
      if (p) targets = [p.id];
      break;
    }
    case 'right':
    case 'left': {
      const n = neighbor(s, t.readerId, c.target === 'right' ? 1 : -1);
      if (n) targets = [n];
      break;
    }
  }
  t.targets = targets;
  t.step = 'choose';
  t.tokens = makeTokens(s, ctx, c, t.readerId, targets);
  if (c.type === 'mirror') {
    if (c.choices === '$players') {
      t.options = activePlayers(s).map((p) => p.id);
      t.optionPlayers = true;
    } else t.options = [...(c.choices ?? [])];
  }
  if (c.secret) {
    const opts = c.secret.split('|').map((x) => x.trim()).filter(Boolean);
    t.secret = opts.length ? rng.pick(opts) : null;
  }
  if (c.type === 'mirror' && c.choices === '$scale') t.options = Array.from({ length: 10 }, (_, i) => String(i + 1));
  // Görevin ajanı istatistikten de ele verilmesin
  for (const id of targets) if (c.target !== 'all' && c.type !== 'mission') ensureAndBump(s, id);
  setPhase(s, ctx, 'reveal', DUR.reveal);
  fx.push({ kind: 'reveal', payload: { cardId: c.id, rarity: c.rarity } });
}

function makeTokens(s: GameState, ctx: Ctx, c: Card, readerId: string, targets: string[]): Turn['tokens'] {
  const tokens: Turn['tokens'] = { okuyucu: readerId };
  if (c.target === 'picked' || c.target === 'twoPicked') {
    tokens.secilen = targets[0];
    tokens.ikinci = targets[1];
  }
  if (c.target === 'random') tokens.rastgele = targets[0];
  else if (hasToken(c, 'rastgele')) {
    const others = targetPool(s, c, readerId).filter((p) => !targets.includes(p.id));
    const r = weightedRandomPlayer(s, ctx.rng, others);
    if (r) tokens.rastgele = r.id;
  }
  tokens.sag = neighbor(s, readerId, 1);
  tokens.sol = neighbor(s, readerId, -1);
  return tokens;
}

export function resolveText(s: GameState, text: string, tokens: Partial<Record<TokenKey, string>>): string {
  return text.replace(/\{([a-z]+)\}/g, (m, k: TokenKey) => {
    const id = tokens[k];
    return (id && getPlayer(s, id)?.name) || m;
  });
}

function ensureAndBump(s: GameState, id: string) {
  ensureStats(s, id);
  s.stats[id]!.targeted++;
}

// --- eylem fazı ---

export type ActionKind = 'judge' | 'votePlayer' | 'yesNo' | 'choice' | 'text' | 'minigame' | 'draw' | 'drawAll' | 'none';

export function actionKind(c: Card): ActionKind {
  switch (c.type) {
    case 'rule':
    case 'curse':
    case 'tableEvent':
    case 'mission':
      return 'none';
    case 'mirror':
      return 'choice';
    case 'minigame':
      return 'minigame';
    case 'sketch':
      return 'draw';
    case 'gallery':
      return 'drawAll';
    case 'confession':
      return 'text';
    case 'duel':
    case 'mostLikely':
      return 'votePlayer';
    case 'neverHave':
      return 'yesNo';
    case 'golden':
      return c.input === 'votePlayer' ? 'votePlayer' : c.input === 'judge' ? 'judge' : 'none';
    default:
      return c.input === 'votePlayer' ? 'votePlayer' : c.input === 'yesNo' ? 'yesNo' : 'judge';
  }
}

// Bu fazda girdi vermesi beklenen oyuncular
export function expectedInputs(s: GameState, ctx: Pick<Ctx, 'catalog'>): string[] {
  const t = s.game?.turn;
  if (!t || !t.cardId || s.phase !== 'action') return [];
  const c = getCard(ctx.catalog, t.cardId)!;
  const active = activePlayers(s).map((p) => p.id);
  let ids: string[];
  switch (actionKind(c)) {
    case 'judge':
      ids = t.targets.every((id) => t.passed.includes(id)) ? [] : [t.readerId];
      return ids;
    case 'votePlayer':
      if (c.type === 'duel') ids = active.filter((id) => !t.targets.includes(id));
      else if (c.type === 'golden') ids = [t.readerId];
      else ids = active;
      break;
    case 'yesNo':
      ids = t.targets.filter((id) => active.includes(id));
      break;
    case 'choice':
      ids = active;
      break;
    case 'text':
      ids = t.stage === 'guess' ? active.filter((id) => id !== t.spotlightAuthor) : active;
      break;
    case 'drawAll': {
      // Sergi: çizimde teslim etmeyenler, galeride oy vermeyenler
      const gl = t.gal;
      if (!gl) return [];
      const live = active.filter((id) => !t.passed.includes(id));
      return gl.stage === 'draw' ? live.filter((id) => !gl.done.includes(id)) : active.filter((id) => gl.votes[id] === undefined && gl.order.some((a) => a !== id));
    }
    case 'draw':
      // Henüz bilemeyen tahminciler
      ids = t.sk ? active.filter((id) => id !== t.sk!.drawer && !t.sk!.correct.includes(id)) : [];
      break;
    default:
      return [];
  }
  return ids.filter((id) => !t.passed.includes(id));
}

function beginAction(s: GameState, ctx: Ctx, fx: Fx[]) {
  const t = s.game!.turn!;
  const c = card(ctx, t.cardId!);
  const k = actionKind(c);
  if (k === 'none') return resolveTurn(s, ctx, fx);
  if (k === 'minigame') {
    const { state, nextAt } = startMinigame(s, ctx, c);
    t.mg = state;
    setPhase(s, ctx, 'action', nextAt - ctx.now);
    fx.push({ kind: 'mgStart', payload: { kind: state.kind } });
    return;
  }
  if (k === 'drawAll') {
    // Sergi: konu herkese açık, çizim süresi tempodan bağımsız işler
    t.gal = newGallery(ctx.now, c.timer ?? GALLERY.defaultSec, t.secret ?? 'Kendi portren');
    setPhase(s, ctx, 'action', t.gal.endsAt - ctx.now);
    fx.push({ kind: 'galleryStart' });
    return;
  }
  if (k === 'draw') {
    // Karakalem: süre oyunun parçasıdır, tempo ne olursa olsun geri sayım işler
    const drawer = t.targets[0] ?? t.readerId;
    t.sk = newSketch(ctx.now, c.timer ?? SKETCH.defaultSec, drawer);
    setPhase(s, ctx, 'action', t.sk.endsAt - ctx.now);
    fx.push({ kind: 'sketchStart', payload: { drawer } });
    return;
  }
  if (k === 'text') t.stage = 'write';
  const dur =
    k === 'votePlayer' ? DUR.vote : k === 'yesNo' ? DUR.yesNo : k === 'choice' ? DUR.mirror : k === 'text' ? DUR.write : DUR.judge + (c.timer ?? 0) * 1000;
  setPhase(s, ctx, 'action', pdur(s, dur));
}

export function submitInput(s: GameState, ctx: Ctx, fx: Fx[], by: string, value: InputValue) {
  const t = requireTurn(s, 'action');
  const c = card(ctx, t.cardId!);
  const k = actionKind(c);
  if (!expectedInputs(s, ctx).includes(by)) throw new IntentError('NOT_YOURS', 'Bu turda senden girdi beklenmiyor.');
  if (t.inputs[by]) throw new IntentError('ALREADY', 'Zaten verdin.');
  if (value.k === 'vote') {
    if (k !== 'votePlayer' && !(k === 'text' && t.stage === 'guess')) throw new IntentError('BAD_INPUT', 'Bu kartta oy yok.');
    if (value.playerId === by) throw new IntentError('BAD_TARGET', 'Kendine oy veremezsin.');
    const target = getPlayer(s, value.playerId);
    if (!target || target.left) throw new IntentError('BAD_TARGET', 'Böyle biri masada yok.');
    if (c.type === 'duel' && !t.targets.includes(value.playerId)) throw new IntentError('BAD_TARGET', 'Düellocular arasından seç.');
  } else if (value.k === 'yesNo') {
    if (k !== 'yesNo') throw new IntentError('BAD_INPUT', 'Bu kartta evet/hayır yok.');
  } else if (value.k === 'choice') {
    if (k !== 'choice') throw new IntentError('BAD_INPUT', 'Bu kartta seçim yok.');
    if (!Number.isInteger(value.index) || value.index < 0 || value.index >= t.options.length) throw new IntentError('BAD_INPUT', 'Geçersiz seçenek.');
  }
  t.inputs[by] = value;
  fx.push({ kind: 'inputIn', payload: { playerId: by } });
  maybeComplete(s, ctx, fx);
}

// İtiraf: herkes anonim yazar (en fazla 80 karakter)
export function answerText(s: GameState, ctx: Ctx, fx: Fx[], by: string, raw: string) {
  const t = requireTurn(s, 'action');
  const c = card(ctx, t.cardId!);
  if (actionKind(c) !== 'text' || t.stage !== 'write') throw new IntentError('BAD_INPUT', 'Şu an yazı beklenmiyor.');
  if (!expectedInputs(s, ctx).includes(by)) throw new IntentError('NOT_YOURS', 'Bu turda senden cevap beklenmiyor.');
  if (t.texts[by] !== undefined) throw new IntentError('ALREADY', 'Zaten yazdın.');
  const text = cleanText(raw, MAX_CONFESSION);
  if (!text) throw new IntentError('EMPTY', 'Bir şey yaz.');
  t.texts[by] = text;
  fx.push({ kind: 'inputIn', payload: { playerId: by } });
  maybeComplete(s, ctx, fx);
}

export function cleanText(raw: string, max: number): string {
  const s = raw.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮]/g, ' ').replace(/\s+/g, ' ').trim();
  return [...s].slice(0, max).join('').trim();
}

function maybeComplete(s: GameState, ctx: Ctx, fx: Fx[]) {
  const t = s.game!.turn!;
  const waiting = expectedInputs(s, ctx).filter((id) => (t.stage === 'write' ? t.texts[id] === undefined : !t.inputs[id]));
  if (waiting.length > 0) return;
  if (t.stage === 'write') toGuessStage(s, ctx, fx);
  else resolveTurn(s, ctx, fx);
}

// Cevaplar karışık gösterilir, biri spot ışığına alınır, masa yazarını tahmin eder
function toGuessStage(s: GameState, ctx: Ctx, fx: Fx[]) {
  const t = s.game!.turn!;
  const authors = Object.keys(t.texts);
  if (authors.length < 2) {
    t.result = { ...emptyResult(), note: 'Yeterli itiraf yok. Sırlar mezarda kaldı.' };
    return resolveTurn(s, ctx, fx);
  }
  t.shuffled = ctx.rng.shuffle([...authors]);
  t.spotlightAuthor = ctx.rng.pick(authors);
  t.stage = 'guess';
  t.inputs = {};
  setPhase(s, ctx, 'action', pdur(s, DUR.guess));
  fx.push({ kind: 'spotlight' });
}

export function judge(s: GameState, ctx: Ctx, fx: Fx[], by: string, done: boolean | undefined, payers: string[] | undefined) {
  const t = requireTurn(s, 'action');
  const c = card(ctx, t.cardId!);
  if (actionKind(c) !== 'judge') throw new IntentError('BAD_INPUT', 'Bu kartta hüküm yok.');
  if (t.readerId !== by) throw new IntentError('NOT_READER', 'Hükmü okuyucu verir.');
  const live = t.targets.filter((id) => !t.passed.includes(id));
  if (payers) {
    const valid = new Set(live);
    t.judgedPayers = [...new Set(payers)].filter((id) => valid.has(id));
  } else {
    t.judgedPayers = done === false ? [...live] : [];
  }
  resolveTurn(s, ctx, fx);
}

function resolveTurn(s: GameState, ctx: Ctx, fx: Fx[]) {
  const g = s.game!;
  const t = g.turn!;
  const c = card(ctx, t.cardId!);
  const k = actionKind(c);
  const result: TurnResult = { ...emptyResult(), ...(t.result ?? {}) };
  let payers: string[] = [];
  let units = c.penalty;
  const tally = (): Record<string, number> => {
    const r: Record<string, number> = {};
    for (const v of Object.values(t.inputs)) if (v.k === 'vote') r[v.playerId] = (r[v.playerId] ?? 0) + 1;
    return r;
  };

  switch (c.type) {
    case 'rule':
    case 'curse':
    case 'mission': {
      addEffect(s, ctx, c, t, result, fx);
      break;
    }
    case 'mostLikely': {
      const r = tally();
      result.tally = r;
      const max = Math.max(0, ...Object.values(r));
      // En çok oy alan öder, eşitlikte hepsi öder
      if (max > 0) payers = Object.keys(r).filter((id) => r[id] === max);
      break;
    }
    case 'duel': {
      const r = tally();
      result.tally = r;
      const [a, b] = t.targets;
      if (a && b) {
        const va = r[a] ?? 0, vb = r[b] ?? 0;
        if (va === vb) payers = va > 0 ? [a, b] : [];
        else {
          const winner = va > vb ? a : b;
          result.winner = winner;
          payers = [winner === a ? b : a];
          result.courage.push({ id: winner, pts: 2, why: 'düelloyu kazandı' });
        }
      }
      break;
    }
    case 'neverHave': {
      result.yesIds = Object.entries(t.inputs).filter(([, v]) => v.k === 'yesNo' && v.yes).map(([id]) => id);
      payers = result.yesIds;
      break;
    }
    case 'mirror': {
      const target = t.targets[0];
      const secret = target ? t.inputs[target] : undefined;
      if (!target || !secret || secret.k !== 'choice') {
        result.note = 'Ayna sisli kaldı: gizli seçim yapılmadı.';
        break;
      }
      result.secret = secret.index;
      const guessers = Object.keys(t.inputs).filter((id) => id !== target);
      const guessOf = (id: string) => (t.inputs[id] as { index: number }).index;
      result.guesses = Object.fromEntries(guessers.map((id) => [id, guessOf(id)]));
      const correct = guessers.filter((id) => guessOf(id) === secret.index);
      result.correct = correct;
      const tags = c.tags ?? [];
      if (tags.includes(TAG.scale)) {
        // Ölçek: en uzak tahmin(ler) içer; tam bilen çıkarsa hedef de içer
        const dist = (id: string) => Math.abs(guessOf(id) - secret.index);
        const far = Math.max(0, ...guessers.map(dist));
        payers = far > 0 ? guessers.filter((id) => dist(id) === far) : [];
        if (correct.length) payers.push(target);
      } else if (tags.includes(TAG.lie)) {
        // Yalan Makinesi: yalanı bulamayan içer; herkes bulursa yalancı içer
        payers = guessers.length > 0 && correct.length === guessers.length ? [target] : guessers.filter((id) => !correct.includes(id));
        if (correct.length < guessers.length) result.courage.push({ id: target, pts: 1, why: 'yalanı yutturdu' });
      } else {
        // Bilemeyenler içer; kimse bilemezse hedef içer
        payers = correct.length === 0 ? [target] : guessers.filter((id) => !correct.includes(id));
      }
      break;
    }
    case 'confession': {
      if (t.stage !== 'guess' || !t.spotlightAuthor) break; // yetersiz itiraf
      const author = t.spotlightAuthor;
      result.author = author;
      result.spotlight = t.texts[author];
      const voters = Object.keys(t.inputs);
      const correct = voters.filter((id) => (t.inputs[id] as { playerId?: string }).playerId === author);
      result.correct = correct;
      result.tally = tally();
      // Çoğunluk bilirse yazar öder, bilemezse yanlış tahmin edenler öder
      if (voters.length > 0) payers = correct.length * 2 > voters.length ? [author] : voters.filter((id) => !correct.includes(id));
      break;
    }
    case 'minigame': {
      if (t.mg) payers = scoreMinigame(s, t.mg, result);
      break;
    }
    case 'gallery': {
      if (!t.gal) break;
      if (t.gal.stage === 'draw') toVote(t.gal, activePlayers(s).map((p) => p.id).filter((id) => !t.passed.includes(id)), ctx.rng);
      payers = scoreGallery(t.gal, result);
      if (!payers.length) result.note = 'Kimse oy vermedi. Sanat eleştirmenleri sustu.';
      break;
    }
    case 'sketch': {
      if (!t.sk || !t.secret) break;
      if (t.passed.includes(t.sk.drawer)) {
        result.sketch = { word: t.secret.split('/')[0]!.trim(), drawer: t.sk.drawer, correct: [], strokes: t.sk.strokes };
        result.note = 'Ressam fırçayı bıraktı. Bu tur kimse içmiyor.';
        break;
      }
      const guessers = activePlayers(s).map((p) => p.id).filter((id) => id !== t.sk!.drawer);
      payers = scoreSketch(t.sk, guessers, result, t.secret);
      if (!t.sk.correct.length) result.note = 'Kimse bilemedi. Sanatçı anlaşılmamanın bedelini öder.';
      break;
    }
    case 'golden': {
      result.courage.push({ id: t.readerId, pts: 3, why: 'altın kart' });
      const tags = c.tags ?? [];
      if (tags.includes(TAG.decree)) {
        ensureStats(s, t.readerId);
        s.stats[t.readerId]!.decree = true;
        result.note = 'Perde sonuna kadar istediğin an bir kural koyabilirsin.';
      }
      if (tags.includes(TAG.pocket)) {
        givePower(s, fx, t.readerId, 'shield', true);
        givePower(s, fx, t.readerId, 'mirror', true);
        result.note = 'Cebine bir Kalkan ve bir Ayna girdi.';
      }
      if (c.input === 'catch') addEffect(s, ctx, c, t, result, fx);
      if (actionKind(c) === 'judge') payers = judgedPayers(s, t, result);
      if (tags.includes(TAG.transfer)) {
        const v = t.inputs[t.readerId];
        if (v?.k === 'vote') {
          const st = s.stats[t.readerId]!;
          units = st.paidHistory.slice(-3).reduce((a, b) => a + b, 0);
          if (units > 0) {
            payers = [v.playerId];
            st.paidUnits = Math.max(0, st.paidUnits - units);
            st.paidHistory = st.paidHistory.slice(0, -3);
            result.note = 'Son içtiklerin mezardan kalkıp yeni sahibine gitti: o içiyor.';
          } else result.note = 'Devredecek bir şey yok. Temiz bir ruhsun.';
        }
      }
      break;
    }
    default: {
      // question, dare: okuyucunun hükmü
      payers = judgedPayers(s, t, result);
    }
  }

  if (t.pickedTop) result.courage.push({ id: t.readerId, pts: 1, why: 'en yoğun kartı seçti' });
  for (const cg of result.courage) {
    ensureStats(s, cg.id);
    s.stats[cg.id]!.courage += cg.pts;
    grantPowers(s, ctx, fx, cg.id);
  }
  // Pas kullanan bedelsiz geçer
  if (t.passed.length) result.passed = [...t.passed];
  const ordered = s.order.filter((id) => payers.includes(id) && !t.passed.includes(id));
  // Kazan: boş geçen her turda bir yudum birikir; sonraki ilk cezalı kişi kazanı da içer (cezalılardan biri, rastgele)
  const feedsPot = !t.system && !['rule', 'curse', 'mission', 'golden', 'tableEvent'].includes(c.type);
  let potTaker: string | null = null;
  if (feedsPot && ordered.length === 0 && units > 0) {
    g.pot = Math.min(POT_MAX, (g.pot ?? 0) + 1);
    result.potAdd = g.pot;
    fx.push({ kind: 'potAdd', payload: { pot: g.pot } });
  } else if (ordered.length > 0 && (g.pot ?? 0) > 0) {
    potTaker = ctx.rng.pick(ordered);
    result.potSpill = { id: potTaker, units: g.pot };
    fx.push({ kind: 'potSpill', payload: { id: potTaker, units: g.pot } });
  }
  for (const id of ordered) {
    const p = getPlayer(s, id);
    if (!p) continue;
    ensureStats(s, id);
    applyPayment(s, ctx.rng, ctx.now, p, units + (id === potTaker ? g.pot : 0), result);
  }
  if (potTaker) g.pot = 0;
  grantMercy(s, ctx, fx, ordered, result);
  t.result = result;
  t.texts = {}; // anonim cevaplar tur bitince silinir (yalnızca spot ışığındaki sonuçta kalır)
  finishTurn(s, ctx, fx, c, ordered);
}

function judgedPayers(s: GameState, t: Turn, result: TurnResult): string[] {
  const payers = t.judgedPayers ?? []; // hüküm gelmediyse kimse ödemez
  result.done = payers.length === 0;
  for (const id of t.targets) {
    if (t.passed.includes(id)) continue;
    ensureStats(s, id);
    if (payers.includes(id)) s.stats[id]!.failed++;
    else {
      s.stats[id]!.done++;
      result.courage.push({ id, pts: 1, why: 'görevi yaptı' });
    }
  }
  return payers;
}

function finishTurn(s: GameState, ctx: Ctx, fx: Fx[], c: Card, payers: string[]) {
  const g = s.game!;
  const t = g.turn!;
  g.used = g.used.filter((id) => id !== c.id);
  if (ctx.catalog.has(c.id)) g.used.push(c.id);
  g.recentTypes = [...g.recentTypes, c.type].slice(-2);
  g.log.push({ n: g.turnNo + 1, act: g.act, readerId: t.readerId, cardId: c.id, type: c.type, payers });
  // Cebinde Kalkan/Ayna olan bir ödeyen varsa karar için süre uzar
  const canReact = (t.result?.payments ?? []).some((p) => s.stats[p.id]?.powers.some((x) => x === 'shield' || x === 'mirror'));
  setPhase(s, ctx, 'resolve', pdur(s, canReact ? DUR.resolvePower : c.type === 'rule' || c.type === 'curse' ? DUR.ruleResolve : DUR.resolve));
  fx.push({ kind: 'resolve', payload: { payers } });
  for (const id of t.result?.waterBreak ?? []) fx.push({ kind: 'waterBreak', to: [id] });
}

// --- kural / lanet ---

function addEffect(s: GameState, ctx: Ctx, c: Card, t: Turn, result: TurnResult, fx: Fx[]) {
  const g = s.game!;
  if (c.type === 'curse') {
    const target = t.targets[0];
    if (!target || g.effects.some((e) => e.kind === 'curse' && e.targetId === target)) {
      result.note = 'Lanetin tutacağı kimse kalmadı.';
      return;
    }
  } else if (c.type === 'mission') {
    if (!t.targets[0] || !t.secret) {
      result.note = 'Görev dağıtılamadı.';
      return;
    }
  } else if (rulesCount(s) >= MAX_RULES) {
    // en eski kural kalkar
    const oldest = g.effects.find((e) => e.kind === 'rule' || e.kind === 'decree' || e.kind === 'event');
    if (oldest) g.effects = g.effects.filter((e) => e !== oldest);
  }
  const e: ActiveEffect = {
    id: `ef-${s.seq++}`,
    cardId: c.id,
    kind: c.type === 'curse' ? 'curse' : c.type === 'mission' ? 'mission' : c.type === 'tableEvent' ? 'event' : 'rule',
    text: resolveText(s, c.text, t.tokens),
    targetId: c.type === 'curse' || c.type === 'mission' ? t.targets[0] : undefined,
    secret: c.type === 'mission' ? t.secret ?? undefined : undefined,
    turnsLeft: c.duration ?? 'act',
    penalty: Math.max(1, c.penalty),
    ownerId: t.system ? undefined : t.readerId,
  };
  g.effects.push(e);
  result.effect = e.id;
  if (e.kind === 'mission') {
    fx.push({ kind: 'mission', payload: { effectId: e.id } });
    fx.push({ kind: 'missionGiven', to: [e.targetId!] });
  } else fx.push({ kind: e.kind === 'curse' ? 'curse' : 'rule', payload: { effectId: e.id } });
}

export function rulesCount(s: GameState): number {
  return (s.game?.effects ?? []).filter((e) => e.kind !== 'curse' && e.kind !== 'mission').length;
}

// Sultan Kedi (ferman): perde sonuna kadar bir kez kendi kuralını koyar
export function decree(s: GameState, ctx: Ctx, fx: Fx[], by: string, raw: string) {
  const g = s.game;
  if (!g || s.phase === 'summary' || s.phase === 'finale') throw new IntentError('BAD_PHASE', 'Şu an kural konamaz.');
  const st = s.stats[by];
  if (!st?.decree) throw new IntentError('NO_DECREE', 'Ferman hakkın yok.');
  const text = cleanText(raw, MAX_CONFESSION);
  if (text.length < 3) throw new IntentError('EMPTY', 'Kuralı yaz.');
  if (rulesCount(s) >= MAX_RULES) {
    const oldest = g.effects.find((e) => e.kind !== 'curse' && e.kind !== 'mission');
    if (oldest) g.effects = g.effects.filter((e) => e !== oldest);
  }
  const e: ActiveEffect = { id: `ef-${s.seq++}`, cardId: 'decree', kind: 'decree', text: `Ferman: ${text}`, turnsLeft: 'act', penalty: 1, ownerId: by };
  g.effects.push(e);
  st.decree = false;
  fx.push({ kind: 'rule', payload: { effectId: e.id } });
}

// --- Yakala! ---

const CATCH_PHASES: Phase[] = ['choose', 'reveal', 'action', 'resolve', 'tableEvent'];

export function startCatch(s: GameState, ctx: Ctx, fx: Fx[], by: string, effectId: string, accused: string) {
  const g = s.game;
  if (!g || !CATCH_PHASES.includes(s.phase)) throw new IntentError('BAD_PHASE', 'Şu an yakalanamaz.');
  if (g.catchVote) throw new IntentError('BUSY', 'Masa zaten birini yargılıyor.');
  const e = g.effects.find((x) => x.id === effectId);
  if (!e) throw new IntentError('NO_EFFECT', 'Böyle bir kural yok.');
  const accuser = getPlayer(s, by), target = getPlayer(s, accused);
  if (!accuser || accuser.left || !target || target.left || by === accused) throw new IntentError('BAD_TARGET', 'Kimi yakaladın?');
  if (e.kind === 'curse' && e.targetId !== accused) throw new IntentError('BAD_TARGET', 'Bu lanet yalnızca lanetliyi bağlar.');
  ensureStats(s, by);
  if (s.stats[by]!.lastCatchAt && ctx.now - s.stats[by]!.lastCatchAt < DUR.catchCooldown) throw new IntentError('COOLDOWN', 'Biraz bekle, fenerin daha sönmedi.');
  s.stats[by]!.lastCatchAt = ctx.now;
  if (e.kind === 'mission') {
    if (e.targetId === by) throw new IntentError('BAD_TARGET', 'Ajan kendini ele veremez.');
    return guessAgent(s, ctx, fx, e, by, accused);
  }
  const endsAt = ctx.now + DUR.catchVote;
  g.catchVote = { id: `cv-${s.seq++}`, mode: 'rule', accuser: by, accused, effectId, endsAt, votes: {} };
  s.timers.push({ id: g.catchVote.id, kind: 'catch', at: endsAt });
  fx.push({ kind: 'catch', payload: { accuser: by, accused, effectId } });
  if (catchVoters(s).length === 0) resolveCatch(s, ctx, fx);
}

export function catchVoters(s: GameState): string[] {
  const cv = s.game?.catchVote;
  if (!cv) return [];
  return activePlayers(s).filter((p) => p.id !== cv.accuser && p.id !== cv.accused).map((p) => p.id);
}

export function voteCatch(s: GameState, ctx: Ctx, fx: Fx[], by: string, yes: boolean) {
  const cv = s.game?.catchVote;
  if (!cv) throw new IntentError('NO_CATCH', 'Oylanacak bir yakalama yok.');
  if (!catchVoters(s).includes(by)) throw new IntentError('NOT_YOURS', 'Bu oylamada oyun yok.');
  if (cv.votes[by] !== undefined) throw new IntentError('ALREADY', 'Zaten oyladın.');
  cv.votes[by] = yes;
  if (catchVoters(s).every((id) => cv.votes[id] !== undefined)) resolveCatch(s, ctx, fx);
}

export function resolveCatch(s: GameState, ctx: Ctx, fx: Fx[]) {
  const g = s.game!;
  const cv = g.catchVote;
  if (!cv) return;
  g.catchVote = null;
  s.timers = s.timers.filter((t) => t.id !== cv.id);
  const votes = Object.values(cv.votes);
  const yes = votes.filter(Boolean).length;
  const e = g.effects.find((x) => x.id === cv.effectId);
  const result = emptyResult();
  if (cv.mode === 'mission') {
    // Ajan "yaptım" dedi: masa onaylarsa herkes içer, onaylamazsa ajan içer. Eşitlik ajanın lehine.
    const done = votes.length === 0 || yes * 2 >= votes.length;
    g.effects = g.effects.filter((x) => x.id !== cv.effectId);
    const agent = getPlayer(s, cv.accused);
    if (done) {
      for (const p of activePlayers(s)) {
        if (p.id === cv.accused) continue;
        ensureStats(s, p.id);
        applyPayment(s, ctx.rng, ctx.now, p, e?.penalty ?? 1, result);
      }
      ensureStats(s, cv.accused);
      s.stats[cv.accused]!.courage += 2;
      grantPowers(s, ctx, fx, cv.accused);
    } else if (agent && !agent.left) {
      ensureStats(s, agent.id);
      applyPayment(s, ctx.rng, ctx.now, agent, e?.penalty ?? 1, result);
    }
    g.lastCatch = { ...cv, mode: 'mission', missionText: e?.secret, guilty: done, yes, no: votes.length - yes, payments: result.payments, mini: result.mini, waterBreak: result.waterBreak, at: ctx.now };
    fx.push({ kind: 'missionResult', payload: { done, agent: cv.accused } });
    for (const id of result.waterBreak) fx.push({ kind: 'waterBreak', to: [id] });
    return;
  }
  const guilty = yes * 2 > votes.length; // çoğunluk evet derse suçlanan içer
  // Yanlış suçlama yapan 1 içer
  const payer = getPlayer(s, guilty ? cv.accused : cv.accuser);
  if (payer && !payer.left) {
    ensureStats(s, payer.id);
    applyPayment(s, ctx.rng, ctx.now, payer, guilty ? e?.penalty ?? 1 : 1, result);
  }
  if (guilty) {
    ensureStats(s, cv.accuser);
    s.stats[cv.accuser]!.catches++;
  }
  g.lastCatch = { ...cv, guilty, yes, no: votes.length - yes, payments: result.payments, mini: result.mini, waterBreak: result.waterBreak, at: ctx.now };
  fx.push({ kind: 'catchResult', payload: { guilty, accused: cv.accused, accuser: cv.accuser } });
  for (const id of result.waterBreak) fx.push({ kind: 'waterBreak', to: [id] });
}

// --- gizli görev ---

// Yakala! ile ajan tahmini: sunucu gerçeği bilir, oylama gerekmez
function guessAgent(s: GameState, ctx: Ctx, fx: Fx[], e: ActiveEffect, by: string, accused: string) {
  const g = s.game!;
  const hit = e.targetId === accused;
  const result = emptyResult();
  const payer = getPlayer(s, hit ? accused : by);
  if (payer && !payer.left) {
    ensureStats(s, payer.id);
    applyPayment(s, ctx.rng, ctx.now, payer, hit ? e.penalty : 1, result);
  }
  if (hit) {
    g.effects = g.effects.filter((x) => x.id !== e.id);
    s.stats[by]!.catches++;
    s.stats[by]!.courage += 1;
    grantPowers(s, ctx, fx, by);
  }
  g.lastCatch = {
    id: `cv-${s.seq++}`, mode: 'missionGuess', accuser: by, accused, effectId: e.id, endsAt: ctx.now, votes: {},
    missionText: hit ? e.secret : undefined, guilty: hit, yes: 0, no: 0,
    payments: result.payments, mini: result.mini, waterBreak: result.waterBreak, at: ctx.now,
  };
  fx.push({ kind: 'catchResult', payload: { guilty: hit, accused, accuser: by } });
  for (const id of result.waterBreak) fx.push({ kind: 'waterBreak', to: [id] });
}

// Ajan görevini yaptığını söyler; masa birkaç saniyede onaylar
export function missionDone(s: GameState, ctx: Ctx, fx: Fx[], by: string, effectId: string) {
  const g = s.game;
  if (!g || !CATCH_PHASES.includes(s.phase)) throw new IntentError('BAD_PHASE', 'Şu an olmaz, biraz sonra dene.');
  if (g.catchVote) throw new IntentError('BUSY', 'Masa şu an başka birini yargılıyor.');
  const e = g.effects.find((x) => x.id === effectId && x.kind === 'mission');
  if (!e || e.targetId !== by) throw new IntentError('NO_EFFECT', 'Senin bir görevin yok.');
  const endsAt = ctx.now + DUR.catchVote + 4000;
  g.catchVote = { id: `cv-${s.seq++}`, mode: 'mission', accuser: by, accused: by, effectId, endsAt, votes: {} };
  s.timers.push({ id: g.catchVote.id, kind: 'catch', at: endsAt });
  fx.push({ kind: 'missionClaim', payload: { agent: by } });
  if (catchVoters(s).length === 0) resolveCatch(s, ctx, fx);
}

// Görev süresi doldu: ajan başaramadı
function failMission(s: GameState, ctx: Ctx, fx: Fx[], e: ActiveEffect) {
  const g = s.game!;
  const agent = e.targetId ? getPlayer(s, e.targetId) : undefined;
  const result = emptyResult();
  if (agent && !agent.left) {
    ensureStats(s, agent.id);
    applyPayment(s, ctx.rng, ctx.now, agent, e.penalty, result);
  }
  g.lastCatch = {
    id: `cv-${s.seq++}`, mode: 'missionFail', accuser: e.targetId ?? '', accused: e.targetId ?? '', effectId: e.id, endsAt: ctx.now, votes: {},
    missionText: e.secret, guilty: false, yes: 0, no: 0, payments: result.payments, mini: result.mini, waterBreak: result.waterBreak, at: ctx.now,
  };
  fx.push({ kind: 'missionResult', payload: { done: false, agent: e.targetId } });
}

// --- host: beklemeden ilerlet ---

const ADVANCE_PHASES: Phase[] = ['actIntro', 'choose', 'action', 'resolve', 'tableEvent', 'finale'];

// Adım anahtarı: aynı ekran için gelen ikinci "ilerlet" (çift dokunma, iki kişi aynı anda) bir adım daha atlatmasın
export function stepKey(s: GameState): string {
  const g = s.game;
  const t = g?.turn;
  return `${s.phase}:${g?.turnNo ?? -1}:${g?.act ?? 0}:${t?.stage ?? ''}:${t?.step ?? ''}:${t?.cardId ?? ''}`;
}

export function advance(s: GameState, ctx: Ctx, fx: Fx[], by: string, at?: string) {
  const g = s.game;
  if (at !== undefined && at !== stepKey(s)) throw new IntentError('STALE', '');
  if (!g || !ADVANCE_PHASES.includes(s.phase)) throw new IntentError('BAD_PHASE', 'Şu an ilerletilecek bir şey yok.');
  const host = s.hostId ? getPlayer(s, s.hostId) : undefined;
  const me = getPlayer(s, by);
  // Host yoksa ya da bağlı değilse masadaki herhangi bir insan ilerletebilir
  const allowed = s.hostId === by || (!!me && !me.isBot && !me.left && (!host || !host.connected || host.left));
  if (!allowed) throw new IntentError('NOT_HOST', 'İlerletmeyi masayı kuran yapar.');
  if (s.phase === 'action' && g.turn?.mg) throw new IntentError('BAD_PHASE', 'Mini oyun kendi süresiyle biter.');
  onPhaseTimeout(s, ctx, fx);
}

// --- güç kartları, Pas, Veto ---

function givePower(s: GameState, fx: Fx[], id: string, kind: PowerKind, force = false) {
  ensureStats(s, id);
  const st = s.stats[id]!;
  if (st.powers.length >= MAX_POCKET) {
    if (!force) return;
    st.powers.shift();
  }
  st.powers.push(kind);
  fx.push({ kind: 'powerEarned', payload: { power: kind }, to: [id] });
}

// Her 3 cesaret puanında bir güç kartı; cepte en fazla 2 tane durur
function grantPowers(s: GameState, ctx: Ctx, fx: Fx[], id: string) {
  const st = s.stats[id]!;
  while (st.powersEarned < Math.floor(st.courage / 3)) {
    st.powersEarned++;
    givePower(s, fx, id, ctx.rng.pick(POWERS));
  }
}

function takePower(s: GameState, by: string, kind: PowerKind) {
  const st = s.stats[by];
  const i = st ? st.powers.indexOf(kind) : -1;
  if (!st || i < 0) throw new IntentError('NO_POWER', `Cebinde ${POWER_NAMES[kind]} yok.`);
  st.powers.splice(i, 1);
}

export function usePower(s: GameState, ctx: Ctx, fx: Fx[], by: string, power: PowerKind, targetId?: string, cardId?: string) {
  const g = s.game;
  const t = g?.turn;
  if (!g || !t) throw new IntentError('BAD_PHASE', 'Şu an kullanılamaz.');
  switch (power) {
    case 'shield': {
      // Kalkan: bir bedeli iptal eder
      if (s.phase !== 'resolve' || !t.result) throw new IntentError('BAD_PHASE', 'Kalkan sonuç anında kullanılır.');
      const pay = t.result.payments.find((p) => p.id === by);
      if (!pay) throw new IntentError('NO_PAYMENT', 'İptal edecek cezan yok.');
      takePower(s, by, 'shield');
      revertPayment(s, pay);
      t.result.payments = t.result.payments.filter((p) => p !== pay);
      t.result.shielded = [...(t.result.shielded ?? []), by];
      fx.push({ kind: 'power', payload: { power, by } });
      break;
    }
    case 'mirror': {
      // Ayna: bedeli başkasına yansıtır; hedef kendi Kalkan'ıyla karşılık verebilir
      if (s.phase !== 'resolve' || !t.result) throw new IntentError('BAD_PHASE', 'Ayna sonuç anında kullanılır.');
      const pay = t.result.payments.find((p) => p.id === by);
      const target = targetId ? getPlayer(s, targetId) : undefined;
      if (!pay) throw new IntentError('NO_PAYMENT', 'Yansıtacak cezan yok.');
      if (!target || target.left || target.id === by) throw new IntentError('BAD_TARGET', 'Aynayı kime tutuyorsun?');
      takePower(s, by, 'mirror');
      revertPayment(s, pay);
      t.result.payments = t.result.payments.filter((p) => p !== pay);
      const existing = t.result.payments.find((p) => p.id === target.id);
      if (existing) {
        revertPayment(s, existing);
        t.result.payments = t.result.payments.filter((p) => p !== existing);
      }
      ensureStats(s, target.id);
      applyPayment(s, ctx.rng, ctx.now, target, pay.units + (existing?.units ?? 0), t.result);
      t.result.reflected = [...(t.result.reflected ?? []), { from: by, to: target.id }];
      // Hedefin Kalkan'la karşılık verebilmesi için süre uzar
      if (g.phaseEndsAt !== null && s.stats[target.id]!.powers.includes('shield')) {
        const at = Math.max(g.phaseEndsAt ?? ctx.now, ctx.now + 5000);
        s.timers = s.timers.filter((x) => x.kind !== 'phase');
        s.timers.push({ id: `ph-${s.seq++}`, kind: 'phase', at });
        g.phaseEndsAt = at;
      }
      fx.push({ kind: 'power', payload: { power, by, to: target.id } });
      break;
    }
    case 'swap': {
      // Takas: okuyucuyken eli yeniden çeker
      if (s.phase !== 'choose' || t.step !== 'choose' || t.readerId !== by || t.cardId) throw new IntentError('BAD_PHASE', 'Takas yalnızca kart seçerken kullanılır.');
      if (t.swapped) throw new IntentError('ALREADY', 'Bu el zaten takaslandı.');
      takePower(s, by, 'swap');
      const old = new Set(t.hand);
      const saved = g.used;
      g.used = [...g.used, ...old]; // eski kartlar bu çekilişte gelmesin
      t.hand = dealHand(s, ctx.catalog, ctx.rng, by, null);
      g.used = saved;
      t.inherited = null;
      t.swapped = true;
      setPhase(s, ctx, 'choose', pdur(s, DUR.deal + DUR.choose));
      fx.push({ kind: 'deal', payload: { readerId: by, swap: true } });
      break;
    }
    case 'sabotage': {
      // Sabotaj: sonraki okuyucunun miras kartını sen seçersin
      if (!['reveal', 'action', 'resolve'].includes(s.phase) || t.system) throw new IntentError('BAD_PHASE', 'Sabotaj kart oynandıktan sonra kullanılır.');
      if (t.sabotagedBy) throw new IntentError('ALREADY', 'Bu miras zaten sabote edildi.');
      if (!cardId || !t.rest.includes(cardId)) throw new IntentError('BAD_CARD', 'Seçilmeyen kartlardan birini seç.');
      if (nextReaderId(s) === by) throw new IntentError('BAD_TARGET', 'Kendi mirasını sabote edemezsin.');
      takePower(s, by, 'sabotage');
      g.nextInherit = cardId;
      t.sabotagedBy = by;
      fx.push({ kind: 'power', payload: { power } });
      break;
    }
  }
}

export function nextReaderId(s: GameState): string | undefined {
  const g = s.game;
  if (!g || !s.order.length) return undefined;
  const n = s.order.length;
  for (let k = 1; k <= n; k++) {
    const id = s.order[(((g.readerIdx + g.direction * k) % n) + n) % n];
    const p = id ? getPlayer(s, id) : undefined;
    if (p && !p.left) return id;
  }
  return undefined;
}

// Pas: perde başına 1; kendine gelen kartı bedelsiz geçer
export function usePass(s: GameState, ctx: Ctx, fx: Fx[], by: string) {
  const t = s.game?.turn;
  if (!t || t.system || (s.phase !== 'action' && s.phase !== 'reveal')) throw new IntentError('BAD_PHASE', 'Pas yalnızca kart açıkken kullanılır.');
  if (!t.targets.includes(by)) throw new IntentError('NOT_YOURS', 'Bu kart sana gelmedi.');
  if (t.passed.includes(by)) throw new IntentError('ALREADY', 'Zaten pas geçtin.');
  const c = card(ctx, t.cardId!);
  if (c.type === 'rule' || c.type === 'curse' || c.type === 'golden' || c.type === 'mission') throw new IntentError('BAD_CARD', 'Bu karta pas geçilmez.');
  ensureStats(s, by);
  const st = s.stats[by]!;
  if (st.passAct === s.game!.act) throw new IntentError('USED', 'Bu perdede pas hakkını kullandın.');
  st.passAct = s.game!.act;
  t.passed.push(by);
  delete t.inputs[by];
  fx.push({ kind: 'pass', payload: { playerId: by } });
  if (s.phase === 'action') maybeComplete(s, ctx, fx);
}

// Veto: oyun boyunca 1 anonim hak; kart herkes için iptal olur, kimin kullandığı gösterilmez
export function useVeto(s: GameState, ctx: Ctx, fx: Fx[], by: string) {
  const t = s.game?.turn;
  if (!t || t.system || (s.phase !== 'action' && s.phase !== 'reveal')) throw new IntentError('BAD_PHASE', 'Veto yalnızca kart açıkken kullanılır.');
  const p = getPlayer(s, by);
  if (!p || p.left) throw new IntentError('NO_SEAT', 'Masada değilsin.');
  ensureStats(s, by);
  if (s.stats[by]!.vetoUsed) throw new IntentError('USED', 'Veto hakkını kullandın.');
  s.stats[by]!.vetoUsed = true;
  t.vetoed = true;
  t.inputs = {};
  t.texts = {};
  t.result = { ...emptyResult(), vetoed: true };
  finishTurn(s, ctx, fx, card(ctx, t.cardId!), []);
  fx.push({ kind: 'veto' });
}

// --- masa olayları, Su Molası, final ---

function startSystemEvent(s: GameState, ctx: Ctx, fx: Fx[], kind: 'water' | 'table'): boolean {
  const g = s.game!;
  let c: Card | undefined;
  if (kind === 'water') c = getCard(ctx.catalog, 'sys-water');
  else {
    const used = new Set(g.used);
    const pool = modePool(s, ctx.catalog).filter((x) => x.type === 'tableEvent' && x.intensity <= g.act);
    const fresh = pool.filter((x) => !used.has(x.id));
    const cands = fresh.length ? fresh : pool;
    c = ctx.rng.weighted(cands, (x) => (x.rarity === 'rare' ? 0.4 : 1));
  }
  if (!c) return false;
  const t = newTurn('', { system: true, cardId: c.id, targets: activePlayers(s).map((p) => p.id) });
  g.turn = t;
  const result = emptyResult();
  const tags = c.tags ?? [];
  if (c.input === 'catch') addEffect(s, ctx, c, t, result, fx);
  if (tags.includes(TAG.reverse)) {
    g.direction = g.direction === 1 ? -1 : 1;
    result.note = 'Sıra artık öbür yönden dönüyor.';
  }
  if (tags.includes(TAG.ghost)) g.blindTurns = 2;
  if (tags.includes(TAG.eclipse)) {
    const top = activePlayers(s).sort((a, b) => (s.stats[b.id]?.paidUnits ?? 0) - (s.stats[a.id]?.paidUnits ?? 0))[0];
    if (top) {
      givePower(s, fx, top.id, 'mirror', true);
      result.note = `${top.name} cebine bir Ayna aldı.`;
    }
  }
  if (c.input === 'none' && c.penalty > 0) {
    for (const p of activePlayers(s)) {
      ensureStats(s, p.id);
      applyPayment(s, ctx.rng, ctx.now, p, c.penalty, result);
    }
  }
  t.result = result;
  if (ctx.catalog.has(c.id)) {
    g.used = g.used.filter((id) => id !== c.id);
    g.used.push(c.id);
  }
  setPhase(s, ctx, 'tableEvent', pdur(s, DUR.tableEvent));
  fx.push({ kind: 'tableEvent', payload: { cardId: c.id } });
  return true;
}

function beginFinale(s: GameState, ctx: Ctx, fx: Fx[]) {
  const g = s.game!;
  endActEffects(s, fx);
  g.effects = [];
  const bravest = activePlayers(s).sort((a, b) => (s.stats[b.id]?.courage ?? 0) - (s.stats[a.id]?.courage ?? 0))[0];
  const id = s.settings.drinking ? 'sys-final-drink' : 'sys-final-tea';
  g.turn = newTurn(bravest?.id ?? '', { system: true, cardId: id, targets: activePlayers(s).map((p) => p.id), tokens: { okuyucu: bravest?.id } });
  g.turn.result = emptyResult();
  setPhase(s, ctx, 'finale', pdur(s, DUR.finale));
  fx.push({ kind: 'finale' });
}

function nextTurn(s: GameState, ctx: Ctx, fx: Fx[]) {
  const g = s.game!;
  const wasSystem = g.turn?.system;
  if (!wasSystem) {
    g.actTurn++;
    g.turnNo++;
    // Kural ve lanet sayaçları düşer
    for (const e of g.effects) if (typeof e.turnsLeft === 'number') e.turnsLeft--;
    // Oylamadaki görev oylamayla biter, süreyle değil
    const ended = g.effects.filter((e) => typeof e.turnsLeft === 'number' && e.turnsLeft <= 0 && !(e.kind === 'mission' && g.catchVote?.effectId === e.id));
    g.effects = g.effects.filter((e) => !ended.includes(e));
    // Ajan "yaptım" diyemeden süre dolduysa görev başarısız
    for (const e of ended) if (e.kind === 'mission') failMission(s, ctx, fx, e);
    if (ended.length) fx.push({ kind: 'effectsEnded', payload: { ids: ended.map((e) => e.id) } });
    stepReader(s);
    if (g.actTurn >= g.actTurns) {
      if (g.act < 3) beginAct(s, ctx, fx, (g.act + 1) as 2 | 3);
      else beginFinale(s, ctx, fx);
      return;
    }
    // Her 8 turda Su Molası; perde 2'den itibaren her 4 turda bir masa olayı
    if (g.turnNo % 8 === 0 && startSystemEvent(s, ctx, fx, 'water')) return;
    if (g.act >= 2 && g.turnNo % 4 === 0 && startSystemEvent(s, ctx, fx, 'table')) return;
  }
  startTurn(s, ctx, fx);
}

function endGame(s: GameState, ctx: Ctx, fx: Fx[]) {
  const g = s.game!;
  g.turn = null;
  g.catchVote = null;
  g.endedAt = ctx.now;
  s.timers = s.timers.filter((t) => t.kind !== 'catch');
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
        const cards = t.hand.map((id) => card(ctx, id));
        const minI = Math.min(...cards.map((c) => c.intensity));
        playCard(s, ctx, fx, t.readerId, cards.find((c) => c.intensity === minI)!.id);
        if (s.phase === 'choose' && (t.step as Turn['step']) === 'target') finalizeTargets(s, ctx, fx, card(ctx, t.cardId!), null);
      } else {
        finalizeTargets(s, ctx, fx, card(ctx, t.cardId!), null);
      }
      break;
    }
    case 'reveal':
      beginAction(s, ctx, fx);
      break;
    case 'action': {
      const t = g.turn!;
      if (t.gal) {
        if (t.gal.stage === 'draw') toGalleryVote(s, ctx, fx);
        else resolveTurn(s, ctx, fx);
      } else if (t.sk) resolveTurn(s, ctx, fx);
      else if (t.mg) {
        const next = tickMinigame(s, ctx, fx);
        if (next === null) resolveTurn(s, ctx, fx);
        else setPhase(s, ctx, 'action', Math.max(0, next - ctx.now));
      } else if (t.stage === 'write') toGuessStage(s, ctx, fx);
      else resolveTurn(s, ctx, fx);
      break;
    }
    case 'resolve':
    case 'tableEvent':
      nextTurn(s, ctx, fx);
      break;
    case 'finale':
      endGame(s, ctx, fx);
      break;
  }
}

function requireTurn(s: GameState, phase: Phase): Turn {
  if (s.phase !== phase || !s.game?.turn) throw new IntentError('BAD_PHASE', 'Şu an bunu yapamazsın.');
  return s.game.turn;
}

// Şu an eylem bekleyen oyuncular (botlar için)
export function pendingActors(s: GameState, ctx: Pick<Ctx, 'catalog'>): string[] {
  const g = s.game;
  const t = g?.turn;
  const out = new Set<string>();
  if (g?.catchVote) for (const id of catchVoters(s)) if (g.catchVote.votes[id] === undefined) out.add(id);
  if (!t) return [...out];
  if (s.phase === 'choose' && !t.system) out.add(t.readerId);
  // Sonuçta cebinde Kalkan/Ayna olan ceza alanlar ve Sabotaj sahipleri karar verir (botlar için)
  if (s.phase === 'resolve' && t.result && !t.system) {
    const next = nextReaderId(s);
    for (const p of activePlayers(s)) {
      const pw = s.stats[p.id]?.powers ?? [];
      const paying = t.result.payments.some((x) => x.id === p.id);
      if (paying && (pw.includes('shield') || pw.includes('mirror'))) out.add(p.id);
      else if (pw.includes('sabotage') && !t.sabotagedBy && t.rest.length && next !== p.id) out.add(p.id);
    }
  }
  if (s.phase === 'action' && t.mg) {
    for (const id of mgActors(s, t.mg)) out.add(id);
  } else if (s.phase === 'action' && t.gal) {
    // Bot sanatçılar birkaç çizgi çizip teslim eder, galeride oy verir
    for (const id of expectedInputs(s, ctx)) out.add(id);
  } else if (s.phase === 'action' && t.sk) {
    // Bot ressam birkaç çizgi çizer; tahminciler bilene kadar dener
    if (t.sk.strokes.length < 5) out.add(t.sk.drawer);
    for (const id of expectedInputs(s, ctx)) out.add(id);
  } else if (s.phase === 'action') {
    for (const id of expectedInputs(s, ctx)) {
      const done = t.stage === 'write' ? t.texts[id] !== undefined : !!t.inputs[id];
      if (!done) out.add(id);
    }
  }
  return [...out];
}

// Mini oyunda şu an hamle yapabilecek oyuncular (botlar için)
export function mgActors(s: GameState, mg: MinigameState): string[] {
  if (mg.stage !== 'live') return [];
  const t = s.game!.turn!;
  const active = activePlayers(s).map((p) => p.id).filter((id) => !t.passed.includes(id));
  if (mg.kind === 'bomb') return mg.bombs.map((b, i) => (b.exploded ? null : currentHolder(mg, i))).filter((x): x is string => !!x && active.includes(x));
  if (mg.kind === 'reflex' && !mg.signaled) return [];
  return active.filter((id) => mg.taps[id] === undefined);
}

export function playMinigame(s: GameState, ctx: Ctx, fx: Fx[], by: string, action: 'tap' | 'throw', bomb?: number, at?: number, lat?: number) {
  const allIn = minigameInput(s, ctx, fx, by, action, bomb, at, lat);
  if (allIn) {
    s.game!.turn!.mg!.stage = 'done';
    resolveTurn(s, ctx, fx);
  }
}

// --- Karakalem ---

function requireSketch(s: GameState, ctx: Ctx): { t: Turn; c: Card } {
  const t = requireTurn(s, 'action');
  const c = card(ctx, t.cardId!);
  if (c.type !== 'sketch' || !t.sk || !t.secret) throw new IntentError('BAD_INPUT', 'Şu an çizim yok.');
  return { t, c };
}

export function sketchDraw(s: GameState, ctx: Ctx, fx: Fx[], by: string, nums: number[], fresh: boolean) {
  const gt = s.phase === 'action' ? s.game?.turn : null;
  if (gt?.gal) {
    if (gt.passed.includes(by)) throw new IntentError('PASSED', 'Pas geçtin.');
    return galleryDraw(gt.gal, ctx.now, by, nums, fresh); // Sergi: kimseye canlı gitmez
  }
  const { t, c } = requireSketch(s, ctx);
  fx.push(drawSegment(t.sk!, ctx.now, by, nums, fresh, (c.tags ?? []).includes('tekcizgi')));
}

export function sketchUndo(s: GameState, ctx: Ctx, fx: Fx[], by: string, clear: boolean) {
  const gt = s.phase === 'action' ? s.game?.turn : null;
  if (gt?.gal) return galleryUndo(gt.gal, by, clear);
  const { t, c } = requireSketch(s, ctx);
  const single = (c.tags ?? []).includes('tekcizgi');
  if (clear) clearSketch(t.sk!, by, single);
  else undoStroke(t.sk!, by, single);
  fx.push({ kind: 'drawReset' });
}

export function sketchGuess(s: GameState, ctx: Ctx, fx: Fx[], by: string, raw: string) {
  const { t } = requireSketch(s, ctx);
  const p = getPlayer(s, by);
  if (!p || p.left) throw new IntentError('NO_SEAT', 'Masada değilsin.');
  guessWord(t.sk!, t.secret!, ctx.now, by, raw, cleanText, fx);
  // Herkes bildiyse beklemeye gerek yok
  if (expectedInputs(s, ctx).length === 0) resolveTurn(s, ctx, fx);
}

// --- Sergi ---

function requireGallery(s: GameState): Turn {
  const t = requireTurn(s, 'action');
  if (!t.gal) throw new IntentError('BAD_INPUT', 'Şu an sergi yok.');
  return t;
}

// Çizim bitti: isimsiz galeri açılır. Oylama rahat tempoda süresizdir.
function toGalleryVote(s: GameState, ctx: Ctx, fx: Fx[]) {
  const t = s.game!.turn!;
  const artists = activePlayers(s).map((p) => p.id).filter((id) => !t.passed.includes(id));
  toVote(t.gal!, artists, ctx.rng);
  if (artists.length < 2) return resolveTurn(s, ctx, fx);
  setPhase(s, ctx, 'action', pdur(s, DUR.vote));
  fx.push({ kind: 'galleryOpen' });
}

export function galleryFinish(s: GameState, ctx: Ctx, fx: Fx[], by: string) {
  const t = requireGallery(s);
  galleryDone(t.gal!, by);
  if (t.gal!.stage === 'draw' && expectedInputs(s, ctx).length === 0) toGalleryVote(s, ctx, fx);
}

export function galleryCast(s: GameState, ctx: Ctx, fx: Fx[], by: string, index: number) {
  const t = requireGallery(s);
  galleryVote(t.gal!, by, index);
  fx.push({ kind: 'inputIn', payload: { playerId: by } });
  if (expectedInputs(s, ctx).length === 0) resolveTurn(s, ctx, fx);
}

// Merhamet: masanın ortalamasının çok üstünde içen (en az 6 birim ve diğerlerinin ortalamasının 1,6 katı)
// perde başına bir kez cebine Kalkan alır. Şanssız kişi gecenin kurbanına dönüşmesin.
function grantMercy(s: GameState, ctx: Ctx, fx: Fx[], payers: string[], result: TurnResult) {
  const g = s.game!;
  const act = activePlayers(s);
  if (act.length < 3) return;
  for (const id of payers) {
    const st = s.stats[id];
    if (!st || st.mercyAct === g.act || st.powers.includes('shield')) continue;
    const others = act.filter((p) => p.id !== id).map((p) => s.stats[p.id]?.paidUnits ?? 0);
    const avg = others.reduce((a, b) => a + b, 0) / Math.max(1, others.length);
    if (st.paidUnits >= 6 && st.paidUnits >= avg * 1.6) {
      st.mercyAct = g.act;
      givePower(s, fx, id, 'shield', true);
      result.mercy = [...(result.mercy ?? []), id];
    }
  }
  void ctx;
}
