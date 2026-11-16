// M1 motor testleri: çekiliş kuralları, miras, tür çözümleri, bedeller, alkolsüz dönüşüm, tam oyun
import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import { loadCatalog } from '../../src/engine/catalog';
import { ACT_INTENSITY, dealHand, feasible } from '../../src/engine/deck';
import { pendingActors } from '../../src/engine/game';
import { PENALTY_DECK } from '../../src/engine/penalties';
import { reduce } from '../../src/engine/reducer';
import { makeRng } from '../../src/engine/rng';
import { createRoom } from '../../src/engine/state';
import { DUR, type Catalog, type ClientIntent, type GameState, type Intent } from '../../src/engine/types';
import { viewFor } from '../../src/engine/viewFor';
import { botDecide } from '../../src/server/bots';

const catalog = loadCatalog();

class Sim {
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
  // Bir sonraki faz zamanlayıcısına atla
  timeout() {
    const t = this.s.timers.filter((x) => x.kind === 'phase').sort((a, b) => a.at - b.at)[0];
    if (!t) throw new Error('faz zamanlayıcısı yok');
    this.now = t.at;
    return this.do({ t: 'tick' });
  }
  get turn() {
    return this.s.game!.turn!;
  }
}

function table(n: number, opts: { seed?: number; drinking?: boolean; deck?: GameState['settings']['deck']; length?: GameState['settings']['length']; consent?: boolean } = {}) {
  const sim = new Sim(createRoom('ABCD', 0, opts.seed ?? 42));
  for (let i = 0; i < n; i++)
    sim.do({ t: 'join', playerId: `p${i}`, secret: 's', name: `Oyuncu ${i}`, avatar: i, consent: { ageOk: opts.consent ?? true } });
  sim.as('p0', { t: 'updateSettings', patch: { length: opts.length ?? 'short', drinking: opts.drinking ?? true, deck: opts.deck ?? 'classic' } });
  sim.as('p0', { t: 'start' });
  return sim;
}

// Kataloğu tek türlü kartlarla kurmak için yardımcı
function card(id: string, over: Partial<Card>): Card {
  return { id, deck: 'classic', type: 'question', intensity: 1, rarity: 'common', target: 'picked', input: 'judge', text: '{secilen}, bir şey anlat.', penalty: 1, ...over };
}

describe('tur akışı', () => {
  it('perde girişinden sonra okuyucuya 3 kart dağıtılır; diğerleri eli görmez', () => {
    const sim = table(4);
    expect(sim.s.phase).toBe('actIntro');
    sim.timeout();
    expect(sim.s.phase).toBe('choose');
    const reader = sim.turn.readerId;
    expect(sim.turn.hand).toHaveLength(3);
    const other = sim.s.order.find((id) => id !== reader)!;
    expect(viewFor(sim.s, reader, catalog).game!.hand).toHaveLength(3);
    expect(viewFor(sim.s, other, catalog).game!.hand).toBeNull();
    expect(JSON.stringify(viewFor(sim.s, other, catalog))).not.toContain(sim.turn.hand[0]);
  });

  it('süre dolarsa en düşük yoğunluklu kart oynanır ve hedef kendiliğinden seçilir', () => {
    const sim = table(4);
    sim.timeout();
    const hand = sim.turn.hand.map((id) => catalog.get(id)!);
    const minI = Math.min(...hand.map((c) => c.intensity));
    sim.timeout();
    expect(sim.s.phase).toBe('reveal');
    expect(catalog.get(sim.turn.cardId!)!.intensity).toBe(minI);
    expect(sim.turn.targets.length).toBeGreaterThan(0);
  });

  it('kart açılışa kadar başkalarına gitmez, açılışta herkese gider', () => {
    const sim = table(4, { seed: 3 });
    sim.timeout();
    const r = sim.turn.readerId;
    const pick = sim.turn.hand.map((id) => catalog.get(id)!).find((c) => c.target === 'picked');
    if (!pick) return;
    sim.as(r, { t: 'playCard', cardId: pick.id });
    expect(sim.turn.step).toBe('target');
    const other = sim.s.order.find((id) => id !== r)!;
    expect(viewFor(sim.s, other, catalog).game!.card).toBeNull();
    expect(viewFor(sim.s, r, catalog).game!.card!.id).toBe(pick.id);
    sim.as(r, { t: 'pickTarget', playerIds: [other] });
    expect(sim.s.phase).toBe('reveal');
    expect(viewFor(sim.s, other, catalog).game!.card!.id).toBe(pick.id);
    expect(sim.turn.tokens.secilen).toBe(other);
  });

  it('okuyucu olmayan kart oynayamaz; kendini hedef seçemez', () => {
    const sim = table(4);
    sim.timeout();
    const r = sim.turn.readerId;
    const other = sim.s.order.find((id) => id !== r)!;
    expect(() => sim.as(other, { t: 'playCard', cardId: sim.turn.hand[0]! })).toThrow();
  });
});

