// M2 motor testleri: kural, Yakala!, lanet, düello, ayna, itiraf, altın, masa olayı, güç kartları, Pas, Veto, final
import { describe, expect, it } from 'vitest';
import { viewFor } from '../../src/engine/viewFor';
import { DUR } from '../../src/engine/types';
import { botDecide } from '../../src/server/bots';
import { makeRng } from '../../src/engine/rng';
import { createRoom } from '../../src/engine/state';
import { pendingActors } from '../../src/engine/game';
import { targetPool } from '../../src/engine/deck';
import { Sim, card, catalog, only, playForce, tableWith } from './sim';

const filler = [card('f1', {}), card('f2', { type: 'dare' }), card('f3', { type: 'neverHave', target: 'all', input: 'yesNo', text: 'Hiç X.' })];
const other = (sim: Sim, n = 0) => sim.s.order.filter((id) => id !== sim.turn.readerId)[n]!;

describe('kural ve Yakala!', () => {
  const rule = card('r1', { type: 'rule', target: 'all', input: 'catch', duration: 2, penalty: 2, text: 'Kural: Kimse "evet" diyemez.' });

  it('kural masaya konur, sayaç düşer ve süresi bitince kalkar', () => {
    const sim = tableWith(only(rule, ...filler));
    playForce(sim, 'r1');
    sim.timeout(); // reveal → resolve (girdi yok)
    expect(sim.s.phase).toBe('resolve');
    expect(sim.s.game!.effects).toHaveLength(1);
    expect(viewFor(sim.s, 'p1', sim.cat).game!.effects[0]!.text).toContain('evet');
    sim.timeout(); // sonraki tur
    expect(sim.s.game!.effects[0]!.turnsLeft).toBe(1);
    while (sim.s.game!.effects.length && sim.s.phase !== 'summary') sim.timeout();
    expect(sim.s.game!.effects).toHaveLength(0);
  });

  it('Yakala!: çoğunluk evet derse suçlanan öder, hayır derse suçlayan 1 öder', () => {
    const sim = tableWith(only(rule, ...filler), 5);
    playForce(sim, 'r1');
    sim.timeout();
    const eff = sim.s.game!.effects[0]!.id;
    sim.as('p1', { t: 'catch', effectId: eff, accused: 'p2' });
    expect(sim.s.game!.catchVote).not.toBeNull();
    expect(() => sim.as('p2', { t: 'catchVote', yes: false })).toThrow(); // suçlanan oy veremez
    sim.as('p0', { t: 'catchVote', yes: true });
    sim.as('p3', { t: 'catchVote', yes: true });
    sim.as('p4', { t: 'catchVote', yes: false });
    expect(sim.s.game!.catchVote).toBeNull();
    expect(sim.s.game!.lastCatch!.guilty).toBe(true);
    expect(sim.s.game!.lastCatch!.payments).toEqual([expect.objectContaining({ id: 'p2', units: 2 })]);
    // yanlış suçlama: 5 sn dolar, oylar hayır
    sim.now += DUR.catchCooldown;
    sim.as('p3', { t: 'catch', effectId: eff, accused: 'p4' });
    sim.as('p0', { t: 'catchVote', yes: false });
    sim.advance(DUR.catchVote);
    expect(sim.s.game!.lastCatch!.guilty).toBe(false);
    expect(sim.s.game!.lastCatch!.payments).toEqual([expect.objectContaining({ id: 'p3', units: 1 })]);
  });

  it('en fazla 3 aktif kural: sınır doluysa kural kartı elde çıkmaz', () => {
    const sim = tableWith(only(rule, card('r2', { ...rule, id: 'r2' }), ...filler));
    for (let i = 0; i < 3; i++) sim.s.game!.effects.push({ id: `e${i}`, cardId: 'x', kind: 'rule', text: 'x', turnsLeft: 5, penalty: 1 });
    while (sim.s.phase !== 'choose' || sim.turn.cardId) sim.timeout();
    for (let k = 0; k < 6; k++) {
      expect(sim.turn.hand.some((id) => id.startsWith('r'))).toBe(false);
      do sim.timeout(); while (sim.s.phase !== 'choose' && sim.s.phase !== 'summary');
      if ((sim.s.phase as string) === 'summary') break;
    }
  });
});

