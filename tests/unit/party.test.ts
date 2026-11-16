// Rahat tempo, host ilerletmesi, Yalan Makinesi, Ölçek, Gizli Görev, Anlat Bakalım
import { describe, expect, it } from 'vitest';
import { createRoom } from '../../src/engine/state';
import { viewFor } from '../../src/engine/viewFor';
import { card, only, playForce, Sim } from './sim';

function relaxed(cat: ReturnType<typeof only>, players = 4) {
  const sim = new Sim(createRoom('ABCD', 0, 7), cat);
  for (let i = 0; i < players; i++) sim.do({ t: 'join', playerId: `p${i}`, secret: 's', name: `O${i}`, avatar: 0, consent: { ageOk: true } });
  sim.as('p0', { t: 'start' }); // varsayılan tempo: rahat
  sim.timeout(); // perde girişi animasyonu yine sürelidir
  return sim;
}

function timed(cat: ReturnType<typeof only>, players = 4) {
  const sim = new Sim(createRoom('ABCD', 0, 7), cat);
  for (let i = 0; i < players; i++) sim.do({ t: 'join', playerId: `p${i}`, secret: 's', name: `O${i}`, avatar: 0, consent: { ageOk: true } });
  sim.as('p0', { t: 'updateSettings', patch: { pace: 'timed' } });
  sim.as('p0', { t: 'start' });
  sim.timeout();
  return sim;
}

const phaseTimer = (sim: Sim) => sim.s.timers.find((t) => t.kind === 'phase');

describe('rahat tempo', () => {
  const cat = only(card('q', { type: 'question' }), card('q2', { type: 'question', text: '{secilen}, başka bir şey.' }));

  it('kart seçimi, hüküm ve sonuç süresizdir; host ilerletir', () => {
    const sim = relaxed(cat);
    expect(sim.s.settings.pace).toBe('relaxed');
    expect(sim.s.phase).toBe('choose');
    expect(phaseTimer(sim)).toBeUndefined();
    expect(viewFor(sim.s, 'p1', cat).game!.phaseEndsAt).toBeNull();
    playForce(sim, sim.turn.hand[0]!);
    expect(sim.s.phase).toBe('reveal');
    sim.timeout(); // açılış animasyonu
    expect(sim.s.phase).toBe('action');
    expect(phaseTimer(sim)).toBeUndefined();
    sim.as(sim.turn.readerId, { t: 'judge', done: false });
    expect(sim.s.phase).toBe('resolve');
    expect(phaseTimer(sim)).toBeUndefined();
    // 10 dakika geçse de masa bekler
    sim.advance(600_000);
    expect(sim.s.phase).toBe('resolve');
    // host olmayan ilerletemez
    expect(() => sim.as('p1', { t: 'advance' })).toThrow();
    sim.as('p0', { t: 'advance' });
    expect(sim.s.phase).toBe('choose');
  });

  it('host bekleyenleri beklemeden geçebilir (oylama eksik kalır)', () => {
    const vc = only(card('v', { type: 'mostLikely', target: 'all', input: 'votePlayer', text: 'Kim en çok uyur?' }), card('v2', { type: 'mostLikely', target: 'all', input: 'votePlayer', text: 'Kim geç kalır?' }));
    const sim = relaxed(vc);
    playForce(sim, sim.turn.hand[0]!);
    sim.timeout();
    sim.as('p1', { t: 'vote', playerId: 'p2' });
    expect(sim.s.phase).toBe('action');
    sim.as('p0', { t: 'advance' });
    expect(sim.s.phase).toBe('resolve');
    expect(sim.turn.result!.payments.map((p) => p.id)).toEqual(['p2']);
  });

  it('host bağlı değilse masadaki herhangi biri ilerletebilir', () => {
    const sim = relaxed(cat);
    sim.do({ t: 'disconnect', playerId: 'p0' });
    sim.as('p2', { t: 'advance' }); // okuyucu yerine en hafif kart oynanır
    expect(sim.s.phase).toBe('reveal');
  });

  it('süreli tempoda fazlar kendiliğinden geçer, host yine erken geçebilir', () => {
    const sim = timed(cat);
    expect(phaseTimer(sim)).toBeDefined();
    playForce(sim, sim.turn.hand[0]!);
    sim.timeout();
    sim.as(sim.turn.readerId, { t: 'judge', done: true });
    expect(phaseTimer(sim)).toBeDefined();
    sim.as('p0', { t: 'advance' });
    expect(sim.s.phase).toBe('choose');
  });

  it('mini oyun rahat tempoda da sürelidir ve ilerletilemez', () => {
    const mg = only(card('mg', { type: 'minigame', target: 'all', input: 'minigame', minigame: 'countdown', text: 'İçinden 10 say.' }), card('mg2', { type: 'minigame', target: 'all', input: 'minigame', minigame: 'countdown', text: 'İçinden 10 say, yine.' }));
    const sim = relaxed(mg);
    playForce(sim, 'mg');
    sim.timeout();
    expect(sim.s.phase).toBe('action');
    expect(phaseTimer(sim)).toBeDefined();
    expect(() => sim.as('p0', { t: 'advance' })).toThrow();
  });
});

