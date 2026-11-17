// Oyuncuya özel görünüm. Gizli bilgiler (secret, başkalarının katılım tercihleri) asla gitmez.
import type { Card } from './cards';
import { actionKind, expectedInputs, type ActionKind } from './game';
import { isSober } from './penalties';
import { catchVoters, nextReaderId, stepKey } from './game';
import { currentHolder } from './minigames';
import { getCard } from './systemCards';
import type { CatchResult, Catalog, GameState, InputValue, Phase, PowerKind, Settings, TokenKey, TurnLog, TurnResult } from './types';

export interface PublicPlayer {
  id: string;
  name: string;
  avatar: number;
  isBot: boolean;
  connected: boolean;
  isHost: boolean;
  joinSeq: number;
  left: boolean;
}

export interface YouView {
  id: string;
  isHost: boolean;
  consent: { ageOk: boolean; spicy: boolean; contact: boolean };
  quitDrinking: boolean;
  sober: boolean; // bedellerin ceza olarak mı gösterileceği
  autoSober: boolean; // içki sınırı aşıldı
  powers: PowerKind[]; // cep (yalnızca kendine)
  canPass: boolean;
  canVeto: boolean;
  decree: boolean;
}

export interface PublicStats {
  courage: number;
  paidUnits: number;
  done: number;
  failed: number;
  readerTurns: number;
  targeted: number;
}

export interface EffectView {
  id: string;
  kind: 'rule' | 'curse' | 'event' | 'decree' | 'mission';
  text: string;
  targetId?: string; // görevde yalnızca ajanın kendisine gider
  turnsLeft: number | 'act';
  penalty: number;
  secret?: string; // gizli görev metni (yalnızca ajana)
  mine?: boolean; // bu görev benim
}

export interface CatchVoteView {
  mode: 'rule' | 'mission';
  missionText?: string; // ajan "yaptım" deyince görev herkese açılır
  accuser: string;
  accused: string;
  effectId: string;
  endsAt: number;
  voters: string[];
  votedCount: number;
  myVote: boolean | null;
}

export interface MinigameView {
  kind: 'bomb' | 'reflex' | 'countdown';
  stage: 'wait' | 'live' | 'done';
  startAt: number;
  holders: { holder: string; exploded: boolean }[]; // bomba
  filled: boolean; // refleks: bardak doldu mu
  tapped: string[];
  myTapped: boolean;
}

export interface GameView {
  act: 1 | 2 | 3;
  actTurn: number;
  actTurns: number;
  turnNo: number;
  readerId: string | null;
  system: boolean; // okuyucusuz sistem kartı (masa olayı, Su Molası, final)
  phaseEndsAt: number | null; // sunucu saati (ms)
  hand: (Card | { id: string; hidden: true })[] | null; // yalnızca okuyucuya, seçim sırasında
  blind: boolean;
  handCount: number;
  inherited: string | null; // eldeki miras kartın id'si (yalnızca okuyucu)
  hasInheritForNext: boolean;
  step: 'choose' | 'target' | null;
  needTargets: number;
  targetChoices: string[]; // okuyucunun seçebileceği oyuncular (yalnızca okuyucu)
  card: Card | null; // oynanan kart (açılıştan sonra herkese)
  targets: string[];
  tokens: Partial<Record<TokenKey, string>>;
  input: ActionKind | null;
  stage: 'main' | 'write' | 'guess';
  options: string[];
  optionPlayers: boolean;
  secret: string | null; // gizli kelime/görev: yalnızca hedefe
  waitingOn: string[]; // girdisi beklenenler (isimleri göstermek için)
  answers: string[]; // itiraf: karışık cevaplar (yazarsız)
  spotlight: number | null; // itiraf: spot ışığındaki cevabın sırası
  amAuthor: boolean; // itiraf: spot ışığındaki cevap benim mi
  myText: string | null;
  expected: string[]; // girdi vermesi beklenenler
  submitted: string[]; // girdi verenler (değerler gizli)
  myInput: InputValue | null;
  passed: string[];
  result: TurnResult | null;
  effects: EffectView[];
  catchVote: CatchVoteView | null;
  lastCatch: (Omit<CatchResult, 'votes'>) | null;
  mg: MinigameView | null;
  stepKey: string; // "ilerlet" isteğinin hangi adım için olduğunu sunucuya bildirmek için
  restCards: Card[]; // Sabotaj: seçilmeyen kartlar (yalnızca cebinde Sabotaj olana)
  log: TurnLog[]; // yalnızca özet ekranında dolu
}

