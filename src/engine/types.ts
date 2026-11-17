// Oyun durumu ve niyet tipleri. Motor saf TS'tir; sunucu ve istemci paylaşır.
import type { Card, CardType, DeckId } from './cards';

export type Phase =
  | 'lobby' | 'actIntro' | 'draw' | 'choose' | 'reveal' | 'action'
  | 'resolve' | 'tableEvent' | 'finale' | 'summary';

export type GameLength = 'short' | 'normal' | 'long';
export type SipSize = 'small' | 'sip' | 'shot';
// Tempo: rahat = sohbet için süre yok, host ilerletir; süreli = her faz geri sayımla geçer
export type Pace = 'relaxed' | 'timed';

export interface Settings {
  deck: DeckId;
  drinking: boolean; // alkollü mü
  length: GameLength; // Kısa 6 / Normal 10 / Uzun 14 tur/perde
  sip: SipSize; // varsayılan 'sip'; shot kapalı gelir, host açabilir
  adult: boolean; // 18+ kilidi açık mı
  pace: Pace;
}

export const DEFAULT_SETTINGS: Settings = {
  deck: 'classic',
  drinking: true,
  length: 'normal',
  sip: 'sip',
  adult: false,
  pace: 'relaxed',
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

export type TimerKind = 'hostGrace' | 'expire' | 'bot' | 'phase' | 'catch';

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
  | { k: 'yesNo'; yes: boolean }
  | { k: 'choice'; index: number }; // ayna: hedefin gizli seçimi ya da diğerlerinin tahmini

export type PowerKind = 'shield' | 'mirror' | 'swap' | 'sabotage';
export const MAX_POCKET = 2;

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
  vetoed?: boolean; // anonim veto ile iptal
  passed?: string[]; // Pas kullananlar
  winner?: string; // düello kazananı
  secret?: number; // ayna: hedefin seçimi
  correct?: string[]; // ayna/itiraf: bilenler
  mg?: { kind: string; times: Record<string, number | null>; early: string[]; losers: string[] };
  sketch?: { word: string; drawer: string; correct: string[]; strokes: number[][] }; // Karakalem sonucu
  gallery?: { prompt: string; items: { author: string; strokes: number[][]; votes: number }[]; worst: string[] }; // Sergi sonucu
  guesses?: Record<string, number>; // ayna/yalan/ölçek: kim neyi tahmin etti (sonuçta açılır)
  author?: string; // itiraf: spot ışığındaki cevabın yazarı (sonuçta açılır)
  spotlight?: string; // itiraf: spot ışığındaki cevap
  effect?: string; // kural/lanet/olay masaya kondu (etki id)
  note?: string; // TIK'in kısa açıklaması
  shielded?: string[]; // Kalkan ile iptal edilen bedeller
  reflected?: { from: string; to: string }[]; // Ayna ile yansıtılanlar
}

// Masadaki aktif kural/lanet/olay
export interface ActiveEffect {
  id: string;
  cardId: string;
  kind: 'rule' | 'curse' | 'event' | 'decree' | 'mission';
  text: string; // jetonları çözülmüş metin
  targetId?: string; // lanetli oyuncu ya da gizli görevin ajanı (ajan herkese gizli)
  secret?: string; // gizli görevin kendisi (yalnızca ajana gider)
  turnsLeft: number | 'act';
  penalty: number;
  ownerId?: string; // kuralı koyan
}

// "Yakala!" sonrası 5 sn'lik masa oylaması
export interface CatchVote {
  id: string;
  // rule: kural bozuldu mu; mission: ajan görevini gerçekten yaptı mı
  mode: 'rule' | 'mission';
  accuser: string;
  accused: string;
  effectId: string;
  endsAt: number;
  votes: Record<string, boolean>;
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
  rest: string[]; // seçilmeyen kartlar (miras adayları)
  swapped: boolean; // Takas kullanıldı
  sabotagedBy: string | null;
  passed: string[]; // bu kartta Pas kullananlar
  vetoed: boolean;
  stage: 'main' | 'write' | 'guess'; // itiraf aşaması
  texts: Record<string, string>; // itiraf cevapları (tur bitince silinir)
  spotlightAuthor: string | null;
  shuffled: string[]; // itiraf: karışık cevap sırası (yazar id'leri)
  system: boolean; // okuyucusuz sistem kartı (masa olayı, Su Molası, final)
  blind: boolean; // Hayalet Saati: okuyucu kartları kapalı görür
  options: string[]; // ayna seçenekleri (etiketler ya da oyuncu id'leri)
  optionPlayers: boolean;
  mg: MinigameState | null;
  sk: SketchState | null; // Karakalem çizimi
  gal: GalleryState | null; // Sergi
  secret: string | null; // gizli kelime/görev (yalnızca hedefe gider)
}