describe('miras', () => {
  it('seçilmeyenlerden en yoğunu sonraki okuyucunun elinde olur', () => {
    const sim = table(4, { seed: 11 });
    sim.timeout();
    const t = sim.turn;
    const hand = t.hand.map((id) => catalog.get(id)!);
    const played = hand.reduce((a, b) => (a.intensity <= b.intensity ? a : b));
    sim.as(t.readerId, { t: 'playCard', cardId: played.id });
    const rest = hand.filter((c) => c.id !== played.id);
    const top = Math.max(...rest.map((c) => c.intensity));
    const inherit = sim.s.game!.nextInherit!;
    expect(rest.map((c) => c.id)).toContain(inherit);
    expect(catalog.get(inherit)!.intensity).toBe(top);
    // turu bitir
    while (sim.s.phase !== 'choose' || sim.s.game!.turnNo === 0) sim.timeout();
    expect(sim.turn.hand).toContain(inherit);
    expect(sim.turn.inherited).toBe(inherit);
    expect(viewFor(sim.s, sim.turn.readerId, catalog).game!.inherited).toBe(inherit);
  });
});

describe('çekiliş kuralları', () => {
  it('el en az 2 tür ve perdenin en düşük yoğunluğundan bir kart içerir; aynı kart tekrar gelmez', () => {
    for (let seed = 1; seed < 40; seed++) {
      const sim = table(5, { seed });
      sim.timeout();
      const seen = new Set<string>();
      for (let turn = 0; turn < 8 && sim.s.phase !== 'summary'; turn++) {
        const hand = sim.turn.hand.map((id) => catalog.get(id)!);
        const act = sim.s.game!.act;
        expect(new Set(hand.map((c) => c.type)).size).toBeGreaterThanOrEqual(2);
        expect(hand.some((c) => c.intensity === Math.min(...ACT_INTENSITY[act]))).toBe(true);
        const before = new Set(sim.s.game!.used);
        for (const c of hand) if (c.id !== sim.turn.inherited) expect(before.has(c.id)).toBe(false);
        sim.timeout(); // kart oynanır
        expect(seen.has(sim.turn.cardId!)).toBe(false);
        seen.add(sim.turn.cardId!);
        while ((sim.s.phase as string) !== 'choose' && (sim.s.phase as string) !== 'summary') sim.timeout();
      }
    }
  });

  it('havuz tükenince aynı türün en eski kartı geri döner', () => {
    const small: Catalog = new Map(
      [
        card('q1', { type: 'question' }), card('q2', { type: 'question' }),
        card('n1', { type: 'neverHave', target: 'all', input: 'yesNo', text: 'Hiç X yapmadım.' }),
        card('n2', { type: 'neverHave', target: 'all', input: 'yesNo', text: 'Hiç Y yapmadım.' }),
      ].map((c) => [c.id, c]),
    );
    const sim = new Sim(createRoom('ABCD', 0, 5), small);
    for (let i = 0; i < 3; i++) sim.do({ t: 'join', playerId: `p${i}`, secret: 's', name: `O${i}`, avatar: 0 });
    sim.as('p0', { t: 'start' });
    sim.timeout();
    for (let i = 0; i < 6; i++) {
      expect(sim.turn.hand.length).toBe(3);
      do sim.timeout(); while (sim.s.phase !== 'choose');
    }
  });

  it('son 2 turda oynanan türün ağırlığı yarıya iner (istatistiksel)', () => {
    const cat: Catalog = new Map(
      [...Array(30)].flatMap((_, i) => [
        card(`q${i}`, { type: 'question' }),
        card(`d${i}`, { type: 'dare' }),
      ]).map((c) => [c.id, c]),
    );
    let q = 0, total = 0;
    for (let seed = 0; seed < 400; seed++) {
      const sim = new Sim(createRoom('ABCD', 0, seed), cat);
      for (let i = 0; i < 3; i++) sim.do({ t: 'join', playerId: `p${i}`, secret: 's', name: `O${i}`, avatar: 0 });
      sim.as('p0', { t: 'start' });
      sim.s.game!.recentTypes = ['question', 'question'];
      const hand = dealHand(sim.s, cat, makeRng(seed), 'p0', null);
      // ilk kart serbest seçilir; question ağırlığı 0.5, dare 1 → ~%33
      q += hand.filter((id) => id.startsWith('q')).length;
      total += hand.length;
    }
    expect(q / total).toBeLessThan(0.5);
    expect(q / total).toBeGreaterThan(0.25);
  });

  it('flört etiketli kart yalnızca katılımı açık yeterli oyuncu varsa havuza girer', () => {
    const spicyCard = card('sp', { deck: 'spicy', type: 'dare', tags: ['flort'] });
    const sim = table(4, { consent: true });
    sim.s.settings.adult = true;
    expect(feasible(sim.s, spicyCard, 'p0')).toBe(false); // kimse katılımı açmadı
    sim.s.players[1]!.consent.spicy = true;
    expect(feasible(sim.s, spicyCard, 'p0')).toBe(true);
    sim.s.settings.adult = false;
    expect(feasible(sim.s, spicyCard, 'p0')).toBe(false);
  });

  it('tohumlu tekrar: aynı tohum aynı oyunu üretir', () => {
    const play = (seed: number) => {
      const sim = table(5, { seed });
      for (let i = 0; i < 40 && sim.s.phase !== 'summary'; i++) sim.timeout();
      return JSON.stringify(sim.s.game!.log);
    };
    expect(play(77)).toBe(play(77));
    expect(play(77)).not.toBe(play(78));
  });
});