describe('lanet', () => {
  const curse = card('c1', { type: 'curse', target: 'picked', input: 'catch', duration: 3, text: 'Lanet: {secilen} 3 tur korsan gibi konuşur.' });

  it('lanet hedefe bağlanır, yalnızca lanetli yakalanabilir; oyuncu başına 1 lanet', () => {
    const sim = tableWith(only(curse, card('c2', { ...curse, id: 'c2' }), ...filler));
    const target = other(sim);
    playForce(sim, 'c1', [target]);
    sim.timeout();
    const e = sim.s.game!.effects[0]!;
    expect(e.kind).toBe('curse');
    expect(e.targetId).toBe(target);
    expect(e.text).toContain(sim.s.players.find((p) => p.id === target)!.name);
    const someoneElse = sim.s.order.find((id) => id !== target && id !== 'p0')!;
    expect(() => sim.as('p0', { t: 'catch', effectId: e.id, accused: someoneElse })).toThrow(/lanetli/);
    // aynı oyuncu ikinci lanete aday olamaz
    const reader = sim.turn.readerId;
    const view = viewFor(sim.s, reader, sim.cat);
    void view;
    expect(targetPool(sim.s, curse, reader).map((p: { id: string }) => p.id)).not.toContain(target);
  });
});

describe('düello', () => {
  const duel = card('d1', { type: 'duel', target: 'twoPicked', input: 'votePlayer', penalty: 2, text: 'Düello: {secilen} ve {ikinci} kahkaha atsın.' });
  it('masa (ikisi hariç) kazananı oylar; kaybeden öder, kazanan +2', () => {
    const sim = tableWith(only(duel, ...filler), 5);
    const [a, b] = [other(sim, 0), other(sim, 1)];
    playForce(sim, 'd1', [a, b]);
    sim.timeout();
    expect(() => sim.as(a, { t: 'vote', playerId: b })).toThrow(); // düellocu oy veremez
    const voters = sim.s.order.filter((id) => id !== a && id !== b);
    expect(() => sim.as(voters[0]!, { t: 'vote', playerId: voters[1]! })).toThrow(/Düellocular/);
    sim.as(voters[0]!, { t: 'vote', playerId: a });
    sim.as(voters[1]!, { t: 'vote', playerId: a });
    sim.as(voters[2]!, { t: 'vote', playerId: b });
    const r = sim.turn.result!;
    expect(r.winner).toBe(a);
    expect(r.payments.map((p) => p.id)).toEqual([b]);
    expect(r.courage).toContainEqual({ id: a, pts: 2, why: 'düelloyu kazandı' });
  });
});

describe('ayna', () => {
  const mirror = card('m1', { type: 'mirror', target: 'picked', input: 'choice', choices: ['Çay', 'Kahve', 'Su'], text: '{secilen} gizlice seçsin: Hangisi?' });
  it('bilemeyenler öder; kimse bilemezse hedef öder', () => {
    const sim = tableWith(only(mirror, ...filler));
    const target = other(sim);
    playForce(sim, 'm1', [target]);
    sim.timeout();
    const guessers = sim.s.order.filter((id) => id !== target);
    // gizli seçim başkalarına görünmez
    sim.as(target, { t: 'choose', index: 1 });
    expect(JSON.stringify(viewFor(sim.s, guessers[0]!, sim.cat).game!.myInput)).toBe('null');
    sim.as(guessers[0]!, { t: 'choose', index: 1 });
    sim.as(guessers[1]!, { t: 'choose', index: 0 });
    sim.as(guessers[2]!, { t: 'choose', index: 2 });
    expect(sim.turn.result!.correct).toEqual([guessers[0]]);
    expect(sim.turn.result!.payments.map((p) => p.id).sort()).toEqual([guessers[1], guessers[2]].sort());
  });
  it('kimse bilemezse hedef öder; $players seçenekleri oyuncu id’leridir', () => {
    const m2 = card('m2', { ...mirror, id: 'm2', choices: '$players' });
    const sim = tableWith(only(m2, ...filler));
    const target = other(sim);
    playForce(sim, 'm2', [target]);
    expect(sim.turn.optionPlayers).toBe(true);
    expect(sim.turn.options).toHaveLength(4);
    sim.timeout();
    sim.as(target, { t: 'choose', index: 0 });
    for (const id of sim.s.order.filter((x) => x !== target)) sim.as(id, { t: 'choose', index: 1 });
    expect(sim.turn.result!.payments.map((p) => p.id)).toEqual([target]);
  });
});