export interface View {
  code: string;
  rev: number;
  phase: Phase;
  hostId: string | null;
  players: PublicPlayer[];
  order: string[];
  settings: Settings;
  you: YouView | null; // null = izleyici (henüz katılmamış ya da TV)
  startedAt: number | null;
  game: GameView | null;
  stats: Record<string, PublicStats>;
}

export function viewFor(s: GameState, playerId: string | null, catalog?: Catalog): View {
  const me = playerId ? s.players.find((p) => p.id === playerId && !p.left) : undefined;
  return {
    code: s.code,
    rev: s.rev,
    phase: s.phase,
    hostId: s.hostId,
    players: s.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isBot: p.isBot,
      connected: p.connected,
      isHost: p.id === s.hostId,
      joinSeq: p.joinSeq,
      left: p.left,
    })),
    order: s.order,
    settings: s.settings,
    you: me
      ? {
          id: me.id, isHost: me.id === s.hostId, consent: { ...me.consent }, quitDrinking: me.quitDrinking,
          sober: isSober(s, me), autoSober: !!s.stats[me.id]?.autoSober,
          powers: [...(s.stats[me.id]?.powers ?? [])],
          canPass: !!s.game && (s.stats[me.id]?.passAct ?? 0) !== s.game.act,
          canVeto: !!s.game && !s.stats[me.id]?.vetoUsed,
          decree: !!s.stats[me.id]?.decree,
        }
      : null,
    startedAt: s.startedAt,
    game: catalog ? gameView(s, me?.id ?? null, catalog) : null,
    stats: Object.fromEntries(
      Object.entries(s.stats).map(([id, st]) => [
        id,
        { courage: st.courage, paidUnits: st.paidUnits, done: st.done, failed: st.failed, readerTurns: st.readerTurns, targeted: st.targeted },
      ]),
    ),
  };
}