describe('Yalan Makinesi', () => {
  const lie = card('lie', { type: 'mirror', input: 'choice', choices: ['1. söz', '2. söz', '3. söz'], tags: ['yalan'], text: '{secilen}: 2 doğru 1 yalan.' });
  const cat = only(lie, card('q', { type: 'question' }));

  function setup() {
    const sim = timed(cat);
    const reader = sim.turn.readerId;
    const target = sim.s.order.find((id) => id !== reader)!;
    playForce(sim, 'lie', [target]);
    sim.timeout();
    return { sim, target, others: sim.s.order.filter((id) => id !== target) };
  }

  it('yalanı bulamayan içer', () => {
    const { sim, target, others } = setup();
    sim.as(target, { t: 'choose', index: 2 });
    sim.as(others[0]!, { t: 'choose', index: 2 });
    sim.as(others[1]!, { t: 'choose', index: 0 });
    sim.as(others[2]!, { t: 'choose', index: 1 });
    const r = sim.turn.result!;
    expect(r.payments.map((p) => p.id).sort()).toEqual([others[1], others[2]].sort());
    expect(r.guesses![others[1]!]).toBe(0);
  });

  it('herkes bulursa yalancı içer', () => {
    const { sim, target, others } = setup();
    sim.as(target, { t: 'choose', index: 1 });
    for (const id of others) sim.as(id, { t: 'choose', index: 1 });
    expect(sim.turn.result!.payments.map((p) => p.id)).toEqual([target]);
  });
});

describe('Ölçek', () => {
  const scale = card('sc', { type: 'mirror', input: 'choice', choices: '$scale', tags: ['olcek'], text: '{secilen}, 10 üzerinden ne kadar kıskançsın?' });
  const cat = only(scale, card('q', { type: 'question' }));

  it('1–10 seçenek; en uzak tahmin içer, tam bilen olursa hedef de içer', () => {
    const sim = timed(cat);
    const reader = sim.turn.readerId;
    const target = sim.s.order.find((id) => id !== reader)!;
    playForce(sim, 'sc', [target]);
    expect(sim.turn.options).toHaveLength(10);
    sim.timeout();
    const others = sim.s.order.filter((id) => id !== target);
    sim.as(target, { t: 'choose', index: 6 }); // 7
    sim.as(others[0]!, { t: 'choose', index: 6 }); // tam
    sim.as(others[1]!, { t: 'choose', index: 0 }); // en uzak
    sim.as(others[2]!, { t: 'choose', index: 4 });
    expect(sim.turn.result!.payments.map((p) => p.id).sort()).toEqual([others[1], target].sort());
  });
});

describe('Gizli Görev', () => {
  const mission = card('mi', {
    type: 'mission', target: 'random', input: 'catch', duration: 3, penalty: 2,
    text: 'Gizli Görev: Biri bir şeyler çeviriyor.', secret: 'Birine üç kez "aslında" dedir.|Birine tuz uzattır.',
  });
  const cat = only(mission, card('q', { type: 'question' }), card('q2', { type: 'question', text: '{secilen}, yine anlat.' }));

  function setup() {
    const sim = timed(cat);
    playForce(sim, 'mi');
    sim.timeout(); // açılış -> çözüm (girdi yok)
    const e = sim.s.game!.effects.find((x) => x.kind === 'mission')!;
    return { sim, e, agent: e.targetId! };
  }

  it('ajan ve görev yalnızca ajana görünür; kartın gizli listesi kimseye gitmez', () => {
    const { sim, e, agent } = setup();
    expect(e.secret).toBeTruthy();
    const other = sim.s.order.find((id) => id !== agent)!;
    const ov = viewFor(sim.s, other, cat);
    const av = viewFor(sim.s, agent, cat);
    expect(JSON.stringify(ov)).not.toContain(e.secret!);
    expect(ov.game!.effects[0]!.targetId).toBeUndefined();
    expect(ov.game!.targets).toEqual([]);
    expect(av.game!.effects[0]!.secret).toBe(e.secret);
    expect(JSON.stringify(viewFor(sim.s, null, cat))).not.toContain('tuz uzattır');
    expect(sim.s.stats[agent]!.targeted).toBe(0);
  });

  it('doğru tahmin: ajan içer, görev biter; yanlış tahmin: suçlayan içer', () => {
    const { sim, e, agent } = setup();
    const [a, b] = sim.s.order.filter((id) => id !== agent);
    sim.as(a!, { t: 'catch', effectId: e.id, accused: b! });
    expect(sim.s.game!.lastCatch!.guilty).toBe(false);
    expect(sim.s.game!.lastCatch!.payments[0]!.id).toBe(a);
    expect(sim.s.game!.effects.some((x) => x.id === e.id)).toBe(true);
    sim.as(b!, { t: 'catch', effectId: e.id, accused: agent });
    const lc = sim.s.game!.lastCatch!;
    expect(lc.guilty).toBe(true);
    expect(lc.payments[0]).toMatchObject({ id: agent, units: 2 });
    expect(lc.missionText).toBe(e.secret);
    expect(sim.s.game!.effects.some((x) => x.id === e.id)).toBe(false);
  });

  it('ajan "yaptım" der, masa onaylarsa herkes içer', () => {
    const { sim, e, agent } = setup();
    const others = sim.s.order.filter((id) => id !== agent);
    expect(() => sim.as(others[0]!, { t: 'missionDone', effectId: e.id })).toThrow();
    sim.as(agent, { t: 'missionDone', effectId: e.id });
    expect(viewFor(sim.s, others[0]!, cat).game!.catchVote!.missionText).toBe(e.secret);
    for (const id of others) sim.as(id, { t: 'catchVote', yes: true });
    const lc = sim.s.game!.lastCatch!;
    expect(lc.mode).toBe('mission');
    expect(lc.payments.map((p) => p.id).sort()).toEqual([...others].sort());
  });

  it('süre dolarsa ajan içer', () => {
    const { sim, agent } = setup();
    for (let i = 0; i < 12 && sim.s.game!.effects.some((x) => x.kind === 'mission'); i++) sim.timeout();
    const lc = sim.s.game!.lastCatch!;
    expect(lc.mode).toBe('missionFail');
    expect(lc.payments[0]!.id).toBe(agent);
  });
});

