// Oda bağlantısı: otomatik yeniden bağlanma, ping ile gecikme ölçümü, koltuğa dönüş.
import type { ClientMessage, ServerMessage } from '../../engine/protocol';
import { loadSeat, saveSeat } from './identity';

export type ConnStatus = 'connecting' | 'open' | 'reconnecting' | 'closed' | 'missing';

export interface ConnHandlers {
  onMessage(msg: ServerMessage): void;
  onStatus(s: ConnStatus): void;
}

export class RoomConnection {
  private ws: WebSocket | null = null;
  private retry = 0;
  private stopped = false;
  private pingTimer: number | undefined;
  private reconnectTimer: number | undefined;
  rtt = 0; // ms
  clockOffset = 0; // sunucuSaati - istemciSaati (ms)

  constructor(private code: string, private h: ConnHandlers, private spectator = false) {}

  connect() {
    this.stopped = false;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/api/room/${this.code}${this.spectator ? '?tv=1' : ''}`);
    this.ws = ws;
    this.h.onStatus(this.retry === 0 ? 'connecting' : 'reconnecting');

    ws.onopen = () => {
      this.retry = 0;
      this.h.onStatus('open');
      // Kayıtlı koltuk varsa aynı koltuğa dön
      // İzleyici (Ana Ekran) hiçbir koltuğa oturmaz
      const seat = this.spectator ? null : loadSeat(this.code);
      if (seat) this.send({ t: 'resume', playerId: seat.playerId, secret: seat.secret });
      this.ping();
      window.setTimeout(() => this.ping(), 600);
      window.clearInterval(this.pingTimer);
      this.pingTimer = window.setInterval(() => this.ping(), 4000);
    };
    ws.onmessage = (ev) => {
      let msg: ServerMessage;
      try { msg = JSON.parse(ev.data as string) as ServerMessage; } catch { return; }
      if (msg.t === 'pong') {
        const now = Date.now();
        const sample = now - msg.clientTime;
        // Ani sıçramaları yumuşat
        this.rtt = this.rtt ? Math.round(this.rtt * 0.7 + sample * 0.3) : sample;
        this.clockOffset = msg.serverTime + this.rtt / 2 - now;
      }
      if (msg.t === 'seat') saveSeat(this.code, { playerId: msg.playerId, secret: msg.secret });
      if (msg.t === 'error' && msg.code === 'NO_SEAT') saveSeat(this.code, null);
      this.h.onMessage(msg);
    };
    ws.onclose = (ev) => {
      window.clearInterval(this.pingTimer);
      if (this.stopped) return;
      // Masa yoksa (404 -> 1006 ile kapanır) birkaç denemeden sonra vazgeçeriz
      if (ev.code === 4000) { this.h.onStatus('closed'); return; }
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    this.retry++;
    this.h.onStatus('reconnecting');
    const delay = Math.min(8000, 400 * 2 ** Math.min(this.retry, 5)) + Math.random() * 300;
    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(async () => {
      // Masa hâlâ var mı?
      try {
        const r = await fetch(`/api/room/${this.code}/exists`);
        const j = (await r.json()) as { exists: boolean };
        if (!j.exists) { this.h.onStatus('missing'); return; }
      } catch { /* ağ yok, yine deneriz */ }
      if (!this.stopped) this.connect();
    }, delay);
  }

  private ping() {
    this.send({ t: 'ping', clientTime: Date.now(), rtt: this.rtt || undefined });
  }

  send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  close() {
    this.stopped = true;
    window.clearInterval(this.pingTimer);
    window.clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}