// Karakalem: çizgiler [x1,y1,x2,y2,…] (0..1000). Kelime turun `secret` alanındadır.
export interface SketchState {
  drawer: string;
  startAt: number;
  endsAt: number;
  strokes: number[][];
  correct: string[]; // bilme sırasına göre
  wrong: { id: string; text: string; at: number }[]; // masaya uçuşan yanlış tahminler
  guessed: Record<string, number>; // kişi başı tahmin sayısı
}

// Sergi: herkes aynı konuyu çizer, isimsiz galeride en kötü eser oylanır
export interface GalleryState {
  prompt: string;
  stage: 'draw' | 'vote';
  startAt: number;
  endsAt: number;
  drawings: Record<string, number[][]>;
  done: string[]; // "Bitirdim" diyenler
  order: string[]; // galerideki sıra (sanatçılar, karışık)
  votes: Record<string, number>; // oy veren → eser sırası
}

// Mini oyun durumu. Gizli anlar (patlama, dolma) açılana kadar istemciye gitmez.
export interface MinigameState {
  kind: 'bomb' | 'reflex' | 'countdown';
  startAt: number;
  stage: 'wait' | 'live' | 'done';
  bombs: { holder: string; explodeAt: number; exploded: boolean }[];
  throws: { bomb: number; from: string; to: string; at: number }[];
  fillAt: number; // refleks: bardağın dolduğu an
  signaled: boolean; // refleks: "doldu" işareti gönderildi
  taps: Record<string, number>; // gecikmesi düzeltilmiş dokunma anı (sunucu saati)
}

export interface CatchResult extends Omit<CatchVote, 'mode'> {
  // missionGuess: ajan tahmini (oylamasız), missionFail: görev süresi doldu
  mode: 'rule' | 'mission' | 'missionGuess' | 'missionFail';
  missionText?: string;
  guilty: boolean;
  yes: number;
  no: number;
  payments: Payment[];
  mini: { id: string; text: string }[];
  waterBreak: string[];
  at: number;
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
  direction: 1 | -1; // sıra yönü (masa olayı ters çevirebilir)
  effects: ActiveEffect[];
  catchVote: CatchVote | null;
  blindTurns: number; // Hayalet Saati: kalan kör tur
  pendingEvent: 'table' | 'water' | null;
  lastCatch?: CatchResult;
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
  powers: PowerKind[]; // cep (en fazla 2)
  powersEarned: number; // kazanılan güç kartı sayısı (her 3 cesarette 1)
  passAct: number; // Pas'ın kullanıldığı perde (0 = kullanılmadı)
  vetoUsed: boolean;
  paidHistory: number[]; // son bedeller (Mezardan Dönüş için)
  lastCatchAt: number;
  catches: number; // doğru yakalamalar
  decree: boolean; // Sultan Kedi: perde sonuna kadar kural koyabilir
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
  | { t: 'choose'; index: number }
  | { t: 'answerText'; text: string }
  | { t: 'catch'; effectId: string; accused: string }
  | { t: 'catchVote'; yes: boolean }
  | { t: 'usePower'; power: PowerKind; targetId?: string; cardId?: string }
  | { t: 'decree'; text: string }
  | { t: 'pass' }
  | { t: 'veto' }
  | { t: 'drawSeg'; s: number[]; n?: boolean } // çizen: çizgi parçası (n: yeni çizgi)
  | { t: 'drawUndo' }
  | { t: 'drawClear' }
  | { t: 'guess'; text: string } // Karakalem tahmini
  | { t: 'galDone' } // Sergi: eserimi teslim ettim
  | { t: 'galVote'; index: number } // Sergi: en kötü eser
  | { t: 'advance'; at?: string } // host: beklemeden sonraki adıma geç (at: istemcinin gördüğü adım)
  | { t: 'missionDone'; effectId: string } // ajan: görevimi yaptım
  | { t: 'minigameInput'; action: 'tap' | 'throw'; bomb?: number; at?: number; lat?: number }
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
  resolvePower: 9000, // cebinde Kalkan/Ayna olan ödeyen varsa
  ruleResolve: 4500,
  tableEvent: 7000,
  finale: 9000,
  write: 45_000,
  guess: 30_000,
  mirror: 30_000,
  catchVote: 8000,
  catchCooldown: 8000,
  mgIntro: 2500, // mini oyun başlamadan önce hazırlık
  bombMin: 8000,
  bombMax: 20_000,
  reflexMin: 2000,
  reflexMax: 6000,
  reflexWindow: 4000, // bardak dolduktan sonra dokunma süresi
  countdownTarget: 10_000,
  countdownMax: 20_000,
  netGrace: 400, // ağ gecikmesi payı
} as const;
export const MAX_RULES = 3;
export const MAX_CONFESSION = 80;
export const DRINK_LIMIT_UNITS = 12; // 1 saatte
export const DRINK_WINDOW_MS = 60 * 60 * 1000;