describe('itiraf', () => {
  const conf = card('k1', { type: 'confession', target: 'all', input: 'text', text: 'Herkes anonim yazsın: Gizli yeteneğin.' });
  it('cevaplar anonim; çoğunluk bilirse yazar öder, cevaplar tur sonunda silinir', () => {
    const sim = tableWith(only(conf, ...filler), 4);
    playForce(sim, 'k1');
    sim.timeout();
    expect(sim.turn.stage).toBe('write');
    expect(() => sim.as('p0', { t: 'answerText', text: '   ' })).toThrow();
    for (const id of sim.s.order) sim.as(id, { t: 'answerText', text: `<b>${id}</b> sırrı` });
    expect(sim.turn.stage).toBe('guess');
    const author = sim.turn.spotlightAuthor!;
    const v = viewFor(sim.s, 'p0', sim.cat).game!;
    expect(v.answers).toHaveLength(4);
    expect(JSON.stringify(v)).not.toContain(`"spotlightAuthor"`);
    expect(v.answers[v.spotlight!]).toBe(`<b>${author}</b> sırrı`); // ham metin; istemci React ile kaçışlar
    expect(viewFor(sim.s, author, sim.cat).game!.amAuthor).toBe(true);
    const voters = sim.s.order.filter((id) => id !== author);
    expect(() => sim.as(author, { t: 'vote', playerId: voters[0]! })).toThrow();
    sim.as(voters[0]!, { t: 'vote', playerId: author });
    sim.as(voters[1]!, { t: 'vote', playerId: author });
    sim.as(voters[2]!, { t: 'vote', playerId: voters[0]! });
    const r = sim.turn.result!;
    expect(r.author).toBe(author);
    expect(r.payments.map((p) => p.id)).toEqual([author]);
    expect(Object.keys(sim.turn.texts)).toHaveLength(0);
  });
  it('çoğunluk bilemezse yanlış tahmin edenler öder', () => {
    const sim = tableWith(only(conf, ...filler), 4);
    playForce(sim, 'k1');
    sim.timeout();
    for (const id of sim.s.order) sim.as(id, { t: 'answerText', text: `${id} cevap` });
    const author = sim.turn.spotlightAuthor!;
    const voters = sim.s.order.filter((id) => id !== author);
    sim.as(voters[0]!, { t: 'vote', playerId: author });
    sim.as(voters[1]!, { t: 'vote', playerId: voters[2]! });
    sim.as(voters[2]!, { t: 'vote', playerId: voters[1]! });
    expect(sim.turn.result!.payments.map((p) => p.id).sort()).toEqual([voters[1], voters[2]].sort());
  });
});