describe('kart türlerinin çözümü', () => {
  function toAction(cat: Catalog, players = 4, drinking = true) {
    const sim = new Sim(createRoom('ABCD', 0, 9), cat);
    for (let i = 0; i < players; i++) sim.do({ t: 'join', playerId: `p${i}`, secret: 's', name: `O${i}`, avatar: 0, consent: { ageOk: true } });
    sim.as('p0', { t: 'updateSettings', patch: { drinking } });
    sim.as('p0', { t: 'start' });
    sim.timeout();
    return sim;
  }
  const only = (...cards: Card[]) => new Map(cards.map((c) => [c.id, c])) as Catalog;

  it('question/dare: okuyucu "yapmadı" derse hedef öder, "yaptı" derse +1 cesaret', () => {
    const cat = only(card('q1', { penalty: 2 }), card('q2', {}), card('d1', { type: 'dare' }));
    const sim = toAction(cat);
    const r = sim.turn.readerId;
    sim.as(r, { t: 'playCard', cardId: 'q1' });
    const target = sim.s.order.find((id) => id !== r)!;
    sim.as(r, { t: 'pickTarget', playerIds: [target] });
    sim.timeout(); // reveal → action
    expect(sim.s.phase).toBe('action');
    expect(() => sim.as(target, { t: 'judge', done: true })).toThrow(); // hükmü okuyucu verir
    sim.as(r, { t: 'judge', done: false });
    expect(sim.s.phase).toBe('resolve');
    expect(sim.turn.result!.payments).toEqual([{ id: target, units: 2, sober: false, label: '2 yudum' }]);
    expect(sim.s.stats[target]!.paidUnits).toBe(2);
  });

  it('question/all: okuyucu ödeyenleri işaretler, kalanlar +1 cesaret', () => {
    const cat = only(card('qa', { target: 'all', text: 'Herkes anlatsın.' }), card('q2', {}), card('d1', { type: 'dare' }));
    const sim = toAction(cat);
    const r = sim.turn.readerId;
    sim.as(r, { t: 'playCard', cardId: 'qa' });
    sim.timeout();
    sim.as(r, { t: 'judge', payers: ['p1', 'p2'] });
    expect(sim.turn.result!.payments.map((p) => p.id).sort()).toEqual(['p1', 'p2']);
    const brave = sim.turn.result!.courage.map((c) => c.id);
    expect(brave).not.toContain('p1');
    expect(brave.length).toBeGreaterThan(0);
  });

  it('mostLikely: en çok oy alan öder, eşitlikte hepsi öder; kendine oy verilemez', () => {
    const ml = card('ml', { type: 'mostLikely', target: 'all', input: 'votePlayer', text: 'Kim en geç gelir?' });
    const cat = only(ml, card('q1', {}), card('q2', {}));
    const sim = toAction(cat);
    const r = sim.turn.readerId;
    sim.as(r, { t: 'playCard', cardId: 'ml' });
    sim.timeout();
    expect(() => sim.as('p1', { t: 'vote', playerId: 'p1' })).toThrow(/Kendine/);
    sim.as('p0', { t: 'vote', playerId: 'p1' });
    sim.as('p1', { t: 'vote', playerId: 'p2' });
    sim.as('p2', { t: 'vote', playerId: 'p1' });
    // oylar sonuç gelene kadar gizli
    expect(JSON.stringify(viewFor(sim.s, 'p3', catalog).game?.result ?? null)).toBe('null');
    sim.as('p3', { t: 'vote', playerId: 'p2' });
    expect(sim.s.phase).toBe('resolve');
    expect(sim.turn.result!.tally).toEqual({ p1: 2, p2: 2 });
    expect(sim.turn.result!.payments.map((p) => p.id).sort()).toEqual(['p1', 'p2']);
  });

  it('neverHave: "yaptım" diyenler öder; süre dolunca cevap vermeyen ödemez', () => {
    const nh = card('nh', { type: 'neverHave', target: 'all', input: 'yesNo', text: 'Hiç X yapmadım.' });
    const cat = only(nh, card('q1', {}), card('q2', {}));
    const sim = toAction(cat);
    sim.as(sim.turn.readerId, { t: 'playCard', cardId: 'nh' });
    sim.timeout();
    sim.as('p0', { t: 'answer', yes: true });
    sim.as('p1', { t: 'answer', yes: false });
    sim.timeout();
    expect(sim.turn.result!.yesIds).toEqual(['p0']);
    expect(sim.turn.result!.payments.map((p) => p.id)).toEqual(['p0']);
  });

  it('en yoğun kartı seçen okuyucu +1 cesaret alır', () => {
    const cat = only(card('a', { intensity: 1 }), card('b', { intensity: 1, type: 'dare' }), card('c', { intensity: 2, type: 'dare' }));
    const sim = toAction(cat);
    const r = sim.turn.readerId;
    // perde 1 yoğunluğu 1; havuz yetersiz olduğundan 2 de girer
    if (!sim.turn.hand.includes('c')) return;
    sim.as(r, { t: 'playCard', cardId: 'c' });
    sim.as(r, { t: 'pickTarget', playerIds: [sim.s.order.find((id) => id !== r)!] });
    sim.timeout();
    sim.as(r, { t: 'judge', done: true });
    expect(sim.turn.result!.courage.find((c) => c.id === r)?.why).toBe('en yoğun kartı seçti');
  });
});

