// Oda durumu (Zustand). Sunucudan gelen görünüm tek doğruluk kaynağıdır.
import { create } from 'zustand';
import type { ClientMessage, ServerMessage } from '../../engine/protocol';
import type { View } from '../../engine/viewFor';
import { loadSeat } from '../net/identity';
import { RoomConnection, type ConnStatus } from '../net/socket';

export interface FxEvent {
  seq: number;
  kind: string;
  payload?: unknown;
}

export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'error';
}

interface RoomStore {
  code: string | null;
  status: ConnStatus;
  view: View | null;
  toasts: Toast[];
  conn: RoomConnection | null;
  fx: FxEvent[]; // son efekt olayları
  serverNow(): number;
  resuming: boolean; // kayıtlı koltuğa dönülüyor
  spectator: boolean;
  you: string | null;
  open(code: string, spectator?: boolean): void;
  close(): void;
  send(msg: ClientMessage): void;
  toast(text: string, tone?: Toast['tone']): void;
}

let toastSeq = 0;
let fxSeq = 0;

export const useRoom = create<RoomStore>((set, get) => ({
  code: null,
  status: 'connecting',
  view: null,
  toasts: [],
  conn: null,
  resuming: false,
  spectator: false,
  you: null,
  fx: [],
  serverNow() {
    return Date.now() + (get().conn?.clockOffset ?? 0);
  },

  open(code, spectator = false) {
    if (get().code === code && get().conn && get().spectator === spectator) return;
    get().conn?.close();
    const conn = new RoomConnection(code, {
      onStatus: (status) => set({ status }),
      onMessage: (msg: ServerMessage) => {
        if (msg.t === 'snapshot') {
          const cur = get().view;
          // Eski sürümleri yok say (sıra dışı gelen mesajlar)
          if (!cur || msg.rev >= cur.rev || cur.code !== msg.view.code) set({ view: msg.view });
        } else if (msg.t === 'seat') {
          set({ resuming: false, you: msg.playerId });
        } else if (msg.t === 'error') {
          if (msg.code === 'NO_SEAT') set({ resuming: false, you: null });
          else get().toast(msg.message, 'error');
        } else if (msg.t === 'fx') {
          set({ fx: [...get().fx.slice(-19), { seq: ++fxSeq, kind: msg.kind, payload: msg.payload }] });
          if (msg.kind === 'hostChanged') {
            const p = msg.payload as { name: string };
            get().toast(`Masanın yeni sahibi: ${p.name}`);
          }
        }
      },
    }, spectator);
    set({ code, conn, view: null, status: 'connecting', resuming: !spectator && !!loadSeat(code), you: null, spectator });
    conn.connect();
  },

  close() {
    get().conn?.close();
    set({ conn: null, code: null, view: null });
  },

  send(msg) {
    get().conn?.send(msg);
  },

  toast(text, tone = 'info') {
    const id = ++toastSeq;
    set({ toasts: [...get().toasts, { id, text, tone }] });
    window.setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 3500);
  },
}));
