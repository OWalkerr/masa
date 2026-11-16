// Oyuncuya özel görünüm. Gizli bilgiler (secret, başkalarının katılım tercihleri) asla gitmez.
import type { GameState, Phase, Settings } from './types';

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
}

export function viewFor(s: GameState, playerId: string | null): View {
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
      ? { id: me.id, isHost: me.id === s.hostId, consent: { ...me.consent }, quitDrinking: me.quitDrinking }
      : null,
    startedAt: s.startedAt,
  };
}