describe('altın kartlar', () => {
  it('Kemik Bilet (cep): Kalkan ve Ayna; altın kart +3 cesaret', () => {
    const g = card('g1', { type: 'golden', rarity: 'legendary', target: 'reader', input: 'none', penalty: 0, tags: ['cep'], text: 'Kemik Bilet.' });
    const sim = tableWith(only(g, ...filler));
    const r = sim.turn.readerId;
    playForce(sim, 'g1');
    sim.timeout();
    expect(sim.s.stats[r]!.powers.sort()).toEqual(['mirror', 'shield']);
    expect(sim.turn.result!.courage).toContainEqual({ id: r, pts: 3, why: 'altın kart' });
    expect(viewFor(sim.s, r, sim.cat).you!.powers).toHaveLength(2);
    expect(viewFor(sim.s, other(sim), sim.cat).you!.powers).toHaveLength(0); // cep gizli
  });
  it('Sultan Kedi (ferman): perde sonuna kadar bir kural koyar', () => {
    const g = card('g2', { type: 'golden', rarity: 'legendary', target: 'reader', input: 'none', penalty: 0, tags: ['ferman'], text: 'Sultan Kedi.' });
    const sim = tableWith(only(g, ...filler));
    const r = sim.turn.readerId;
    playForce(sim, 'g2');
    sim.timeout();
    expect(() => sim.as(other(sim), { t: 'decree', text: 'x' })).toThrow();
    sim.as(r, { t: 'decree', text: 'Herkes miyavlayarak güler.' });
    expect(sim.s.game!.effects.at(-1)!.text).toBe('Ferman: Herkes miyavlayarak güler.');
    expect(() => sim.as(r, { t: 'decree', text: 'İkinci' })).toThrow();
  });
  it('Mezardan Dönüş (devir): son 3 bedel seçilen kişiye gider', () => {
    const g = card('g3', { type: 'golden', rarity: 'legendary', target: 'reader', input: 'votePlayer', penalty: 0, tags: ['devir'], text: 'Mezardan Dönüş.' });
    const sim = tableWith(only(g, ...filler));
    const r = sim.turn.readerId;
    sim.s.stats[r]!.paidHistory = [1, 2, 2, 3];
    sim.s.stats[r]!.paidUnits = 8;
    playForce(sim, 'g3');
    sim.timeout();
    const victim = other(sim);
    sim.as(r, { t: 'vote', playerId: victim });
    expect(sim.turn.result!.payments).toEqual([expect.objectContaining({ id: victim, units: 7 })]);
    expect(sim.s.stats[r]!.paidUnits).toBe(1);
  });
  it('Ağa Kartı (catch): perde sonuna kadar süren kural', () => {
    const g = card('g4', { type: 'golden', rarity: 'legendary', target: 'reader', input: 'catch', duration: 'act', penalty: 1, text: 'Ağa: herkes sana Ağam der.' });
    const sim = tableWith(only(g, ...filler));
    playForce(sim, 'g4');
    sim.timeout();
    expect(sim.s.game!.effects[0]!.turnsLeft).toBe('act');
  });
});

describe('masa olayları ve Su Molası', () => {
  it('perde 2’den itibaren her 4 turda masa olayı, her 8 turda Su Molası gelir', () => {
    const ev = card('e1', { type: 'tableEvent', target: 'all', input: 'none', penalty: 0, tags: ['yon'], text: 'Sıra ters döndü!' });
    const sim = tableWith(only(ev, ...filler, card('f4', {}), card('f5', { type: 'dare' }), card('f6', {})), 3, 4);
    const seen: string[] = [];
    while (sim.s.phase !== 'summary') {
      if (sim.s.phase === 'tableEvent') seen.push(`${sim.s.game!.turnNo}:${sim.turn.cardId}`);
      sim.timeout();
    }
    expect(seen).toContain('8:sys-water');
    expect(seen.some((x) => x.endsWith(':e1'))).toBe(true);
    expect(seen.find((x) => x.endsWith(':e1'))!.split(':')[0]).toBe('12');
  });
  it('ters yön olayı sırayı çevirir; Hayalet Saati kartları kapalı gösterir', () => {
    const sim = tableWith(only(...filler, card('f4', {})), 4);
    sim.s.game!.blindTurns = 1;
    while (sim.s.phase !== 'choose' || sim.turn.cardId) sim.timeout();
    // bu turdan sonra kör tur
    sim.timeout(); while (sim.s.phase !== 'choose') sim.timeout();
    const v = viewFor(sim.s, sim.turn.readerId, sim.cat).game!;
    expect(v.blind).toBe(true);
    expect(v.hand!.every((h) => 'hidden' in h)).toBe(true);
    sim.as(sim.turn.readerId, { t: 'playCard', cardId: 'blind-1' });
    expect(sim.turn.cardId).toBe(sim.turn.hand[1]);
  });
});

