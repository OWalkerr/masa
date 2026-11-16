// Oyuncuya özel görünüm. Gizli bilgiler (secret, başkalarının katılım tercihleri) asla gitmez.
import type { Card } from './cards';
import { actionKind, expectedInputs, type ActionKind } from './game';
import { isSober } from './penalties';
import type { Catalog, GameState, InputValue, Phase, Settings, TokenKey, TurnLog, TurnResult } from './types';

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
}

export interface PublicStats {
  courage: number;
  paidUnits: number;
  done: number;
  failed: number;
  readerTurns: number;
  targeted: number;
}

export interface GameView {
  act: 1 | 2 | 3;
  actTurn: number;
  actTurns: number;
  turnNo: number;
  readerId: string | null;
  phaseEndsAt: number | null; // sunucu saati (ms)
  hand: Card[] | null; // yalnızca okuyucuya, seçim sırasında
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
  expected: string[]; // girdi vermesi beklenenler
  submitted: string[]; // girdi verenler (değerler gizli)
  myInput: InputValue | null;
  result: TurnResult | null;
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
  const isReader = !!t && t.readerId === me;
  const card = t?.cardId ? catalog.get(t.cardId) ?? null : null;
  // Kart açılış anına kadar yalnızca okuyucuya görünür
  const cardVisible = !!card && (s.phase !== 'choose' || isReader);
  const inChoose = s.phase === 'choose' && t?.step === 'choose';
  const action = s.phase === 'action' || s.phase === 'resolve';
  const expected = t && card && action ? expectedInputs(s, { catalog }) : [];
  const needTargets = card ? (card.target === 'picked' ? 1 : card.target === 'twoPicked' ? 2 : 0) : 0;
  return {
    act: g.act,
    actTurn: g.actTurn,
    actTurns: g.actTurns,
    turnNo: g.turnNo,
    readerId: t?.readerId ?? null,
    phaseEndsAt: g.phaseEndsAt,
    hand: isReader && inChoose && t ? t.hand.map((id) => catalog.get(id)!).filter(Boolean) : null,
    handCount: t?.hand.length ?? 0,
    inherited: isReader ? t?.inherited ?? null : null,
    hasInheritForNext: !!g.nextInherit && s.phase !== 'choose',
    step: s.phase === 'choose' && t ? t.step : null,
    needTargets: isReader ? needTargets : 0,
    targetChoices:
      isReader && t?.step === 'target' && card
        ? s.players.filter((p) => !p.left && p.id !== t.readerId && consentsFor(s, p.id, card)).map((p) => p.id)
        : [],
    card: cardVisible ? card : null,
    targets: cardVisible ? t?.targets ?? [] : [],
    tokens: cardVisible ? t?.tokens ?? {} : {},
    input: card && action ? actionKind(card) : null,
    expected,
    submitted: t ? Object.keys(t.inputs) : [],
    myInput: me && t ? t.inputs[me] ?? null : null,
    // Oylar ve cevaplar yalnızca sonuçta açılır
    result: s.phase === 'resolve' ? t?.result ?? null : null,
    log: s.phase === 'summary' ? g.log : [],
  };
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
