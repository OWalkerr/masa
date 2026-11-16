// Test yardımcıları: zamanı elle ilerleten küçük simülatör
import type { Card } from '../../src/engine/cards';
import { loadCatalog } from '../../src/engine/catalog';
import { reduce } from '../../src/engine/reducer';
import { makeRng } from '../../src/engine/rng';
import { createRoom } from '../../src/engine/state';
import type { Catalog, ClientIntent, GameState, Intent } from '../../src/engine/types';

export const catalog = loadCatalog();

export class Sim {
  now = 1000;
  constructor(public s: GameState, public cat: Catalog = catalog) {}
  do(it: Intent) {
    const r = reduce(this.s, it, { now: this.now, rng: makeRng(this.s.rngState), catalog: this.cat });
    this.s = r.state;
    return r.fx;
  }
  as(by: string, it: ClientIntent) {
    return this.do({ ...it, by } as Intent);
  }
  timeout() {
    const t = this.s.timers.filter((x) => x.kind === 'phase').sort((a, b) => a.at - b.at)[0];
    if (!t) throw new Error('faz zamanlayıcısı yok');
    this.now = t.at;
    return this.do({ t: 'tick' });
  }
  advance(ms: number) {
    this.now += ms;
    return this.do({ t: 'tick' });
  }
  get turn() {
    return this.s.game!.turn!;
  }
}

export function card(id: string, over: Partial<Card>): Card {
  return { id, deck: 'classic', type: 'question', intensity: 1, rarity: 'common', target: 'picked', input: 'judge', text: '{secilen}, bir şey anlat.', penalty: 1, ...over };
}

export const only = (...cards: Card[]) => new Map(cards.map((c) => [c.id, c])) as Catalog;

// Belirli kartlarla dolu küçük bir masa; ilk okuyucunun elinde istenen kart olur
export function tableWith(cat: Catalog, players = 4, seed = 9, drinking = true): Sim {
  const sim = new Sim(createRoom('ABCD', 0, seed), cat);
  for (let i = 0; i < players; i++) sim.do({ t: 'join', playerId: `p${i}`, secret: 's', name: `O${i}`, avatar: 0, consent: { ageOk: true } });
  sim.as('p0', { t: 'updateSettings', patch: { drinking } });
  sim.as('p0', { t: 'start' });
  sim.timeout();
  return sim;
}

// Okuyucuya belirli kartı oynat (elde yoksa ele koy)
export function playForce(sim: Sim, cardId: string, targets?: string[]) {
  const t = sim.turn;
  if (!t.hand.includes(cardId)) t.hand[0] = cardId;
  sim.as(t.readerId, { t: 'playCard', cardId });
  if (sim.turn.step === 'target') sim.as(t.readerId, { t: 'pickTarget', playerIds: targets ?? sim.s.order.filter((id) => id !== t.readerId).slice(0, 1) });
}