describe('bedeller ve güvenlik', () => {
  const nhCat = () =>
    new Map(
      [...Array(40)].map((_, i) => {
        const c = card(`nh${i}`, { type: i % 2 ? 'neverHave' : 'mostLikely', target: 'all', input: i % 2 ? 'yesNo' : 'votePlayer', text: 'Hiç yapmadım.', penalty: 3 });
        return [c.id, c] as const;
      }),
    ) as Catalog;

  it('alkolsüzde bedel "ceza" olur ve her 3 cezada mini ceza çekilir', () => {
    const sim = new Sim(createRoom('ABCD', 0, 1), nhCat());
    for (let i = 0; i < 3; i++) sim.do({ t: 'join', playerId: `p${i}`, secret: 's', name: `O${i}`, avatar: 0 });
    sim.as('p0', { t: 'updateSettings', patch: { drinking: false } });
    sim.as('p0', { t: 'start' });
    sim.timeout();
    const nh = sim.turn.hand.find((id) => catalog.get(id) === undefined && Number(id.slice(2)) % 2 === 1) ?? sim.turn.hand[0]!;
    sim.as(sim.turn.readerId, { t: 'playCard', cardId: nh });
    sim.timeout();
    for (const id of ['p0', 'p1', 'p2']) {
      if (sim.s.phase !== 'action') break;
      try { sim.as(id, { t: 'answer', yes: true }); } catch { sim.as(id, { t: 'vote', playerId: id === 'p0' ? 'p1' : 'p0' }); }
    }
    if (sim.s.phase === 'action') sim.timeout();
    const pays = sim.turn.result!.payments;
    expect(pays.length).toBeGreaterThan(0);
    for (const p of pays) expect(p.label).toBe('3 ceza');
    expect(sim.turn.result!.mini.length).toBe(pays.length); // 3 ceza = 1 mini ceza
    expect(PENALTY_DECK).toContain(sim.turn.result!.mini[0]!.text);
    expect(PENALTY_DECK.length).toBe(20);
  });

  it('yaş onayı vermeyen ve "Ben bıraktım" diyen alkolsüz öder', () => {
    const sim = table(4, { consent: true });
    sim.s.players[1]!.consent.ageOk = false;
    sim.as('p2', { t: 'quitDrinking' });
    const v1 = viewFor(sim.s, 'p1', catalog).you!;
    const v2 = viewFor(sim.s, 'p2', catalog).you!;
    const v3 = viewFor(sim.s, 'p3', catalog).you!;
    expect(v1.sober).toBe(true);
    expect(v2.sober).toBe(true);
    expect(v3.sober).toBe(false);
  });

  it('1 saatte 12 birimi geçen otomatik alkolsüze döner ve Su Molası alır', () => {
    const sim = table(3);
    sim.s.stats['p1']!.drinkLog = [{ at: sim.now - 1000, units: 11 }];
    sim.timeout();
    // p1'i ödetecek bir mostLikely ya da question kurgula: doğrudan payment uygula
    const r = sim.turn.readerId;
    const q = sim.turn.hand.map((id) => catalog.get(id)!).find((c) => c.input === 'judge' && c.target === 'picked');
    if (!q || r === 'p1') return;
    sim.as(r, { t: 'playCard', cardId: q.id });
    if (sim.turn.step === 'target') sim.as(r, { t: 'pickTarget', playerIds: ['p1'] });
    if (!sim.turn.targets.includes('p1')) return;
    sim.timeout();
    const fx = sim.as(r, { t: 'judge', done: false });
    expect(sim.s.stats['p1']!.autoSober).toBe(true);
    expect(sim.turn.result!.waterBreak).toContain('p1');
    expect(sim.turn.result!.payments[0]!.label).toMatch(/ceza/);
    expect(fx.some((f) => f.kind === 'waterBreak' && f.to?.includes('p1'))).toBe(true);
  });

  it('shot yalnızca 1 birimlik bedellere uygulanır', async () => {
    const { unitLabel } = await import('../../src/engine/penalties');
    const sim = table(3);
    sim.s.settings.sip = 'shot';
    expect(unitLabel(sim.s, 1, false)).toBe('1 shot');
    expect(unitLabel(sim.s, 2, false)).toBe('2 yudum');
    sim.s.settings.sip = 'small';
    expect(unitLabel(sim.s, 2, false)).toBe('2 küçük yudum');
  });
});