describe('Anlat Bakalım (gizli kelime)', () => {
  const dare = card('an', { type: 'dare', target: 'picked', tags: ['anlat'], timer: 60, text: '{secilen}, ekrandaki kelimeyi anlat.', secret: 'Kayınvalide|Tapu' });
  const cat = only(dare, card('q', { type: 'question' }));

  it('kelime yalnızca hedefin telefonuna gider', () => {
    const sim = timed(cat);
    const reader = sim.turn.readerId;
    // okuyucunun elindeki kartta bile liste yok
    expect(JSON.stringify(viewFor(sim.s, reader, cat))).not.toContain('Kayınvalide');
    const target = sim.s.order.find((id) => id !== reader)!;
    playForce(sim, 'an', [target]);
    sim.timeout();
    const word = sim.turn.secret!;
    expect(['Kayınvalide', 'Tapu']).toContain(word);
    expect(viewFor(sim.s, target, cat).game!.secret).toBe(word);
    expect(viewFor(sim.s, reader, cat).game!.secret).toBeNull();
    expect(JSON.stringify(viewFor(sim.s, reader, cat))).not.toContain(word);
  });
});

// Gerçek desteyle, botların kararlarıyla tam oyunlar: her mod, rahat tempoda host ilerleterek sonuna gider
import { botDecide } from '../../src/server/bots';
import { makeRng } from '../../src/engine/rng';
import { catalog } from './sim';
import { MODES } from '../../src/engine/modes';

describe('tam oyun (gerçek kartlar)', () => {
  for (const mode of MODES.filter((m) => m.available)) {
    for (const drinking of [true, false]) {
      it(`${mode.id} · ${drinking ? 'alkollü' : 'alkolsüz'} sonuna kadar oynanır`, () => {
        const sim = new Sim(createRoom('ABCD', 0, mode.id.length * 31 + (drinking ? 1 : 0)), catalog);
        for (let i = 0; i < 5; i++) sim.do({ t: 'join', playerId: `p${i}`, secret: 's', name: `O${i}`, avatar: i, consent: { ageOk: true, spicy: true, contact: i % 2 === 0 } });
        sim.as('p0', { t: 'updateSettings', patch: { deck: mode.id, length: 'short', drinking, adult: true } });
        sim.as('p0', { t: 'start' });
        const rng = makeRng(5);
        const seenTypes = new Set<string>();
        for (let step = 0; step < 4000 && sim.s.phase !== 'summary'; step++) {
          const t = sim.s.game?.turn;
          if (t?.cardId) seenTypes.add(catalog.get(t.cardId)?.type ?? 'sys');
          let acted = false;
          for (const p of sim.s.players) {
            const it = botDecide(sim.s, p.id, rng, catalog);
            if (it) {
              sim.as(p.id, it);
              acted = true;
              break;
            }
          }
          if (acted) continue;
          const timer = sim.s.timers.filter((x) => x.kind === 'phase' || x.kind === 'catch').sort((a, b) => a.at - b.at)[0];
          if (timer) {
            sim.now = Math.max(sim.now, timer.at);
            sim.do({ t: 'tick' });
          } else sim.as(sim.s.hostId!, { t: 'advance' });
        }
        expect(sim.s.phase).toBe('summary');
        expect(seenTypes.size).toBeGreaterThan(3);
      });
    }
  }
});
