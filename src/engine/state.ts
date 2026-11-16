// Başlangıç durumu ve yardımcılar
import { DEFAULT_SETTINGS, ROOM_TTL_MS, type GameState, type Player } from './types';

export function createRoom(code: string, now: number, seed: number, bots = 0): GameState {
  return {
    v: 1,
    code,
    rev: 0,
    phase: 'lobby',
    createdAt: now,
    lastActivity: now,
    hostId: null,
    players: [],
    order: [],
    settings: { ...DEFAULT_SETTINGS },
    timers: [{ id: 'expire', kind: 'expire', at: now + ROOM_TTL_MS }],
    botsPending: Math.max(0, Math.min(11, bots)),
    rngState: seed >>> 0,
    seq: 0,
    startedAt: null,
  };
}

export function activePlayers(s: GameState): Player[] {
  return s.players.filter((p) => !p.left);
}

export function getPlayer(s: GameState, id: string): Player | undefined {
  return s.players.find((p) => p.id === id);
}

// Bir sonraki zamanlayıcı anı (DO alarmı için)
export function nextTimerAt(s: GameState): number | null {
  if (s.timers.length === 0) return null;
  return Math.min(...s.timers.map((t) => t.at));
}
