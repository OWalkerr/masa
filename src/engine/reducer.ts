// Saf, deterministik reducer: reduce(state, intent, ctx) -> { state, fx }
import { ensureStats, judge, onPhaseTimeout, pendingActors, pickTarget, playCard, startGame, submitInput } from './game';
import { cleanName, uniqueName } from './names';
import { activePlayers, getPlayer } from './state';
import {
  AVATAR_COUNT, HOST_GRACE_MS, IntentError, MAX_PLAYERS, MIN_PLAYERS, ROOM_TTL_MS,
  type Ctx, type Fx, type GameState, type Intent, type Player, type Settings,
} from './types';

export interface ReduceResult {
  state: GameState;
  fx: Fx[];
}

export function reduce(prev: GameState, intent: Intent, ctx: Ctx): ReduceResult {
  // Durumu kopyalayıp kopyayı değiştiriyoruz; hata fırlarsa orijinal bozulmaz
  const s: GameState = structuredClone(prev);
  const fx: Fx[] = [];
  const rng = ctx.rng;

  switch (intent.t) {
    case 'join': {
      const existing = getPlayer(s, intent.playerId);
      if (existing) throw new IntentError('ALREADY_JOINED', 'Bu koltuk zaten dolu.');
      if (activePlayers(s).length >= MAX_PLAYERS) throw new IntentError('ROOM_FULL', 'Masa dolu (en fazla 12 kişi).');
      const name = cleanName(intent.name);
      if (!name) throw new IntentError('BAD_NAME', 'Bir isim yaz.');
      const avatar = clampAvatar(intent.avatar);
      const p: Player = {
        id: intent.playerId,
        secret: intent.secret,
        name: uniqueName(name, activePlayers(s).map((x) => x.name)),
        avatar,
        isBot: !!intent.isBot,
        connected: true,
        joinedAt: ctx.now,
        joinSeq: s.seq++,
        left: false,
        consent: { ageOk: false, spicy: false, contact: false, ...intent.consent },
        quitDrinking: false,
        lastSeen: ctx.now,
      };
      if (!p.consent.ageOk) { p.consent.spicy = false; p.consent.contact = false; }
      s.players.push(p);
      s.order.push(p.id); // oyun başladıysa da sıranın sonuna eklenir
      if (!s.hostId && !p.isBot) s.hostId = p.id;
      if (s.game) ensureStats(s, p.id);
      fx.push({ kind: 'joined', payload: { playerId: p.id, name: p.name } });
      break;
    }

    case 'connect': {
      const p = mustPlayer(s, intent.playerId);
      p.connected = true;
      p.lastSeen = ctx.now;
      // Host geri geldiyse devir zamanlayıcısını iptal et
      s.timers = s.timers.filter((t) => !(t.kind === 'hostGrace' && t.playerId === p.id));
      if (s.stats[p.id]) s.stats[p.id]!.missedTurns = 0;
      break;
    }

    case 'disconnect': {
      const p = getPlayer(s, intent.playerId);
      if (!p) return { state: prev, fx };
      p.connected = false;
      p.lastSeen = ctx.now;
      if (s.hostId === p.id) {
        s.timers = s.timers.filter((t) => t.kind !== 'hostGrace');
        s.timers.push({ id: `hg-${s.seq++}`, kind: 'hostGrace', at: ctx.now + HOST_GRACE_MS, playerId: p.id });
      }
      break;
    }

    case 'tick': {
      const due = s.timers.filter((t) => t.at <= ctx.now);
      s.timers = s.timers.filter((t) => t.at > ctx.now);
      for (const t of due) {
        if (t.kind === 'hostGrace') {
          const host = s.hostId ? getPlayer(s, s.hostId) : undefined;
          if (host && !host.connected) transferHost(s, fx, host.id);
        } else if (t.kind === 'phase') {
          onPhaseTimeout(s, ctx, fx);
        } else if (t.kind === 'bot') {
          // Bot kararını sunucu verir (src/server/bots.ts)
          if (t.playerId) fx.push({ kind: 'botDue', payload: { playerId: t.playerId }, to: [] });
        } else if (t.kind === 'expire') {
          // Odanın silinmesini sunucu yapar; motor yalnızca işaret verir
          fx.push({ kind: 'expired' });
          s.timers.push(t);
        }
      }
      // tick bir eylem değildir; lastActivity'yi güncellemez
      scheduleBots(s, ctx);
      s.rngState = rng.state();
      s.rev = prev.rev + 1;
      return { state: s, fx };
    }

    case 'updateSettings': {
      requireHost(s, intent.by);
      requirePhase(s, 'lobby');
      s.settings = applySettings(s.settings, intent.patch);
      break;
    }

    case 'consent': {
      const p = mustPlayer(s, intent.by);
      p.consent = { ...p.consent, ...intent.consent };
      // Yaş onayı yoksa 18+ katılımlar da kapalıdır
      if (!p.consent.ageOk) { p.consent.spicy = false; p.consent.contact = false; }
      break;
    }

    case 'profile': {
      requirePhase(s, 'lobby');
      const p = mustPlayer(s, intent.by);
      if (intent.name !== undefined) {
        const name = cleanName(intent.name);
        if (!name) throw new IntentError('BAD_NAME', 'Bir isim yaz.');
        p.name = uniqueName(name, activePlayers(s).filter((x) => x.id !== p.id).map((x) => x.name));
      }
      if (intent.avatar !== undefined) p.avatar = clampAvatar(intent.avatar);
      break;
    }

    case 'kick': {
      requireHost(s, intent.by);
      requirePhase(s, 'lobby');
      if (intent.playerId === intent.by) throw new IntentError('BAD_TARGET', 'Kendini masadan atamazsın.');
      removePlayer(s, intent.playerId);
      break;
    }

    case 'start': {
      requireHost(s, intent.by);
      requirePhase(s, 'lobby');
      if (activePlayers(s).length < MIN_PLAYERS) throw new IntentError('NOT_ENOUGH', 'Başlamak için en az 3 oyuncu gerek.');
      s.startedAt = ctx.now;
      // Oturma düzeni: katılım sırası; ilk okuyucu rastgele (M1'de kullanılacak)
      s.order = activePlayers(s).sort((a, b) => a.joinSeq - b.joinSeq).map((p) => p.id);
      const firstReader = rng.int(s.order.length);
      s.order = [...s.order.slice(firstReader), ...s.order.slice(0, firstReader)];
      fx.push({ kind: 'gameStarted' });
      startGame(s, ctx, fx);
      break;
    }

    case 'playCard':
      playCard(s, ctx, fx, intent.by, intent.cardId);
      break;
    case 'pickTarget':
      pickTarget(s, ctx, fx, intent.by, intent.playerIds);
      break;
    case 'vote':
      submitInput(s, ctx, fx, intent.by, { k: 'vote', playerId: intent.playerId });
      break;
    case 'answer':
      submitInput(s, ctx, fx, intent.by, { k: 'yesNo', yes: intent.yes });
      break;
    case 'judge':
      judge(s, ctx, fx, intent.by, intent.done, intent.payers);
      break;

    case 'restart': {
      requireHost(s, intent.by);
      requirePhase(s, 'summary');
      // Aynı masa, yeni oyun: lobiye dön, kalkanları çıkar
      s.players = s.players.filter((p) => !p.left);
      s.order = s.order.filter((id) => s.players.some((p) => p.id === id));
      s.phase = 'lobby';
      s.game = null;
      s.stats = {};
      s.startedAt = null;
      s.timers = s.timers.filter((t) => t.kind === 'expire' || t.kind === 'hostGrace');
      fx.push({ kind: 'restarted' });
      break;
    }

    case 'quitDrinking': {
      const p = mustPlayer(s, intent.by);
      p.quitDrinking = true;
      fx.push({ kind: 'quitDrinking', to: [p.id] });
      break;
    }

    case 'leave': {
      const p = mustPlayer(s, intent.by);
      if (s.phase === 'lobby') removePlayer(s, p.id);
      else { p.left = true; p.connected = false; if (s.hostId === p.id) transferHost(s, fx, p.id); }
      break;
    }

    default: {
      const never: never = intent;
      throw new IntentError('UNKNOWN', `Bilinmeyen niyet: ${JSON.stringify(never)}`);
    }
  }

  scheduleBots(s, ctx);
  s.rngState = rng.state();
  s.lastActivity = ctx.now;
  // Oda 12 saat işlem görmezse silinir: her eylemde süre uzar
  s.timers = s.timers.filter((t) => t.kind !== 'expire');
  s.timers.push({ id: 'expire', kind: 'expire', at: ctx.now + ROOM_TTL_MS });
  s.rev = prev.rev + 1;
  return { state: s, fx };
}

