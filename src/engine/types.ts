// Oyun durumu ve niyet tipleri. Motor saf TS'tir; sunucu ve istemci paylaşır.
import type { DeckId } from './cards';

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

export type TimerKind = 'hostGrace' | 'expire' | 'bot';

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
}

// --- Niyetler (intent) ---
// İstemciden gelenler `by` alanını sunucu doldurur; istemci kimliğini kendisi seçemez.

export type ClientIntent =
  | { t: 'updateSettings'; patch: Partial<Settings> }
  | { t: 'consent'; consent: Partial<Consent> }
  | { t: 'profile'; name?: string; avatar?: number }
  | { t: 'start' }
  | { t: 'quitDrinking' }
  | { t: 'leave' }
  | { t: 'kick'; playerId: string };

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
