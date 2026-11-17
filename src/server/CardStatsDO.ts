// Kart istatistikleri: tüm masalardan gelen "güldürdü / sıktı" oyları ve kaç kez açıldığı.
// Tek bir global örnek (idFromName('global')). Kişisel veri yok: yalnızca kart kimliği ve sayılar.
import { DurableObject } from 'cloudflare:workers';
import type { Env } from './worker';

export interface CardDelta {
  id: string;
  up?: number;
  down?: number;
  shown?: number;
}

const ID_RE = /^[a-z0-9-]{1,60}$/;

export class CardStatsDO extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS card (id TEXT PRIMARY KEY, up INTEGER NOT NULL DEFAULT 0, down INTEGER NOT NULL DEFAULT 0, shown INTEGER NOT NULL DEFAULT 0)',
    );
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/add' && req.method === 'POST') {
      const list = (await req.json().catch(() => [])) as CardDelta[];
      if (!Array.isArray(list)) return new Response('bad', { status: 400 });
      for (const d of list.slice(0, 200)) {
        if (!d || typeof d.id !== 'string' || !ID_RE.test(d.id)) continue;
        const clamp = (n: unknown) => Math.max(-50, Math.min(50, Math.trunc(Number(n) || 0)));
        const up = clamp(d.up), down = clamp(d.down), shown = clamp(d.shown);
        if (!up && !down && !shown) continue;
        this.ctx.storage.sql.exec(
          'INSERT INTO card (id, up, down, shown) VALUES (?, MAX(?, 0), MAX(?, 0), MAX(?, 0)) ON CONFLICT(id) DO UPDATE SET up = MAX(up + ?, 0), down = MAX(down + ?, 0), shown = shown + MAX(?, 0)',
          d.id, up, down, shown, up, down, shown,
        );
      }
      return new Response('ok');
    }
    if (url.pathname === '/all') {
      const rows = this.ctx.storage.sql.exec('SELECT id, up, down, shown FROM card ORDER BY shown DESC').toArray();
      return Response.json({ cards: rows }, { headers: { 'cache-control': 'no-store' } });
    }
    return new Response('not found', { status: 404 });
  }
}