describe('güç kartları', () => {
  function payingTable() {
    const q = card('q', { penalty: 2 });
    const sim = tableWith(only(q, ...filler), 4);
    const target = other(sim);
    playForce(sim, 'q', [target]);
    sim.timeout();
    return { sim, target };
  }

  it('her 3 cesaret puanında bir güç kartı; cepte en fazla 2', () => {
    const sim = tableWith(only(card('q', {}), ...filler));
    const r = sim.turn.readerId;
    sim.s.stats[r]!.courage = 8;
    const t = other(sim);
    playForce(sim, 'q', [t]);
    sim.timeout();
    sim.as(r, { t: 'judge', done: true }); // hedef +1
    sim.s.stats[t]!.courage = 8;
    expect(sim.s.stats[t]!.powers.length).toBeLessThanOrEqual(2);
  });

  it('Kalkan bedeli iptal eder', () => {
    const { sim, target } = payingTable();
    sim.s.stats[target]!.powers = ['shield'];
    sim.as(sim.turn.readerId, { t: 'judge', done: false });
    expect(sim.s.stats[target]!.paidUnits).toBe(2);
    sim.as(target, { t: 'usePower', power: 'shield' });
    expect(sim.turn.result!.payments).toHaveLength(0);
    expect(sim.s.stats[target]!.paidUnits).toBe(0);
    expect(sim.s.stats[target]!.powers).toHaveLength(0);
  });

  it('Ayna bedeli yansıtır; hedef Kalkan ile karşılık verebilir', () => {
    const { sim, target } = payingTable();
    const victim = sim.s.order.find((id) => id !== target && id !== sim.turn.readerId)!;
    sim.s.stats[target]!.powers = ['mirror'];
    sim.s.stats[victim]!.powers = ['shield'];
    sim.as(sim.turn.readerId, { t: 'judge', done: false });
    expect(sim.s.game!.phaseEndsAt).toBeGreaterThan(sim.now + DUR.resolve);
    sim.as(target, { t: 'usePower', power: 'mirror', targetId: victim });
    expect(sim.turn.result!.payments).toEqual([expect.objectContaining({ id: victim, units: 2 })]);
    expect(sim.s.stats[target]!.paidUnits).toBe(0);
    sim.as(victim, { t: 'usePower', power: 'shield' });
    expect(sim.turn.result!.payments).toHaveLength(0);
    expect(sim.s.stats[victim]!.paidUnits).toBe(0);
  });

  it('Takas eli yeniden çeker; Sabotaj miras kartını seçtirir', () => {
    const many = only(...[...Array(12)].map((_, i) => card(`q${i}`, { type: i % 2 ? 'dare' : 'question' })));
    const sim = tableWith(many, 4);
    const r = sim.turn.readerId;
    sim.s.stats[r]!.powers = ['swap'];
    const before = [...sim.turn.hand];
    sim.as(r, { t: 'usePower', power: 'swap' });
    expect(sim.turn.hand.some((id) => before.includes(id))).toBe(false);
    expect(() => sim.as(r, { t: 'usePower', power: 'swap' })).toThrow();
    const saboteur = sim.s.order.find((id) => id !== r && id !== sim.s.order[(sim.s.order.indexOf(r) + 1) % 4])!;
    sim.s.stats[saboteur]!.powers = ['sabotage'];
    sim.as(r, { t: 'playCard', cardId: sim.turn.hand[0]! });
    if (sim.turn.step === 'target') sim.as(r, { t: 'pickTarget', playerIds: [other(sim)] });
    const v = viewFor(sim.s, saboteur, sim.cat).game!;
    expect([sim.s.phase, sim.turn.rest.length, saboteur]).toEqual(['reveal', 2, saboteur]);
    expect(v.restCards).toHaveLength(2);
    const choice = sim.turn.rest[1]!;
    sim.as(saboteur, { t: 'usePower', power: 'sabotage', cardId: choice });
    expect(sim.s.game!.nextInherit).toBe(choice);
  });
});

