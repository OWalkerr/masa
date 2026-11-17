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

  it('aynı adım için ikinci "ilerlet" yok sayılır (çift dokunma bir adım atlatmaz)', () => {
    const sim = relaxed(cat);
    playForce(sim, sim.turn.hand[0]!);
    sim.timeout();
    sim.as(sim.turn.readerId, { t: 'judge', done: true });
    const key = viewFor(sim.s, 'p0', cat).game!.stepKey;
    sim.as('p0', { t: 'advance', at: key });
    expect(sim.s.phase).toBe('choose');
    const turn = sim.s.game!.turnNo;
    expect(() => sim.as('p0', { t: 'advance', at: key })).toThrow();
    expect(sim.s.phase).toBe('choose');
    expect(sim.s.game!.turnNo).toBe(turn);
    expect(sim.turn.cardId).toBeNull();
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
          // Vakti gelen zamanlayıcı önce işler (bomba patladıktan sonra atış olmaz)
          if (sim.s.timers.some((x) => (x.kind === 'phase' || x.kind === 'catch') && x.at <= sim.now)) {
            sim.do({ t: 'tick' });
            continue;
          }
          let acted = false;
          for (const p of sim.s.players) {
            const it = botDecide(sim.s, p.id, rng, catalog);
            if (it) {
              // Sunucu gibi: reddedilen bot hamlesi oyunu bozmaz (ör. patlamadan hemen sonraki atış)
              try { sim.as(p.id, it); } catch { /* reddedildi */ }
              sim.now += 300; // gerçek masada bot hamleleri arasında zaman geçer
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

import { hintOf, judgeGuess, normalizeGuess } from '../../src/engine/sketch';

describe('Karakalem', () => {
  it('tahmin karşılaştırma: Türkçe harf, büyük/küçük, yazım hatası, çok yakın', () => {
    expect(normalizeGuess('Kayınvalide!')).toBe('kayinvalide');
    expect(judgeGuess('Kayınvalide/Kaynana', 'KAYINVALİDE')).toBe('ok');
    expect(judgeGuess('Kayınvalide/Kaynana', 'kaynana')).toBe('ok');
    expect(judgeGuess('Kayınvalide', 'kayınvalde')).toBe('ok'); // tek harf hatası, uzun kelime
    expect(judgeGuess('Rakı', 'raki')).toBe('ok');
    expect(judgeGuess('Rakı', 'rak')).toBe('close');
    expect(judgeGuess('Rakı', 'şarap')).toBe('no');
    expect(judgeGuess('Rakı balık', 'rakıbalık')).toBe('ok');
    expect(hintOf('Rakı balık')).toBe('_ _ _ _   _ _ _ _ _');
  });

  const sk = card('sk', { type: 'sketch', input: 'draw', target: 'picked', text: '{secilen}, ekrandaki kelimeyi çiz.', secret: 'Mezarlık|Vampir', timer: 60 });
  const one = card('sk1', { type: 'sketch', input: 'draw', target: 'picked', tags: ['tekcizgi'], text: '{secilen}, tek çizgiyle çiz.', secret: 'Ay', timer: 30 });
  const cat = only(sk, one, card('q', { type: 'question' }));

  function setup(id = 'sk') {
    const sim = relaxed(cat);
    const reader = sim.turn.readerId;
    const drawer = sim.s.order.find((x) => x !== reader)!;
    playForce(sim, id, [drawer]);
    sim.timeout(); // açılış
    return { sim, drawer, guessers: sim.s.order.filter((x) => x !== drawer) };
  }

  it('kelime yalnızca çizene gider; çizim süresi rahat tempoda da işler', () => {
    const { sim, drawer, guessers } = setup();
    expect(sim.s.phase).toBe('action');
    expect(phaseTimer(sim)).toBeDefined();
    const word = sim.turn.secret!;
    expect(viewFor(sim.s, drawer, cat).game!.sketch!.word).toBe(word);
    const gv = viewFor(sim.s, guessers[0]!, cat);
    expect(gv.game!.sketch!.word).toBeNull();
    expect(JSON.stringify(gv)).not.toContain(word);
    expect(JSON.stringify(viewFor(sim.s, null, cat))).not.toContain(word);
  });

  it('çizgiler eklenir; yalnızca çizen çizer; geçersiz nokta reddedilir', () => {
    const { sim, drawer, guessers } = setup();
    sim.now = sim.turn.sk!.startAt;
    const fx = sim.as(drawer, { t: 'drawSeg', s: [10, 10, 20, 20], n: true });
    expect(fx.find((f) => f.kind === 'draw')!.payload).toMatchObject({ pos: 0, fresh: true });
    sim.as(drawer, { t: 'drawSeg', s: [30, 30] });
    expect(sim.turn.sk!.strokes).toEqual([[10, 10, 20, 20, 30, 30]]);
    expect(() => sim.as(guessers[0]!, { t: 'drawSeg', s: [1, 1], n: true })).toThrow();
    expect(() => sim.as(drawer, { t: 'drawSeg', s: [1, 2, 3] })).toThrow();
    sim.as(drawer, { t: 'drawSeg', s: [5, 5], n: true });
    sim.as(drawer, { t: 'drawUndo' });
    expect(sim.turn.sk!.strokes.length).toBe(1);
  });

  it('tek çizgide ikinci çizgi ve silgi yok', () => {
    const { sim, drawer } = setup('sk1');
    sim.now = sim.turn.sk!.startAt;
    sim.as(drawer, { t: 'drawSeg', s: [1, 1, 2, 2], n: true });
    expect(() => sim.as(drawer, { t: 'drawSeg', s: [5, 5], n: true })).toThrow();
    expect(() => sim.as(drawer, { t: 'drawClear' })).toThrow();
  });

  it('bilemeyenler içer; herkes bilirse tur hemen biter; ilk bilen ve çizen cesaret alır', () => {
    const { sim, drawer, guessers } = setup();
    sim.now = sim.turn.sk!.startAt + 1000;
    const word = sim.turn.secret!;
    const wrong = sim.as(guessers[0]!, { t: 'guess', text: 'patates' });
    expect(wrong.some((f) => f.kind === 'guessWrong')).toBe(true);
    sim.as(guessers[1]!, { t: 'guess', text: word.toUpperCase() });
    expect(() => sim.as(drawer, { t: 'guess', text: word })).toThrow();
    sim.timeout();
    const r = sim.turn.result!;
    expect(r.sketch!.correct).toEqual([guessers[1]]);
    expect(r.payments.map((p) => p.id).sort()).toEqual(guessers.filter((g) => g !== guessers[1]).sort());
    expect(r.courage.find((c) => c.id === drawer)!.pts).toBe(2);
  });

  it('kimse bilemezse çizen içer', () => {
    const { sim, drawer } = setup();
    sim.timeout();
    expect(sim.turn.result!.payments.map((p) => p.id)).toEqual([drawer]);
  });

  it('herkes bilince süre beklenmez', () => {
    const { sim, guessers } = setup();
    sim.now = sim.turn.sk!.startAt + 500;
    for (const g of guessers) sim.as(g, { t: 'guess', text: sim.turn.secret! });
    expect(sim.s.phase).toBe('resolve');
    expect(sim.turn.result!.payments).toEqual([]);
  });
});

describe('Sergi', () => {
  const gal = card('ga', { type: 'gallery', input: 'drawAll', target: 'all', text: 'Sergi: herkes çizsin.', secret: 'Vampir diş hekiminde', timer: 45 });
  const cat = only(gal, card('q', { type: 'question' }));

  function setup() {
    const sim = relaxed(cat);
    playForce(sim, 'ga');
    sim.timeout(); // açılış
    sim.now = sim.turn.gal!.startAt;
    return { sim, ids: sim.s.order };
  }

  it('çizerken kimse başkasının tuvalini görmez; konu herkese açık', () => {
    const { sim, ids } = setup();
    sim.as(ids[0]!, { t: 'drawSeg', s: [100, 100, 200, 200], n: true });
    const fx = sim.as(ids[1]!, { t: 'drawSeg', s: [300, 300, 400, 400], n: true });
    expect(fx.some((f) => f.kind === 'draw')).toBe(false); // canlı yayın yok
    const v0 = viewFor(sim.s, ids[0]!, cat).game!.gallery!;
    expect(v0.prompt).toBe('Vampir diş hekiminde');
    expect(v0.myStrokes).toEqual([[100, 100, 200, 200]]);
    expect(JSON.stringify(viewFor(sim.s, ids[0]!, cat))).not.toContain('300,300');
  });

  it('herkes teslim edince galeri isimsiz açılır; kendi eserine oy yok; en çok oy alan içer', () => {
    const { sim, ids } = setup();
    ids.forEach((id, i) => sim.as(id, { t: 'drawSeg', s: [i * 10, i * 10, i * 10 + 5, i * 10 + 5], n: true }));
    for (const id of ids) sim.as(id, { t: 'galDone' });
    const gl = sim.turn.gal!;
    expect(gl.stage).toBe('vote');
    expect(phaseTimer(sim)).toBeUndefined(); // rahat tempoda oylama süresiz
    const v = viewFor(sim.s, ids[0]!, cat).game!.gallery!;
    expect(v.items).toHaveLength(ids.length);
    expect(JSON.stringify(v)).not.toContain(ids[1]!); // sanatçı adı/kimliği yok
    const victim = gl.order[0]!;
    const victimIdx = 0;
    expect(() => sim.as(victim, { t: 'galVote', index: victimIdx })).toThrow();
    for (const id of ids) sim.as(id, { t: 'galVote', index: id === victim ? 1 : victimIdx });
    const r = sim.turn.result!;
    expect(r.payments.map((p) => p.id)).toEqual([victim]);
    expect(r.gallery!.worst).toEqual([victim]);
    expect(r.gallery!.items.find((x) => x.author === victim)!.votes).toBe(ids.length - 1);
  });

  it('çizim süresi dolunca galeri kendiliğinden açılır', () => {
    const { sim } = setup();
    sim.timeout();
    expect(sim.turn.gal!.stage).toBe('vote');
  });
});

describe('botlar güç kartı kullanır', () => {
  it('cezası gelen bot cebindeki Kalkanı kaldırır; Sabotajlı bot mirası seçer', async () => {
    const { botDecide: decide } = await import('../../src/server/bots');
    const { makeRng: mk } = await import('../../src/engine/rng');
    const vc = only(card('v', { type: 'mostLikely', target: 'all', input: 'votePlayer', text: 'Kim en çok uyur?' }), card('v2', { type: 'mostLikely', target: 'all', input: 'votePlayer', text: 'Kim geç kalır?' }), card('v3', { type: 'question' }));
    const sim = relaxed(vc);
    playForce(sim, sim.turn.hand[0]!);
    sim.timeout();
    for (const id of sim.s.order) sim.as(id, { t: 'vote', playerId: id === 'p2' ? 'p1' : 'p2' });
    expect(sim.turn.result!.payments.map((p) => p.id)).toEqual(['p2']);
    sim.s.stats.p2!.powers = ['shield'];
    sim.s.players.find((p) => p.id === 'p2')!.isBot = true;
    const it = decide(sim.s, 'p2', mk(1), vc);
    expect(it).toEqual({ t: 'usePower', power: 'shield' });
    sim.as('p2', it!);
    expect(sim.turn.result!.payments).toEqual([]);
  });
});

describe('Kazan ve Merhamet', () => {
  const qs = only(card('q1', { type: 'question' }), card('q2', { type: 'question', text: '{secilen}, yine anlat.' }), card('q3', { type: 'question', text: '{secilen}, bir daha anlat.' }));
  function turn(sim: Sim, done: boolean) {
    playForce(sim, sim.turn.hand[0]!);
    sim.timeout();
    sim.as(sim.turn.readerId, { t: 'judge', done });
  }

  it('boş turda kazana yudum düşer; sonraki cezalı kazanı da içer; en fazla 4', () => {
    const sim = relaxed(qs);
    turn(sim, true);
    expect(sim.s.game!.pot).toBe(1);
    expect(sim.turn.result!.potAdd).toBe(1);
    sim.as('p0', { t: 'advance', at: viewFor(sim.s, 'p0', qs).game!.stepKey });
    turn(sim, true);
    expect(sim.s.game!.pot).toBe(2);
    sim.as('p0', { t: 'advance', at: viewFor(sim.s, 'p0', qs).game!.stepKey });
    turn(sim, false);
    const r = sim.turn.result!;
    expect(r.potSpill!.units).toBe(2);
    expect(r.payments[0]!.units).toBe(1 + 2);
    expect(sim.s.game!.pot).toBe(0);
    // üst sınır
    sim.s.game!.pot = 4;
    sim.as('p0', { t: 'advance', at: viewFor(sim.s, 'p0', qs).game!.stepKey });
    turn(sim, true);
    expect(sim.s.game!.pot).toBe(4);
  });

  it('masanın çok üstünde içen perde başına bir kez merhamet Kalkanı alır', () => {
    const sim = relaxed(qs);
    const target = sim.s.order.find((id) => id !== sim.turn.readerId)!;
    sim.s.stats[target]!.paidUnits = 8;
    playForce(sim, sim.turn.hand[0]!, [target]);
    sim.timeout();
    sim.as(sim.turn.readerId, { t: 'judge', done: false });
    expect(sim.turn.result!.mercy).toEqual([target]);
    expect(sim.s.stats[target]!.powers).toContain('shield');
  });
});

describe('Ev Kartları', () => {
  it('lobide yazılır, yazar gizli kalır, oyunda çıkar; güvenlik kuralı uygulanır; kişi başı 3', async () => {
    const { catalog: base } = await import('./sim');
    const sim = new Sim(createRoom('ABCD', 0, 3), base);
    for (let i = 0; i < 4; i++) sim.do({ t: 'join', playerId: `p${i}`, secret: 's', name: `O${i}`, avatar: 0, consent: { ageOk: true } });
    sim.as('p1', { t: 'houseAdd', kind: 'question', text: 'Geçen yaz Bodrum’da gerçekte ne oldu?' });
    sim.as('p1', { t: 'houseAdd', kind: 'mostLikely', text: 'yine tatil planını son dakika iptal eder' });
    sim.as('p1', { t: 'houseAdd', kind: 'neverHave', text: 'bu masadan birinin doğum gününü unutmadım' });
    expect(() => sim.as('p1', { t: 'houseAdd', kind: 'dare', text: 'bir şey daha yazayım dedim' })).toThrow();
    expect(() => sim.as('p2', { t: 'houseAdd', kind: 'dare', text: 'Hemen sokağa çık ve bağır' })).toThrow();
    const cards = sim.s.houseCards!.map((h) => h.card);
    expect(cards.map((c) => c.text)).toEqual([
      '{secilen}, geçen yaz Bodrum’da gerçekte ne oldu?',
      'Kim yine tatil planını son dakika iptal eder?',
      'Hiç bu masadan birinin doğum gününü unutmadım.',
    ]);
    // başkası kendi kartlarını görmez, sayı görünür; yazar kimliği hiçbir görünümde yok
    const v2 = viewFor(sim.s, 'p2', base);
    expect(v2.houseCards.mine).toEqual([]);
    expect(v2.houseCards.total).toBe(3);
    expect(JSON.stringify(v2)).not.toContain('Bodrum');
    expect(viewFor(sim.s, 'p1', base).houseCards.mine).toHaveLength(3);
    // oyunda ev kartları ele gelir
    sim.as('p0', { t: 'updateSettings', patch: { pace: 'timed' } });
    sim.as('p0', { t: 'start' });
    sim.timeout();
    let seen = false;
    for (let i = 0; i < 12 && !seen && sim.s.phase !== 'summary'; i++) {
      if (sim.turn.hand.some((id) => id.startsWith('house-'))) seen = true;
      do sim.timeout(); while ((sim.s.phase as string) !== 'choose' && (sim.s.phase as string) !== 'summary');
    }
    expect(seen).toBe(true);
    expect(() => sim.as('p1', { t: 'houseRemove', id: cards[0]!.id })).toThrow(); // oyun başladı
  });
});

describe('Rövanş ve anılar', () => {
  it('Rövanş skorları toplar, Yeni gece sıfırlar; özet anıları içerir', () => {
    const qs = only(card('q1', { type: 'question' }), card('q2', { type: 'question', text: '{secilen}, yine anlat.' }));
    const sim = relaxed(qs);
    sim.s.stats.p1!.paidUnits = 5;
    sim.s.stats.p1!.courage = 3;
    sim.s.phase = 'summary';
    sim.as('p0', { t: 'restart', keep: true });
    expect(sim.s.series!.games).toBe(1);
    expect(sim.s.series!.totals.p1).toEqual({ paid: 5, courage: 3 });
    expect(viewFor(sim.s, 'p2', qs).series!.totals.p1!.paid).toBe(5);
    sim.as('p0', { t: 'start' });
    sim.s.phase = 'summary';
    sim.as('p0', { t: 'restart' });
    expect(sim.s.series).toBeUndefined();
  });
});

describe('kart oylaması', () => {
  it('yalnızca sonuçta oylanır, değiştirilebilir, geri alınabilir; fx sayaç farkını taşır', () => {
    const qs = only(card('q1', { type: 'question' }), card('q2', { type: 'question', text: '{secilen}, yine anlat.' }));
    const sim = relaxed(qs);
    expect(() => sim.as('p1', { t: 'rate', v: 1 })).toThrow(); // kart seçilirken oylanmaz
    playForce(sim, sim.turn.hand[0]!);
    sim.timeout();
    sim.as(sim.turn.readerId, { t: 'judge', done: true });
    expect(sim.s.phase).toBe('resolve');
    expect(viewFor(sim.s, 'p1', qs).game!.rateable).toBe(true);
    let fx = sim.as('p1', { t: 'rate', v: 1 });
    expect(fx.find((f) => f.kind === 'rated')?.payload).toMatchObject({ prev: 0, v: 1 });
    expect(viewFor(sim.s, 'p1', qs).game!.myRating).toBe(1);
    expect(viewFor(sim.s, 'p2', qs).game!.myRating).toBe(0);
    fx = sim.as('p1', { t: 'rate', v: -1 });
    expect(fx.find((f) => f.kind === 'rated')?.payload).toMatchObject({ prev: 1, v: -1 });
    expect(sim.as('p1', { t: 'rate', v: -1 })).toEqual([]); // aynı oy tekrar sayılmaz
    sim.as('p1', { t: 'rate', v: 0 });
    expect(viewFor(sim.s, 'p1', qs).game!.myRating).toBe(0);
    // oylama oyunu etkilemez: bedeller aynı kalır, host ilerletir
    sim.as('p0', { t: 'advance' });
    expect(sim.s.phase).toBe('choose');
  });
});

describe('Düello Ligi', () => {
  it('ilk perdeden düello gelir, elde en az 2 düello olur, eşleşmeyi sistem adil yapar, lig tablosu tutulur', async () => {
    const { catalog: base } = await import('./sim');
    const sim = new Sim(createRoom('ABCD', 0, 11), base);
    for (let i = 0; i < 5; i++) sim.do({ t: 'join', playerId: `p${i}`, secret: 's', name: `O${i}`, avatar: 0, consent: { ageOk: true } });
    sim.as('p0', { t: 'updateSettings', patch: { deck: 'duel', length: 'short', pace: 'timed' } });
    sim.as('p0', { t: 'start' });
    sim.timeout();
    let hands = 0, duelsInHand = 0, duelsPlayed = 0;
    for (let i = 0; i < 40 && sim.s.phase !== 'summary'; i++) {
      if (sim.s.phase === 'choose' && sim.turn.step === 'choose' && !sim.turn.system) {
        hands++;
        const types = sim.turn.hand.map((id) => base.get(id)!.type);
        duelsInHand += types.filter((t) => t === 'duel').length >= 2 ? 1 : 0;
        const duel = sim.turn.hand.find((id) => base.get(id)!.type === 'duel');
        if (duel) {
          sim.as(sim.turn.readerId, { t: 'playCard', cardId: duel });
          // eşleşmeyi sistem yaptı: hedef seçme adımı yok, okuyucu düelloda değil
          expect(sim.turn.step).toBe('choose');
          expect(sim.turn.targets).toHaveLength(2);
          expect(sim.turn.targets).not.toContain(sim.turn.readerId);
          duelsPlayed++;
          sim.timeout(); // açılış
          // herkes ilk düellocuya oy verir
          const [a] = sim.turn.targets;
          for (const p of sim.s.players) if (!sim.turn.targets.includes(p.id)) sim.as(p.id, { t: 'vote', playerId: a! });
        }
      }
      do sim.timeout(); while ((sim.s.phase as string) !== 'choose' && (sim.s.phase as string) !== 'summary');
    }
    expect(hands).toBeGreaterThan(5);
    expect(duelsInHand).toBe(hands);
    const games = sim.s.players.map((p) => { const st = sim.s.stats[p.id]!; return (st.duelW ?? 0) + (st.duelD ?? 0) + (st.duelL ?? 0); });
    expect(games.reduce((x, y) => x + y, 0)).toBe(duelsPlayed * 2);
    // adil eşleşme: maç sayıları arasında en fazla 2 fark
    expect(Math.max(...games) - Math.min(...games)).toBeLessThanOrEqual(2);
    const totalW = sim.s.players.reduce((x, p) => x + (sim.s.stats[p.id]!.duelW ?? 0), 0);
    expect(totalW).toBe(duelsPlayed);
    expect(viewFor(sim.s, 'p1', base).stats.p1!.duelW).toBe(sim.s.stats.p1!.duelW ?? 0);
  });
});

describe('Düello Ligi hakem oyu', () => {
  it('oylar eşitse hakemin (okuyucunun) oyu kazananı belirler', () => {
    const dc = only(
      card('d1', { type: 'duel', target: 'twoPicked', input: 'votePlayer', text: 'Düello: {secilen} ve {ikinci} kapışsın.' }),
      card('d2', { type: 'duel', target: 'twoPicked', input: 'votePlayer', text: 'Düello: {secilen} ve {ikinci} yine kapışsın.' }),
      card('q1', { type: 'question' }),
    );
    const sim = new Sim(createRoom('ABCD', 0, 7), dc);
    for (let i = 0; i < 4; i++) sim.do({ t: 'join', playerId: `p${i}`, secret: 's', name: `O${i}`, avatar: 0, consent: { ageOk: true } });
    sim.as('p0', { t: 'updateSettings', patch: { deck: 'duel' } });
    sim.as('p0', { t: 'start' });
    sim.timeout();
    const duel = sim.turn.hand.find((id) => id.startsWith('d'))!;
    playForce(sim, duel);
    sim.timeout();
    const [a, b] = sim.turn.targets as [string, string];
    const reader = sim.turn.readerId;
    const other = sim.s.players.map((p) => p.id).find((id) => id !== a && id !== b && id !== reader)!;
    sim.as(other, { t: 'vote', playerId: a });
    sim.as(reader, { t: 'vote', playerId: b });
    expect(sim.s.phase).toBe('resolve');
    expect(sim.s.game!.turn!.result!.winner).toBe(b);
    expect(sim.s.stats[b]!.duelW).toBe(1);
    expect(sim.s.stats[a]!.duelL).toBe(1);
  });
});
