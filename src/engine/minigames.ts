// Mini oyunlar: bomba, refleks, geri sayım.
// Süre ölçümü sunucu zamanıyla yapılır. Sunucu her istemcinin tek yön gecikmesini (lat ≈ RTT/2) ölçer;
// dokunma anı = varış - lat. Gösterilen işaretin (bardak doldu, sayım başladı) istemciye varışı da lat kadar sürer.
import type { Card } from './cards';
import { activePlayers, getPlayer } from './state';
import { DUR, IntentError, type Ctx, type Fx, type GameState, type MinigameState, type TurnResult } from './types';

const MAX_LAT = 400;

export function startMinigame(s: GameState, ctx: Ctx, card: Card): { state: MinigameState; nextAt: number } {
  const kind = card.minigame ?? 'bomb';
  const players = activePlayers(s);
  const startAt = ctx.now + DUR.mgIntro;
  const mg: MinigameState = { kind, startAt, stage: 'wait', bombs: [], throws: [], fillAt: 0, signaled: false, taps: {} };
  let nextAt = startAt;
  if (kind === 'bomb') {
    const n = (card.tags ?? []).includes('cift') && players.length >= 3 ? 2 : 1;
    const holders = ctx.rng.shuffle(players.map((p) => p.id)).slice(0, n);
    for (const h of holders) {
      const explodeAt = startAt + DUR.bombMin + ctx.rng.int(DUR.bombMax - DUR.bombMin);
      mg.bombs.push({ holder: h, explodeAt, exploded: false });
    }
  } else if (kind === 'reflex') {
    mg.fillAt = startAt + DUR.reflexMin + ctx.rng.int(DUR.reflexMax - DUR.reflexMin);
  }
  return { state: mg, nextAt };
}

// Zamanlayıcı: aşama geçişleri ve bitiş. Bir sonraki zamanlayıcı anını döndürür (null = bitti)
export function tickMinigame(s: GameState, ctx: Ctx, fx: Fx[]): number | null {
  const mg = s.game!.turn!.mg!;
  if (mg.stage === 'wait') {
    mg.stage = 'live';
    fx.push({ kind: 'mgLive', payload: { kind: mg.kind } });
    if (mg.kind === 'bomb') return nextBombCheck(mg);
    if (mg.kind === 'reflex') return mg.fillAt; // bardak dolunca 'filled' fx
    return mg.startAt + DUR.countdownMax;
  }
  if (mg.kind === 'bomb') {
    // Gecikme payı dolduktan sonra patlat: patlamadan önce yapılmış atışlar geçerli
    for (const b of mg.bombs) if (!b.exploded && ctx.now >= b.explodeAt + DUR.netGrace) {
      b.exploded = true;
      b.holder = holderAt(mg, mg.bombs.indexOf(b), b.explodeAt);
      fx.push({ kind: 'boom', payload: { holder: b.holder } });
    }
    if (mg.bombs.every((b) => b.exploded)) return done(mg);
    return nextBombCheck(mg);
  }
  if (mg.kind === 'reflex') {
    if (!mg.signaled) {
      mg.signaled = true; // bardak doldu: işaret herkese gider
      fx.push({ kind: 'filled' });
      return mg.fillAt + DUR.reflexWindow;
    }
    return done(mg);
  }
  return done(mg);
}

function done(mg: MinigameState): null {
  mg.stage = 'done';
  return null;
}

function nextBombCheck(mg: MinigameState): number {
  return Math.min(...mg.bombs.filter((b) => !b.exploded).map((b) => b.explodeAt + DUR.netGrace));
}

// Belirli bir anda bombanın kimde olduğu (o andan önceki atışlara göre)
function holderAt(mg: MinigameState, bomb: number, at: number): string {
  const first = mg.throws.find((t) => t.bomb === bomb);
  let h = first ? first.from : mg.bombs[bomb]!.holder;
  for (const t of mg.throws) if (t.bomb === bomb && t.at <= at) h = t.to;
  return h;
}

export function currentHolder(mg: MinigameState, bomb: number): string {
  const b = mg.bombs[bomb]!;
  if (b.exploded) return b.holder;
  const last = [...mg.throws].reverse().find((t) => t.bomb === bomb);
  return last ? last.to : b.holder;
}