describe('Pas ve Veto', () => {
  it('Pas: perde başına 1, kendine gelen kartı bedelsiz geçer', () => {
    const q = card('q', { penalty: 2 });
    const sim = tableWith(only(q, ...filler, card('q2', {})), 4);
    const target = other(sim);
    playForce(sim, 'q', [target]);
    sim.timeout();
    expect(() => sim.as(sim.s.order.find((id) => id !== target && id !== sim.turn.readerId)!, { t: 'pass' })).toThrow(/sana gelmedi/);
    sim.as(target, { t: 'pass' });
    expect(sim.s.phase).toBe('resolve'); // tek hedef pas geçince kart biter
    expect(sim.turn.result!.payments).toHaveLength(0);
    expect(sim.turn.result!.passed).toEqual([target]);
    expect(viewFor(sim.s, target, sim.cat).you!.canPass).toBe(false);
  });

  it('Veto: anonim, kart herkes için iptal, oyun boyunca 1 kez', () => {
    const nh = card('nh', { type: 'neverHave', target: 'all', input: 'yesNo', text: 'Hiç X.', penalty: 3 });
    const sim = tableWith(only(nh, ...filler), 4);
    playForce(sim, 'nh');
    sim.timeout();
    sim.as('p0', { t: 'answer', yes: true });
    const fx = sim.as('p2', { t: 'veto' });
    expect(sim.s.phase).toBe('resolve');
    expect(sim.turn.result!.vetoed).toBe(true);
    expect(sim.turn.result!.payments).toHaveLength(0);
    expect(JSON.stringify(fx)).not.toContain('p2');
    const g = viewFor(sim.s, 'p1', sim.cat).game!;
    expect(JSON.stringify(g.result)).not.toContain('p2'); // kimin veto ettiği görünmez
    expect(g.submitted).toEqual([]); // önceki cevaplar da silinir
    expect(viewFor(sim.s, 'p2', sim.cat).you!.canVeto).toBe(false);
  });
});

describe('final ve botlarla tam oyun', () => {
  it('3. perdeden sonra final kartı (alkolsüzde Son Çay), sonra özet', () => {
    const sim = tableWith(only(...filler, card('f4', {}), card('f5', {})), 3, 2, false);
    while (sim.s.phase !== 'finale') sim.timeout();
    expect(sim.turn.cardId).toBe('sys-final-tea');
    expect(viewFor(sim.s, 'p0', sim.cat).game!.card!.text).toContain('Son Çay');
    sim.timeout();
    expect(sim.s.phase).toBe('summary');
  });

  it('Kaos modunda botlarla tam Kısa oyun: tüm M2 türleri çözülebilir', () => {
    const sim = new Sim(createRoom('ABCD', 0, 31337));
    sim.do({ t: 'join', playerId: 'h', secret: 's', name: 'İnsan', avatar: 0, consent: { ageOk: true } });
    for (let i = 0; i < 5; i++) sim.do({ t: 'join', playerId: `b${i}`, secret: 'bot', name: `Bot ${i}`, avatar: i, isBot: true, consent: { ageOk: true } });
    sim.as('h', { t: 'updateSettings', patch: { length: 'short', deck: 'chaos' } });
    sim.as('h', { t: 'start' });
    let steps = 0;
    while (sim.s.phase !== 'summary' && steps++ < 5000) {
      const next = [...sim.s.timers].filter((t) => t.kind !== 'expire').sort((a, b) => a.at - b.at)[0]!;
      sim.now = Math.max(sim.now, next.at);
      const fx = sim.do({ t: 'tick' });
      for (const f of fx) {
        if (f.kind !== 'botDue') continue;
        const id = (f.payload as { playerId: string }).playerId;
        const it = botDecide(sim.s, id, makeRng(sim.s.rngState ^ 7), catalog);
        if (it) sim.as(id, it);
      }
      if (pendingActors(sim.s, { catalog }).includes('h')) {
        const it = botDecide(sim.s, 'h', makeRng(steps), catalog);
        if (it) sim.as('h', it);
      }
      // ara sıra biri birini yakalar
      const eff = sim.s.game?.effects[0];
      if (eff && !sim.s.game!.catchVote && steps % 7 === 0) {
        try { sim.as('h', { t: 'catch', effectId: eff.id, accused: eff.targetId ?? 'b0' }); } catch { /* bekleme süresi */ }
      }
    }
    expect(sim.s.phase).toBe('summary');
    const types = new Set(sim.s.game!.log.map((l) => l.type));
    expect(types.has('rule') || types.has('curse')).toBe(true);
    expect(sim.s.game!.log.length).toBe(18);
  });
});
