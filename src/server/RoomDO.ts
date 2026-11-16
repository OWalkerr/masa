// Oda başına bir Durable Object (SQLite tabanlı, WebSocket Hibernation API).
import { DurableObject } from 'cloudflare:workers';
import { ClientMessage, MAX_MESSAGE_BYTES, RATE_LIMIT_PER_SEC, type ServerMessage } from '../engine/protocol';
import { reduce } from '../engine/reducer';
import { loadCatalog } from '../engine/catalog';
import { makeRng, randomSeed } from '../engine/rng';
import { createRoom, nextTimerAt } from '../engine/state';
import { IntentError, type Fx, type GameState, type Intent } from '../engine/types';
import { viewFor } from '../engine/viewFor';
import { botDecide, botJoinIntents } from './bots';
import type { Env } from './worker';

interface Attachment {
  pid: string | null;
  rtt?: number; // istemcinin ölçtüğü gidiş-dönüş süresi (ms), mini oyun gecikme düzeltmesi için
}

function randomId(bytes: number): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class RoomDO extends DurableObject<Env> {
  private game: GameState | null = null;
  // Hız sınırı sayaçları (bellekte; uyku sonrası sıfırlanması sorun değil)
  private rate = new WeakMap<WebSocket, { start: number; count: number }>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.game = (await ctx.storage.get<GameState>('game')) ?? null;
    });
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const code = url.searchParams.get('code') ?? '';

    if (url.pathname === '/init' && req.method === 'POST') {
      if (this.game) return new Response('taken', { status: 409 });
      const bots = Number(url.searchParams.get('bots') ?? 0) || 0;
      this.game = createRoom(code, Date.now(), randomSeed(), bots);
      await this.persist();
      return new Response('ok', { status: 201 });
    }

    if (url.pathname === '/exists') {
      const g = this.game;
      const host = g?.players.find((p) => p.id === g.hostId);
      return Response.json({
        exists: !!g,
        phase: g?.phase ?? null,
        players: g ? g.players.filter((p) => !p.left).length : 0,
        hostName: host?.name ?? null,
      });
    }

    if (url.pathname === '/ws') {
      if (!this.game) return new Response('Masa bulunamadı', { status: 404 });
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ pid: null } satisfies Attachment);
      // Katılmadan önce izleyici görünümü gönder (giriş ekranı için)
      this.send(server, { t: 'snapshot', view: viewFor(this.game, null, loadCatalog()), rev: this.game.rev });
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('not found', { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const size = typeof raw === 'string' ? new TextEncoder().encode(raw).byteLength : raw.byteLength;
    if (size > MAX_MESSAGE_BYTES) return this.sendError(ws, 'TOO_BIG', 'Mesaj çok büyük.');
    if (!this.allow(ws)) return this.sendError(ws, 'RATE', 'Biraz yavaş, TIK yetişemiyor.');
    if (!this.game) return this.sendError(ws, 'NO_ROOM', 'Masa kapanmış.');

    let parsed: ClientMessage;
    try {
      const r = ClientMessage.safeParse(JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)));
      if (!r.success) return this.sendError(ws, 'BAD_MESSAGE', 'Geçersiz mesaj.');
      parsed = r.data;
    } catch {
      return this.sendError(ws, 'BAD_JSON', 'Geçersiz mesaj.');
    }

    const att = (ws.deserializeAttachment() as Attachment | null) ?? { pid: null };
    const now = Date.now();

    switch (parsed.t) {
      case 'ping':
        if (parsed.rtt !== undefined) ws.serializeAttachment({ ...att, rtt: parsed.rtt } satisfies Attachment);
        return this.send(ws, { t: 'pong', serverTime: now, clientTime: parsed.clientTime });

      case 'minigameInput': {
        if (!att.pid) return this.sendError(ws, 'NO_SEAT', 'Önce masaya otur.');
        // Varış anı ve tek yön gecikme tahmini sunucuda eklenir; istemci kendi saatini bildiremez
        const lat = Math.min(400, Math.max(0, (att.rtt ?? 0) / 2));
        await this.dispatch({ t: 'minigameInput', action: parsed.action, bomb: parsed.bomb, at: now, lat, by: att.pid }, ws);
        return;
      }

      case 'resume': {
        const p = this.game.players.find((x) => x.id === parsed.playerId && !x.left);
        if (!p || p.isBot || p.secret !== parsed.secret) return this.sendError(ws, 'NO_SEAT', 'Koltuğun bulunamadı.');
        ws.serializeAttachment({ pid: p.id } satisfies Attachment);
        this.send(ws, { t: 'seat', playerId: p.id, secret: p.secret });
        await this.dispatch({ t: 'connect', playerId: p.id }, ws);
        return;
      }

      case 'join': {
        if (att.pid) return this.sendError(ws, 'ALREADY_JOINED', 'Zaten masadasın.');
        const playerId = `p-${randomId(6)}`;
        const secret = randomId(16);
        const firstHuman = !this.game.players.some((p) => !p.isBot);
        const ok = await this.dispatch(
          { t: 'join', playerId, secret, name: parsed.name, avatar: parsed.avatar, consent: parsed.consent },
          ws,
          false,
        );
        if (!ok) return;
        ws.serializeAttachment({ pid: playerId } satisfies Attachment);
        this.send(ws, { t: 'seat', playerId, secret });
        // ?bots=N ile kurulan masaya ilk insan oturunca botlar gelir
        if (firstHuman && this.game.botsPending > 0) {
          const rng = makeRng(this.game.rngState);
          const intents = botJoinIntents(this.game, this.game.botsPending, rng);
          this.game.rngState = rng.state();
          this.game.botsPending = 0;
          for (const it of intents) await this.dispatch(it, null, false);
        }
        await this.flush();
        return;
      }

      default: {
        if (!att.pid) return this.sendError(ws, 'NO_SEAT', 'Önce masaya otur.');
        await this.dispatch({ ...parsed, by: att.pid } as Intent, ws);
      }
    }
  }

  async webSocketClose(ws: WebSocket) {
    await this.onGone(ws);
  }

  async webSocketError(ws: WebSocket) {
    await this.onGone(ws);
  }

  async alarm() {
    if (!this.game) return;
    const fx = await this.dispatch({ t: 'tick' }, null, false);
    // Sırası gelen botlar karar verir
    for (const f of fx ?? []) {
      if (f.kind !== 'botDue' || !this.game) continue;
      const botId = (f.payload as { playerId: string }).playerId;
      const rng = makeRng(this.game.rngState ^ 0x9e3779b9);
      const intent = botDecide(this.game, botId, rng, loadCatalog());
      if (intent) await this.dispatch({ ...intent, by: botId } as Intent, null, false);
    }
    await this.flush();
    if (fx && fx.some((f) => f.kind === 'expired')) {
      // 12 saat işlem görmeyen oda tamamen silinir (anonim cevaplar dahil)
      for (const s of this.ctx.getWebSockets()) {
        try { s.close(4000, 'Masa kapandı'); } catch { /* zaten kapalı */ }
      }
      this.game = null;
      await this.ctx.storage.deleteAlarm();
      await this.ctx.storage.deleteAll();
    }
  }

  // --- iç yardımcılar ---

  private async onGone(ws: WebSocket) {
    const att = ws.deserializeAttachment() as Attachment | null;
    if (!att?.pid || !this.game) return;
    const stillOpen = this.ctx
      .getWebSockets()
      .some((s) => s !== ws && s.readyState === WebSocket.OPEN && (s.deserializeAttachment() as Attachment | null)?.pid === att.pid);
    if (!stillOpen) await this.dispatch({ t: 'disconnect', playerId: att.pid }, null);
  }

  // Niyeti motora uygula. Hata olursa durum değişmez ve gönderene error döner.
  private async dispatch(intent: Intent, from: WebSocket | null, flush = true): Promise<Fx[] | null> {
    if (!this.game) return null;
    const rng = makeRng(this.game.rngState);
    try {
      const { state, fx } = reduce(this.game, intent, { now: Date.now(), rng, catalog: loadCatalog() });
      this.game = state;
      this.pendingFx.push(...fx.filter((f) => f.kind !== 'expired' && f.kind !== 'botDue'));
      if (flush) await this.flush();
      return fx;
    } catch (e) {
      if (e instanceof IntentError) {
        if (from) this.sendError(from, e.code, e.message);
        return null;
      }
      console.error('reduce hatası', e);
      if (from) this.sendError(from, 'INTERNAL', 'Bir şeyler ters gitti.');
      return null;
    }
  }

  private pendingFx: Fx[] = [];

  // Kaydet, alarmı kur, herkese kendi görünümünü gönder
  private async flush() {
    if (!this.game) return;
    await this.persist();
    const sockets = this.ctx.getWebSockets();
    for (const ws of sockets) {
      const att = ws.deserializeAttachment() as Attachment | null;
      this.send(ws, { t: 'snapshot', view: viewFor(this.game, att?.pid ?? null, loadCatalog()), rev: this.game.rev });
    }
    for (const f of this.pendingFx) {
      for (const ws of sockets) {
        const pid = (ws.deserializeAttachment() as Attachment | null)?.pid ?? null;
        if (f.to && (!pid || !f.to.includes(pid))) continue;
        this.send(ws, { t: 'fx', kind: f.kind, payload: f.payload });
      }
    }
    this.pendingFx = [];
  }

  private async persist() {
    if (!this.game) return;
    await this.ctx.storage.put('game', this.game);
    const at = nextTimerAt(this.game);
    if (at !== null) await this.ctx.storage.setAlarm(Math.max(at, Date.now() + 50));
  }

  private allow(ws: WebSocket): boolean {
    const now = Date.now();
    const r = this.rate.get(ws);
    if (!r || now - r.start >= 1000) {
      this.rate.set(ws, { start: now, count: 1 });
      return true;
    }
    r.count++;
    return r.count <= RATE_LIMIT_PER_SEC;
  }

  private send(ws: WebSocket, msg: ServerMessage) {
    try { ws.send(JSON.stringify(msg)); } catch { /* kapanmış soket */ }
  }

  private sendError(ws: WebSocket, code: string, message: string) {
    this.send(ws, { t: 'error', code, message });
  }
}