export function minigameInput(
  s: GameState, ctx: Ctx, fx: Fx[], by: string, action: 'tap' | 'throw', bomb = 0, arrivedAt?: number, latency?: number,
): boolean {
  const t = s.game?.turn;
  const mg = t?.mg;
  if (!mg || s.phase !== 'action') throw new IntentError('BAD_PHASE', 'Şu an mini oyun yok.');
  if (mg.stage !== 'live') throw new IntentError('NOT_LIVE', 'Henüz değil!');
  const p = getPlayer(s, by);
  if (!p || p.left) throw new IntentError('NO_SEAT', 'Masada değilsin.');
  const lat = Math.max(0, Math.min(MAX_LAT, latency ?? 0));
  const at = (arrivedAt ?? ctx.now) - lat; // dokunmanın istemcideki anı (sunucu saatine çevrilmiş)

  if (mg.kind === 'bomb') {
    if (action !== 'throw') throw new IntentError('BAD_INPUT', 'Bombayı at!');
    const b = mg.bombs[bomb];
    if (!b || b.exploded) throw new IntentError('BAD_INPUT', 'Bu bomba patladı.');
    if (currentHolder(mg, bomb) !== by) throw new IntentError('NOT_YOURS', 'Bomba sende değil.');
    if (at > b.explodeAt) throw new IntentError('TOO_LATE', 'Geç kaldın!');
    // Dokunan bombayı rastgele birine atar (başka bombayı tutmayan biri tercih edilir)
    const others = activePlayers(s).filter((x) => x.id !== by);
    const free = others.filter((x) => !mg.bombs.some((bb, i) => i !== bomb && !bb.exploded && currentHolder(mg, i) === x.id));
    const to = ctx.rng.pick(free.length ? free : others).id;
    mg.throws.push({ bomb, from: by, to, at: Math.max(at, mg.throws.at(-1)?.at ?? 0) });
    fx.push({ kind: 'bombThrow', payload: { bomb, from: by, to } });
    return false;
  }
  if (action !== 'tap') throw new IntentError('BAD_INPUT', 'Dokun!');
  if (mg.taps[by] !== undefined) throw new IntentError('ALREADY', 'Zaten dokundun.');
  // İşaretin istemciye varışı da lat kadar gecikir: tepki = (varış - lat) - (işaret + lat)
  const signal = mg.kind === 'reflex' ? mg.fillAt : mg.startAt;
  mg.taps[by] = at - lat - signal;
  fx.push({ kind: 'inputIn', payload: { playerId: by } });
  const players = activePlayers(s).map((x) => x.id);
  return players.every((id) => mg.taps[id] !== undefined);
}

// Sonuç: kimler öder?
export function scoreMinigame(s: GameState, mg: MinigameState, result: TurnResult): string[] {
  const players = activePlayers(s).map((p) => p.id);
  const times: Record<string, number | null> = {};
  let losers: string[] = [];
  const early: string[] = [];
  if (mg.kind === 'bomb') {
    losers = [...new Set(mg.bombs.map((b) => b.holder))];
  } else if (mg.kind === 'reflex') {
    // Erken dokunan da en geç dokunan da öder; hiç dokunmayan en geç sayılır
    for (const id of players) {
      const v = mg.taps[id];
      times[id] = v === undefined ? null : Math.round(v);
      if (v !== undefined && v < 0) early.push(id);
    }
    const ontime = players.filter((id) => mg.taps[id] !== undefined && mg.taps[id]! >= 0);
    const missing = players.filter((id) => mg.taps[id] === undefined);
    let late: string[] = missing;
    if (!late.length && ontime.length) {
      const worst = Math.max(...ontime.map((id) => mg.taps[id]!));
      late = ontime.filter((id) => mg.taps[id] === worst);
    }
    losers = [...new Set([...early, ...late])];
  } else {
    // 10'a en uzak kalan öder; dokunmayan en uzak sayılır
    let worst = -1;
    for (const id of players) {
      const v = mg.taps[id];
      times[id] = v === undefined ? null : Math.round(v);
      const d = v === undefined ? Infinity : Math.abs(v - DUR.countdownTarget);
      if (d > worst) {
        worst = d;
        losers = [id];
      } else if (d === worst) losers.push(id);
    }
  }
  result.mg = { kind: mg.kind, times, early, losers };
  return losers;
}