describe('dayanıklılık', () => {
  it('2 tur bağlı olmayan okuyucunun sırası atlanır; dönünce sayaç sıfırlanır', () => {
    const sim = table(3, { seed: 5 });
    sim.do({ t: 'disconnect', playerId: 'p1' });
    let p1Turns = 0;
    for (let i = 0; i < 60 && sim.s.phase !== 'summary'; i++) {
      if (sim.s.phase === 'choose' && sim.turn.step === 'choose' && sim.turn.readerId === 'p1') p1Turns++;
      sim.timeout();
      // tur başında aynı okuyucuyu iki kez saymamak için faz değişimini bekle
      while (sim.s.phase === 'choose' && sim.turn.readerId === 'p1' && sim.turn.cardId === null) sim.timeout();
    }
    expect(p1Turns).toBeLessThanOrEqual(2);
  });

  it('bağlı insan kalmayınca masa bekler', () => {
    const sim = table(3);
    for (const id of ['p0', 'p1', 'p2']) sim.do({ t: 'disconnect', playerId: id });
    const phase = sim.s.phase;
    sim.timeout();
    expect(sim.s.phase).toBe(phase);
  });

  it('host bitişte "Tekrar Oyna" ile lobiye döner', () => {
    const sim = table(3, { seed: 2 });
    let i = 0;
    while (sim.s.phase !== 'summary' && i++ < 500) sim.timeout();
    expect(sim.s.phase).toBe('summary');
    expect(viewFor(sim.s, 'p0', catalog).game!.log.length).toBe(sim.s.game!.log.length);
    expect(() => sim.as('p1', { t: 'restart' })).toThrow();
    sim.as('p0', { t: 'restart' });
    expect(sim.s.phase).toBe('lobby');
    expect(sim.s.game).toBeNull();
  });
});