function gameView(s: GameState, me: string | null, catalog: Catalog): GameView | null {
  const g = s.game;
  if (!g) return null;
  const t = g.turn;
  const isReader = !!t && !t.system && t.readerId === me;
  const rawCard = t?.cardId ? getCard(catalog, t.cardId) ?? null : null;
  const card = rawCard ? stripSecret(rawCard) : null;
  const mission = card?.type === 'mission';
  // Kart açılış anına kadar yalnızca okuyucuya görünür
  const cardVisible = !!card && (s.phase !== 'choose' || isReader);
  const inChoose = s.phase === 'choose' && t?.step === 'choose';
  const action = s.phase === 'action' || s.phase === 'resolve';
  const expected = t && card && s.phase === 'action' ? expectedInputs(s, { catalog }) : [];
  const needTargets = card ? (card.target === 'picked' ? 1 : card.target === 'twoPicked' ? 2 : 0) : 0;
  const guess = t?.stage === 'guess' && (s.phase === 'action' || s.phase === 'resolve');
  const cv = g.catchVote;
  const myPowers = me ? s.stats[me]?.powers ?? [] : [];
  const canSabotage =
    !!t && !t.system && !t.sabotagedBy && myPowers.includes('sabotage') && ['reveal', 'action', 'resolve'].includes(s.phase) && nextReaderId(s) !== me;
  const lc = g.lastCatch;
  let hand: GameView['hand'] = null;
  if (isReader && inChoose && t) {
    // Hayalet Saati: kartlar kapalı, yalnızca sıra numarası gider
    hand = t.blind ? t.hand.map((_, i) => ({ id: `blind-${i}`, hidden: true as const })) : t.hand.map((id) => getCard(catalog, id)!).filter(Boolean).map(stripSecret);
  }
  return {
    act: g.act,
    actTurn: g.actTurn,
    actTurns: g.actTurns,
    turnNo: g.turnNo,
    readerId: t && !t.system ? t.readerId : null,
    system: !!t?.system,
    // Mini oyunda zamanlayıcı gizli anı (patlama/dolma) ele verir: gönderilmez
    phaseEndsAt: t?.mg && t.mg.stage === 'live' && (t.mg.kind === 'bomb' || !t.mg.signaled) ? null : g.phaseEndsAt,
    hand,
    blind: !!t?.blind && isReader,
    handCount: t?.hand.length ?? 0,
    inherited: isReader && !t?.blind ? t?.inherited ?? null : null,
    hasInheritForNext: !!g.nextInherit && s.phase !== 'choose',
    step: s.phase === 'choose' && t ? t.step : null,
    needTargets: isReader ? needTargets : 0,
    targetChoices:
      isReader && t?.step === 'target' && card
        ? s.players.filter((p) => !p.left && p.id !== t.readerId && consentsFor(s, p.id, card) && !cursedFor(s, p.id, card)).map((p) => p.id)
        : [],
    card: cardVisible ? card : null,
    // Gizli görevin ajanı kimseye gitmez (kendisine de: görevi effects üzerinden görür)
    targets: cardVisible && !mission ? t?.targets ?? [] : [],
    tokens: cardVisible ? t?.tokens ?? {} : {},
    input: card && action && !t?.system ? actionKind(card) : null,
    stage: t?.stage ?? 'main',
    options: cardVisible ? t?.options ?? [] : [],
    optionPlayers: !!t?.optionPlayers,
    secret: t?.secret && me && !mission && t.targets.includes(me) && s.phase !== 'choose' ? t.secret : null,
    waitingOn: expected.filter((id) => (t?.stage === 'write' ? t.texts[id] === undefined : !t?.inputs[id])),
    // İtiraf: cevaplar yazarsız ve karışık; yazar yalnızca sonuçta açılır
    answers: guess && t ? t.shuffled.map((id) => t.texts[id] ?? '').filter((x) => x) : [],
    spotlight: guess && t?.spotlightAuthor ? t.shuffled.indexOf(t.spotlightAuthor) : null,
    amAuthor: guess && !!me && t?.spotlightAuthor === me,
    myText: me && t ? t.texts[me] ?? null : null,
    expected,
    submitted: t ? (t.stage === 'write' ? Object.keys(t.texts) : Object.keys(t.inputs)) : [],
    myInput: me && t ? t.inputs[me] ?? null : null,
    passed: t?.passed ?? [],
    // Oylar ve cevaplar yalnızca sonuçta açılır
    result: s.phase === 'resolve' || s.phase === 'tableEvent' || s.phase === 'finale' ? t?.result ?? null : null,
    effects: g.effects.map((e) => {
      const mine = e.kind === 'mission' && e.targetId === me;
      return {
        id: e.id, kind: e.kind, text: e.text, turnsLeft: e.turnsLeft, penalty: e.penalty,
        targetId: e.kind === 'mission' ? (mine ? e.targetId : undefined) : e.targetId,
        ...(mine ? { secret: e.secret, mine: true } : {}),
      };
    }),
    catchVote: cv
      ? {
          mode: cv.mode,
          missionText: cv.mode === 'mission' ? g.effects.find((e) => e.id === cv.effectId)?.secret : undefined,
          accuser: cv.accuser,
          accused: cv.accused,
          effectId: cv.effectId,
          endsAt: cv.endsAt,
          voters: catchVoters(s),
          votedCount: Object.keys(cv.votes).length,
          myVote: me && cv.votes[me] !== undefined ? cv.votes[me]! : null,
        }
      : null,
    lastCatch: lc ? (({ votes: _v, ...rest }) => rest)(lc) : null,
    mg: t?.mg
      ? {
          kind: t.mg.kind,
          stage: t.mg.stage,
          startAt: t.mg.startAt,
          // Patlama ve dolma anları gizli; yalnızca kimin elinde olduğu gider
          holders: t.mg.bombs.map((b, i) => ({ holder: currentHolder(t.mg!, i), exploded: b.exploded })),
          filled: t.mg.signaled,
          tapped: Object.keys(t.mg.taps),
          myTapped: !!me && t.mg.taps[me] !== undefined,
        }
      : null,
    stepKey: stepKey(s),
    restCards: canSabotage && t ? t.rest.map((id) => getCard(catalog, id)!).filter(Boolean) : [],
    log: s.phase === 'summary' ? g.log : [],
  };
}

// Kartın gizli metni (kelime/görev listesi) hiçbir istemciye gitmez; seçilen tek metin turda tutulur
function stripSecret(c: Card): Card {
  if (!c.secret) return c;
  const { secret: _s, ...rest } = c;
  return rest;
}

function cursedFor(s: GameState, id: string, card: Card): boolean {
  return card.type === 'curse' && !!s.game?.effects.some((e) => e.kind === 'curse' && e.targetId === id);
}

// Hedef seçiminde katılım bilgisinin kendisi gönderilmez; yalnızca uygun aday listesi
function consentsFor(s: GameState, id: string, card: Card): boolean {
  const p = s.players.find((x) => x.id === id);
  if (!p) return false;
  const tags = card.tags ?? [];
  const spicy = tags.includes('flort') || card.deck === 'spicy';
  if (spicy && !(p.consent.ageOk && p.consent.spicy)) return false;
  if (tags.includes('temas') && !(p.consent.ageOk && p.consent.contact)) return false;
  return true;
}
