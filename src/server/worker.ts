// Worker: API yönlendirme. Statik dosyalar Workers Static Assets ile sunulur.
import { ROOM_CODE_ALPHABET } from '../engine/types';
export { RoomDO } from './RoomDO';
export { CardStatsDO } from './CardStatsDO';

export interface Env {
  ROOMS: DurableObjectNamespace;
  STATS: DurableObjectNamespace;
  ASSETS: Fetcher;
}

const CODE_RE = new RegExp(`^[${ROOM_CODE_ALPHABET}]{4}$`);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function makeCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => ROOM_CODE_ALPHABET[b % ROOM_CODE_ALPHABET.length]).join('');
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // Masa Kur: yeni oda kodu üret
    if (path === '/api/rooms' && req.method === 'POST') {
      const bots = Math.max(0, Math.min(11, Number(url.searchParams.get('bots') ?? 0) || 0));
      for (let i = 0; i < 12; i++) {
        const code = makeCode();
        const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
        const res = await stub.fetch(`https://room/init?code=${code}&bots=${bots}`, { method: 'POST' });
        if (res.status === 201) return json({ code }, 201);
      }
      return json({ error: 'NO_CODE', message: 'Boş masa bulunamadı, tekrar dene.' }, 503);
    }

    // Kart istatistikleri (isimsiz sayılar): güldürdü / sıktı / açıldı
    if (path === '/api/card-stats' && req.method === 'GET') {
      return env.STATS.get(env.STATS.idFromName('global')).fetch('https://stats/all');
    }

    const m = path.match(/^\/api\/room\/([A-Za-z]{4})(\/exists)?$/);
    if (m) {
      const code = m[1]!.toUpperCase();
      if (!CODE_RE.test(code)) return json({ error: 'BAD_CODE' }, 400);
      const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
      if (m[2]) return stub.fetch(`https://room/exists?code=${code}`);
      if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return json({ error: 'EXPECTED_WS' }, 426);
      return stub.fetch(new Request(`https://room/ws?code=${code}${url.searchParams.get('tv') === '1' ? '&tv=1' : ''}`, req));
    }

    if (path.startsWith('/api/')) return json({ error: 'NOT_FOUND' }, 404);
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
