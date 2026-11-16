// M3 motor testleri: bomba, refleks, geri sayım, gecikme düzeltmesi
import { describe, expect, it } from 'vitest';
import { currentHolder } from '../../src/engine/minigames';
import { DUR } from '../../src/engine/types';
import { viewFor } from '../../src/engine/viewFor';
import { Sim, card, only, playForce, tableWith } from './sim';

const filler = [card('f1', {}), card('f2', { type: 'dare' })];
const mgCard = (kind: 'bomb' | 'reflex' | 'countdown', extra = {}) =>
  card(`mg-${kind}`, { type: 'minigame', minigame: kind, target: 'all', input: 'minigame', penalty: 2, text: 'Mini oyun!', ...extra });

function toLive(kind: 'bomb' | 'reflex' | 'countdown', extra = {}) {
  const c = mgCard(kind, extra);
  const sim = tableWith(only(c, ...filler), 4);
  playForce(sim, c.id);
  sim.timeout(); // reveal → action (hazırlık)
  expect(sim.turn.mg!.stage).toBe('wait');
  sim.timeout(); // canlı
  expect(sim.turn.mg!.stage).toBe('live');
  return sim;
}
const mg = (sim: Sim) => sim.turn.mg!;
const tap = (sim: Sim, by: string, lat = 0, arrive = sim.now) =>
  sim.as(by, { t: 'minigameInput', action: 'tap', at: arrive, lat } as never);
const toss = (sim: Sim, by: string, bomb = 0, lat = 0, arrive = sim.now) =>
  sim.as(by, { t: 'minigameInput', action: 'throw', bomb, at: arrive, lat } as never);

describe('bomba', () => {
  it('patlama anı gizli; yalnızca elinde tutan atabilir; elinde patlayan öder', () => {
    const sim = toLive('bomb');
    const v = viewFor(sim.s, 'p0', sim.cat).game!;
    expect(JSON.stringify(v)).not.toContain(String(mg(sim).bombs[0]!.explodeAt));
    const h = currentHolder(mg(sim), 0);
    const notH = sim.s.order.find((id) => id !== h)!;
    expect(() => toss(sim, notH)).toThrow(/sende değil/);
    sim.now += 500;
    toss(sim, h);
    const h2 = currentHolder(mg(sim), 0);
    expect(h2).not.toBe(h);
    while (sim.s.phase === 'action') sim.timeout();
    expect(sim.turn.result!.payments.map((p) => p.id)).toEqual([h2]);
  });

  it('gecikme düzeltmesi: patlamadan hemen önce yapılan atış geç varsa da sayılır', () => {
    const sim = toLive('bomb');
    const b = mg(sim).bombs[0]!;
    const h = currentHolder(mg(sim), 0);
    // istemci patlamadan 100 ms önce dokundu, 200 ms gecikmeyle vardı
    sim.now = b.explodeAt + 100;
    toss(sim, h, 0, 200, sim.now);
    const to = currentHolder(mg(sim), 0);
    while (sim.s.phase === 'action') sim.timeout();
    expect(sim.turn.result!.payments.map((p) => p.id)).toEqual([to]);
  });

  it('patlamadan sonra yapılan atış reddedilir', () => {
    const sim = toLive('bomb');
    const b = mg(sim).bombs[0]!;
    const h = currentHolder(mg(sim), 0);
    sim.now = b.explodeAt + 150;
    expect(() => toss(sim, h, 0, 0, sim.now)).toThrow(/Geç/);
  });

  it('çifte bomba: iki bomba, iki ödeyen olabilir', () => {
    const sim = toLive('bomb', { tags: ['cift'] });
    expect(mg(sim).bombs).toHaveLength(2);
    while (sim.s.phase === 'action') sim.timeout();
    expect(sim.turn.result!.payments.length).toBeGreaterThanOrEqual(1);
    expect(sim.turn.result!.mg!.losers.length).toBeGreaterThanOrEqual(1);
  });
});

describe('refleks', () => {
  it('erken dokunan ve en geç dokunan öder; dolma anı gizli', () => {
    const sim = toLive('reflex');
    const fillAt = mg(sim).fillAt;
    expect(JSON.stringify(viewFor(sim.s, 'p1', sim.cat))).not.toContain(String(fillAt));
    sim.now = fillAt - 300;
    tap(sim, 'p0'); // erken
    sim.timeout(); // doldu
    expect(viewFor(sim.s, 'p1', sim.cat).game!.mg!.filled).toBe(true);
    sim.now = fillAt + 300; tap(sim, 'p1');
    sim.now = fillAt + 500; tap(sim, 'p2');
    sim.now = fillAt + 900; tap(sim, 'p3'); // en geç → herkes dokundu, biter
    expect(sim.s.phase).toBe('resolve');
    expect(sim.turn.result!.mg!.early).toEqual(['p0']);
    expect(sim.turn.result!.payments.map((p) => p.id).sort()).toEqual(['p0', 'p3']);
  });

  it('gecikme düzeltmesi: yavaş ağdaki oyuncu haksız yere en geç sayılmaz', () => {
    const sim = toLive('reflex');
    const fillAt = mg(sim).fillAt;
    sim.timeout();
    // p1 hızlı ağ, 400 ms tepki; p2 yavaş ağ (tek yön 200 ms), 250 ms tepki → varış fillAt+200+250+200
    sim.now = fillAt + 400; tap(sim, 'p1', 0);
    sim.now = fillAt + 650; tap(sim, 'p2', 200);
    sim.now = fillAt + 700; tap(sim, 'p0', 0);
    sim.now = fillAt + 450; tap(sim, 'p3', 0);
    const times = sim.turn.result!.mg!.times;
    expect(times['p2']).toBe(250);
    expect(sim.turn.result!.payments.map((p) => p.id)).toEqual(['p0']);
  });

  it('hiç dokunmayan en geç sayılır', () => {
    const sim = toLive('reflex');
    sim.timeout();
    sim.now = mg(sim).fillAt + 300;
    for (const id of ['p0', 'p1', 'p2']) tap(sim, id);
    sim.timeout(); // süre doldu
    expect(sim.turn.result!.payments.map((p) => p.id)).toEqual(['p3']);
  });
});

describe('geri sayım', () => {
  it("10'a en uzak kalan öder", () => {
    const sim = toLive('countdown');
    const start = mg(sim).startAt;
    sim.now = start + 9800; tap(sim, 'p0');
    sim.now = start + 10100; tap(sim, 'p1');
    sim.now = start + 12500; tap(sim, 'p2');
    sim.now = start + 8200; tap(sim, 'p3');
    expect(sim.turn.result!.payments.map((p) => p.id)).toEqual(['p2']);
    expect(sim.turn.result!.mg!.times['p1']).toBe(10100);
  });
  it('erken basılamaz (hazırlık aşaması) ve süre dolunca dokunmayan öder', () => {
    const c = mgCard('countdown');
    const sim = tableWith(only(c, ...filler), 3);
    playForce(sim, c.id);
    sim.timeout();
    expect(() => tap(sim, 'p0')).toThrow(/Henüz/);
    sim.timeout();
    tap(sim, 'p0');
    tap(sim, 'p1');
    sim.now = mg(sim).startAt + DUR.countdownMax;
    sim.timeout();
    expect(sim.turn.result!.payments.map((p) => p.id)).toEqual(['p2']);
  });
});