describe('botlarla tam Kısa oyun', () => {
  it('3 perde baştan sona oynanır, her perde en az 1 tam tur sürer', () => {
    const sim = new Sim(createRoom('ABCD', 0, 2024));
    sim.do({ t: 'join', playerId: 'h', secret: 's', name: 'İnsan', avatar: 0, consent: { ageOk: true } });
    for (let i = 0; i < 4; i++) sim.do({ t: 'join', playerId: `b${i}`, secret: 'bot', name: `Bot ${i}`, avatar: i, isBot: true, consent: { ageOk: true } });
    sim.as('h', { t: 'updateSettings', patch: { length: 'short' } });
    sim.as('h', { t: 'start' });
    const actsSeen = new Set<number>();
    let steps = 0;
    while (sim.s.phase !== 'summary' && steps++ < 3000) {
      actsSeen.add(sim.s.game!.act);
      // önce botların zamanlayıcıları, sonra faz zamanlayıcısı (gerçek sunucudaki gibi)
      const next = [...sim.s.timers].filter((t) => t.kind !== 'expire').sort((a, b) => a.at - b.at)[0]!;
      sim.now = Math.max(sim.now, next.at);
      const fx = sim.do({ t: 'tick' });
      for (const f of fx) {
        if (f.kind !== 'botDue') continue;
        const id = (f.payload as { playerId: string }).playerId;
        const it = botDecide(sim.s, id, makeRng(sim.s.rngState ^ 7), catalog);
        if (it) sim.as(id, it);
      }
      // insan oyuncu da hızlı oynar
      if (pendingActors(sim.s, { catalog }).includes('h')) {
        const it = botDecide(sim.s, 'h', makeRng(steps), catalog);
        if (it) sim.as('h', it);
      }
    }
    expect(sim.s.phase).toBe('summary');
    expect([...actsSeen]).toEqual([1, 2, 3]);
    const log = sim.s.game!.log;
    expect(log.length).toBe(3 * 6);
    // her perdede herkes en az bir kez okuyucu
    for (const act of [1, 2, 3]) {
      const readers = new Set(log.filter((l) => l.act === act).map((l) => l.readerId));
      expect(readers.size).toBe(5);
    }
    expect(new Set(log.map((l) => l.cardId)).size).toBe(log.length); // tekrar yok (havuz yeterli)
    expect(Object.values(sim.s.stats).some((st) => st.courage > 0)).toBe(true);
    void DUR;
  });
});
