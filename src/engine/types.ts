// Oyun durumu ve niyet tipleri. Motor saf TS'tir; sunucu ve istemci paylaşır.
import type { Card, CardType, DeckId } from './cards';

export type Phase =
  | 'lobby' | 'actIntro' | 'draw' | 'choose' | 'reveal' | 'action'
  | 'resolve' | 'tableEvent' | 'finale' | 'summary';

export type GameLength = 'short' | 'normal' | 'long';
export type SipSize = 'small' | 'sip' | 'shot';

export interface Settings {
  deck: DeckId;
  drinking: boolean; // alkollü mü
  length: GameLength; // Kısa 6 / Normal 10 / Uzun 14 tur/perde
  sip: SipSize; // varsayılan 'sip'; shot kapalı gelir, host açabilir
  adult: boolean; // 18+ kilidi açık mı
}

export const DEFAULT_SETTINGS: Settings = {
  deck: 'classic',
  drinking: true,
  length: 'normal',
  sip: 'sip',
  adult: false,
};

export const ROUNDS_PER_ACT: Record<GameLength, number> = { short: 6, normal: 10, long: 14 };

export interface Consent {
  ageOk: boolean; // 18 yaş onayı
  spicy: boolean; // ateşli/flört kartlarına katılım (gizli)
  contact: boolean; // temas etiketine katılım (gizli)
}

export interface Player {
  id: string;
  secret: string; // yeniden bağlanma anahtarı; viewFor asla göndermez
  name: string;
  avatar: number; // 0..11
  isBot: boolean;
  connected: boolean;
  joinedAt: number;
  joinSeq: number; // katılım sırası (host devri için "en eski")
  left: boolean;
  consent: Consent;
  quitDrinking: boolean; // "Ben bıraktım"
  lastSeen: number;
}

export type TimerKind = 'hostGrace' | 'expire' | 'bot' | 'phase';

export interface Timer {
  id: string;
  kind: TimerKind;
  at: number;
  playerId?: string;
  payload?: unknown;
}

export interface GameState {
  v: 1;
  code: string;
  rev: number;
  phase: Phase;
  createdAt: number;
  lastActivity: number;
  hostId: string | null;
  players: Player[];
  order: string[]; // oturma/sıra düzeni (oyuncu id'leri)
  settings: Settings;
  timers: Timer[];
  botsPending: number; // ilk insan katılınca eklenecek bot sayısı
  rngState: number;
  seq: number; // id üretimi için sayaç
  startedAt: number | null;
  game: GameRun | null;
  stats: Record<string, PlayerStats>;
}

// --- Oyun içi durum ---

export type TokenKey = 'okuyucu' | 'secilen' | 'ikinci' | 'sag' | 'sol' | 'rastgele';

export type InputValue =
  | { k: 'vote'; playerId: string }
  | { k: 'yesNo'; yes: boolean };

export interface Payment {
  id: string;
  units: number; // ham birim
  sober: boolean; // alkolsüz bedel mi (ceza)
  label: string; // "2 yudum", "1 shot", "2 ceza"
}

export interface TurnResult {
  payments: Payment[];
  courage: { id: string; pts: number; why: string }[];
  tally?: Record<string, number>; // oy sayımı (açılışta)
  yesIds?: string[];
  done?: boolean; // judge: yaptı mı
  mini: { id: string; text: string }[]; // alkolsüzde her 3 cezada mini ceza
  waterBreak: string[]; // içki sınırını aşanlar
}

export interface Turn {
  readerId: string;
  hand: string[]; // kart id'leri
  inherited: string | null; // eldeki miras kart
  cardId: string | null;
  step: 'choose' | 'target';
  targets: string[];
  tokens: Partial<Record<TokenKey, string>>; // jeton -> oyuncu id
  inputs: Record<string, InputValue>;
  judgedPayers: string[] | null; // okuyucunun hükmü (ödeyenler)
  result: TurnResult | null;
  pickedTop: boolean; // eldeki en yoğun kart seçildi mi
}

export interface TurnLog {
  n: number;
  act: number;
  readerId: string;
  cardId: string;
  type: CardType;
  payers: string[];
}

export interface GameRun {
  act: 1 | 2 | 3;
  actTurn: number; // perdede tamamlanan tur sayısı
  actTurns: number; // bu perdenin toplam turu
  turnNo: number; // toplam tur
  readerIdx: number;
  phaseEndsAt: number | null;
  turn: Turn | null;
  nextInherit: string | null; // sonraki okuyucuya miras kalan kart
  used: string[]; // oynanan kartlar (eskiden yeniye)
  recentTypes: CardType[];
  log: TurnLog[];
  endedAt: number | null;
}

export interface PlayerStats {
  courage: number;
  paidUnits: number;
  soberPenalties: number;
  drinkLog: { at: number; units: number }[];
  autoSober: boolean; // içki sınırı aşıldı
  targeted: number;
  done: number;
  failed: number;
  readerTurns: number;
  missedTurns: number; // bağlı değilken gelen okuyuculuk
}

export type Catalog = ReadonlyMap<string, Card>;

// --- Niyetler (intent) ---
// İstemciden gelenler `by` alanını sunucu doldurur; istemci kimliğini kendisi seçemez.

export type ClientIntent =
  | { t: 'updateSettings'; patch: Partial<Settings> }
  | { t: 'consent'; consent: Partial<Consent> }
  | { t: 'profile'; name?: string; avatar?: number }
  | { t: 'start' }
  | { t: 'quitDrinking' }
  | { t: 'leave' }
  | { t: 'kick'; playerId: string }
  | { t: 'playCard'; cardId: string }
  | { t: 'pickTarget'; playerIds: string[] }
  | { t: 'vote'; playerId: string }
  | { t: 'answer'; yes: boolean }
  | { t: 'judge'; done?: boolean; payers?: string[] }
  | { t: 'restart' };

export type SystemIntent =
  | { t: 'join'; playerId: string; secret: string; name: string; avatar: number; isBot?: boolean; consent?: Partial<Consent> }
  | { t: 'connect'; playerId: string }
  | { t: 'disconnect'; playerId: string }
  | { t: 'tick' };

export type Intent = (ClientIntent & { by: string }) | SystemIntent;

export interface Fx {
  kind: string;
  payload?: unknown;
  to?: string[]; // boşsa herkese
}

export interface Ctx {
  now: number;
  rng: import('./rng').Rng;
  catalog: Catalog;
}

export class IntentError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

// Sabitler
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPRSTUVYZ';
export const MAX_PLAYERS = 12;
export const MIN_PLAYERS = 3;
export const MAX_NAME = 14;
export const AVATAR_COUNT = 12;
export const HOST_GRACE_MS = 10_000;
export const ROOM_TTL_MS = 12 * 60 * 60 * 1000;

// Faz süreleri (ms)
export const DUR = {
  actIntro: 2600,
  deal: 1400,
  choose: 15_000,
  target: 12_000,
  reveal: 2200,
  vote: 30_000,
  yesNo: 20_000,
  judge: 45_000,
  resolve: 5000,
} as const;
export const DRINK_LIMIT_UNITS = 12; // 1 saatte
export const DRINK_WINDOW_MS = 60 * 60 * 1000;