// --- yardımcılar ---

// Eylem bekleyen botlara 1–4 sn sonrası için zamanlayıcı kur; artık beklenmeyenlerinkini kaldır
function scheduleBots(s: GameState, ctx: Ctx) {
  const pending = new Set(
    pendingActors(s, ctx).filter((id) => s.players.some((p) => p.id === id && p.isBot && !p.left)),
  );
  s.timers = s.timers.filter((t) => t.kind !== 'bot' || (t.playerId && pending.has(t.playerId) && (t.payload as { k?: string })?.k === botKey(s)));
  for (const id of pending) {
    if (s.timers.some((t) => t.kind === 'bot' && t.playerId === id)) continue;
    s.timers.push({ id: `bot-${s.seq++}`, kind: 'bot', at: ctx.now + 1000 + ctx.rng.int(3000), playerId: id, payload: { k: botKey(s) } });
  }
}

// Botun hangi adım için zamanlandığı (adım değişince zamanlayıcı yenilenir)
function botKey(s: GameState): string {
  const t = s.game?.turn;
  return `${s.phase}:${s.game?.turnNo ?? -1}:${t?.step ?? ''}`;
}

function clampAvatar(a: number): number {
  return Number.isInteger(a) && a >= 0 && a < AVATAR_COUNT ? a : 0;
}

function mustPlayer(s: GameState, id: string): Player {
  const p = getPlayer(s, id);
  if (!p || p.left) throw new IntentError('NO_SEAT', 'Bu masada oturmuyorsun.');
  return p;
}

function requireHost(s: GameState, by: string) {
  if (s.hostId !== by) throw new IntentError('NOT_HOST', 'Bunu yalnızca masayı kuran yapabilir.');
}

function requirePhase(s: GameState, phase: GameState['phase']) {
  if (s.phase !== phase) throw new IntentError('BAD_PHASE', 'Şu an bunu yapamazsın.');
}

function removePlayer(s: GameState, id: string) {
  s.players = s.players.filter((p) => p.id !== id);
  s.order = s.order.filter((x) => x !== id);
  s.timers = s.timers.filter((t) => t.playerId !== id);
  if (s.hostId === id) {
    s.hostId = null;
    const next = oldestHuman(s, id, true) ?? oldestHuman(s, id, false);
    if (next) s.hostId = next.id;
  }
}

function oldestHuman(s: GameState, exclude: string, mustBeConnected: boolean): Player | undefined {
  return s.players
    .filter((p) => !p.isBot && !p.left && p.id !== exclude && (!mustBeConnected || p.connected))
    .sort((a, b) => a.joinSeq - b.joinSeq)[0];
}

// Hostluk en eski bağlı (insan) oyuncuya geçer
export function transferHost(s: GameState, fx: Fx[], fromId: string) {
  const next = oldestHuman(s, fromId, true);
  if (!next) return;
  s.hostId = next.id;
  s.timers = s.timers.filter((t) => t.kind !== 'hostGrace');
  fx.push({ kind: 'hostChanged', payload: { hostId: next.id, name: next.name } });
}

export function applySettings(cur: Settings, patch: Partial<Settings>): Settings {
  const next: Settings = { ...cur, ...patch };
  if (next.deck === 'duel') throw new IntentError('NOT_YET', 'Düello Ligi v2 ile gelecek.');
  if (next.deck === 'clean') next.drinking = false; // Temiz deste alkolsüz sabittir
  if (next.deck === 'spicy') next.adult = true; // Ateşli deste 18+ kilidini açar
  if (!next.drinking && next.sip === 'shot') next.sip = 'sip';
  return next;
}
