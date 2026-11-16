// M0 motor testleri: lobi, yeniden bağlanma, host devri, ayarlar, görünüm gizliliği, tohumlu tekrar
import { describe, expect, it } from 'vitest';
import { lintCard, type Card } from '../../src/engine/cards';
import { cleanName, uniqueName } from '../../src/engine/names';
import { reduce } from '../../src/engine/reducer';
import { makeRng } from '../../src/engine/rng';
import { createRoom, nextTimerAt } from '../../src/engine/state';
import { HOST_GRACE_MS, ROOM_TTL_MS, type GameState, type Intent } from '../../src/engine/types';
import { viewFor } from '../../src/engine/viewFor';

function run(s: GameState, intents: Intent[], start = 1000, step = 100) {
  let now = start;
  for (const it of intents) {
    s = reduce(s, it, { now, rng: makeRng(s.rngState) }).state;
    now += step;
  }
  return s;
}
const join = (id: string, name = id, extra: Partial<Extract<Intent, { t: 'join' }>> = {}): Intent => ({
  t: 'join', playerId: id, secret: `s-${id}`, name, avatar: 1, ...extra,
});

describe('lobi', () => {
  it('ilk insan host olur, bot host olmaz', () => {
    let s = createRoom('ABCD', 0, 42);
    s = run(s, [join('b1', 'Bot', { isBot: true }), join('a', 'Ayşe'), join('b', 'Mehmet')]);
    expect(s.hostId).toBe('a');
    expect(s.players).toHaveLength(3);
  });

  it('aynı isme sayı eklenir ve 14 karakter sınırı korunur', () => {
    expect(uniqueName('Ayşe', ['ayşe'])).toBe('Ayşe 2');
    expect(uniqueName('Ayşe', ['Ayşe', 'Ayşe 2'])).toBe('Ayşe 3');
    const long = 'Abcdefghijklmn';
    expect([...uniqueName(long, [long])].length).toBeLessThanOrEqual(14);
    expect(cleanName('  Çok   uzun bir isim burada  ')).toBe('Çok uzun bir i');
    let s = createRoom('ABCD', 0, 1);
    s = run(s, [join('a', 'Ali'), join('b', 'ali')]);
    expect(s.players[1]!.name).toBe('ali 2');
  });

  it('en fazla 12 oyuncu', () => {
    let s = createRoom('ABCD', 0, 1);
    s = run(s, Array.from({ length: 12 }, (_, i) => join(`p${i}`)));
    expect(() => reduce(s, join('p13'), { now: 1, rng: makeRng(1) })).toThrow(/dolu/);
  });

  it('ayarları yalnızca host değiştirir; geçersiz niyet durumu değiştirmez', () => {
    let s = run(createRoom('ABCD', 0, 1), [join('a'), join('b')]);
    const before = JSON.stringify(s);
    expect(() => reduce(s, { t: 'updateSettings', by: 'b', patch: { drinking: false } }, { now: 5, rng: makeRng(1) })).toThrow();
    expect(JSON.stringify(s)).toBe(before);
    s = run(s, [{ t: 'updateSettings', by: 'a', patch: { deck: 'clean' } }]);
    expect(s.settings.drinking).toBe(false); // Temiz deste alkolsüz sabit
    s = run(s, [{ t: 'updateSettings', by: 'a', patch: { deck: 'spicy' } }]);
    expect(s.settings.adult).toBe(true);
    expect(() => reduce(s, { t: 'updateSettings', by: 'a', patch: { deck: 'duel' } }, { now: 5, rng: makeRng(1) })).toThrow();
  });

  it('başlatmak için en az 3 oyuncu gerekir; geç katılan sıranın sonuna eklenir', () => {
    let s = run(createRoom('ABCD', 0, 7), [join('a'), join('b')]);
    expect(() => reduce(s, { t: 'start', by: 'a' }, { now: 5, rng: makeRng(1) })).toThrow(/3/);
    s = run(s, [join('c'), { t: 'start', by: 'a' }, join('d')]);
    expect(s.phase).toBe('actIntro');
    expect(s.order.at(-1)).toBe('d');
    expect(new Set(s.order)).toEqual(new Set(['a', 'b', 'c', 'd']));
  });
});

describe('kopma, yeniden bağlanma, host devri', () => {
  it('kopan oyuncu koltuğunu korur, geri gelince bağlı görünür', () => {
    let s = run(createRoom('ABCD', 0, 1), [join('a'), join('b'), { t: 'disconnect', playerId: 'b' }]);
    expect(s.players.find((p) => p.id === 'b')!.connected).toBe(false);
    s = run(s, [{ t: 'connect', playerId: 'b' }]);
    expect(s.players.find((p) => p.id === 'b')!.connected).toBe(true);
    expect(s.players).toHaveLength(2);
  });

  it('host düşerse süre dolunca hostluk en eski bağlı oyuncuya geçer', () => {
    let s = run(createRoom('ABCD', 0, 1), [join('a'), join('b'), join('c'), { t: 'disconnect', playerId: 'a' }], 1000);
    const at = s.timers.find((t) => t.kind === 'hostGrace')!.at;
    expect(at).toBe(1300 + HOST_GRACE_MS);
    // süre dolmadan tick: değişmez
    s = reduce(s, { t: 'tick' }, { now: at - 1, rng: makeRng(1) }).state;
    expect(s.hostId).toBe('a');
    const r = reduce(s, { t: 'tick' }, { now: at, rng: makeRng(1) });
    expect(r.state.hostId).toBe('b');
    expect(r.fx.some((f) => f.kind === 'hostChanged')).toBe(true);
  });

  it('host süre dolmadan dönerse hostluk kalır', () => {
    let s = run(createRoom('ABCD', 0, 1), [join('a'), join('b'), { t: 'disconnect', playerId: 'a' }, { t: 'connect', playerId: 'a' }]);
    s = reduce(s, { t: 'tick' }, { now: 10_000_000, rng: makeRng(1) }).state;
    expect(s.hostId).toBe('a');
  });

  it('host bağlı oyuncu yoksa devretmez; host lobiden çıkarsa hemen devreder', () => {
    let s = run(createRoom('ABCD', 0, 1), [join('a'), join('b'), { t: 'disconnect', playerId: 'b' }, { t: 'leave', by: 'a' }]);
    expect(s.hostId).toBe('b'); // bağlı kimse yoksa en eski insan
    s = run(createRoom('ABCD', 0, 1), [join('a'), join('x', 'Bot', { isBot: true }), join('b'), { t: 'leave', by: 'a' }]);
    expect(s.hostId).toBe('b');
  });

  it('12 saat işlem görmeyen oda için expire sinyali üretilir', () => {
    let s = run(createRoom('ABCD', 0, 1), [join('a')], 1000);
    expect(nextTimerAt(s)).toBe(1000 + ROOM_TTL_MS);
    const r = reduce(s, { t: 'tick' }, { now: 1000 + ROOM_TTL_MS, rng: makeRng(1) });
    expect(r.fx.some((f) => f.kind === 'expired')).toBe(true);
  });
});

describe('gizlilik (viewFor)', () => {
  it('secret ve başkalarının katılım tercihleri gitmez', () => {
    const s = run(createRoom('ABCD', 0, 1), [
      join('a', 'Ayşe', { consent: { ageOk: true, spicy: true } }),
      join('b', 'Mehmet', { consent: { ageOk: true, contact: true } }),
    ]);
    const v = viewFor(s, 'b');
    const json = JSON.stringify(v);
    expect(json).not.toContain('s-a');
    expect(json).not.toContain('s-b');
    expect(v.you!.consent.contact).toBe(true);
    expect(JSON.stringify(v.players)).not.toMatch(/spicy|contact|consent/);
    expect(viewFor(s, null).you).toBeNull();
  });

  it('yaş onayı olmadan 18+ katılım açılamaz', () => {
    let s = run(createRoom('ABCD', 0, 1), [join('a', 'A', { consent: { spicy: true } })]);
    expect(s.players[0]!.consent.spicy).toBe(false);
    s = run(s, [{ t: 'consent', by: 'a', consent: { ageOk: true, spicy: true } }, { t: 'consent', by: 'a', consent: { ageOk: false } }]);
    expect(s.players[0]!.consent).toEqual({ ageOk: false, spicy: false, contact: false });
  });
});

describe('tohumlu tekrar', () => {
  it('aynı tohum ve niyetler aynı durumu üretir', () => {
    const intents: Intent[] = [join('a'), join('b'), join('c'), join('d'), { t: 'start', by: 'a' }];
    const s1 = run(createRoom('ABCD', 0, 1234), intents);
    const s2 = run(createRoom('ABCD', 0, 1234), intents);
    expect(s1).toEqual(s2);
    const s3 = run(createRoom('ABCD', 0, 99), intents);
    // farklı tohum genelde farklı ilk okuyucu verir (rng durumu kesin farklıdır)
    expect(s3.rngState).not.toBe(s1.rngState);
  });

  it('rng deterministik ve [0,1) aralığında', () => {
    const a = makeRng(5), b = makeRng(5);
    for (let i = 0; i < 100; i++) {
      const x = a.next();
      expect(x).toBe(b.next());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('kart doğrulama', () => {
  const base: Card = { id: 'x-1', deck: 'classic', type: 'dare', intensity: 1, rarity: 'common', target: 'picked', input: 'judge', text: '{secilen}, masaya bir şarkı söyle.', penalty: 1 };
  it('geçerli kart temiz', () => expect(lintCard(base)).toEqual([]));
  it('yasak kalıpları yakalar', () => {
    expect(lintCard({ ...base, text: '{secilen}, dışarı çık ve bağır.' })).not.toEqual([]);
    expect(lintCard({ ...base, text: '{secilen}, eski sevgilini ara.' })).not.toEqual([]);
    expect(lintCard({ ...base, text: '{secilen}, bir peçete ye.' })).not.toEqual([]);
  });
  it('jeton ve tür kurallarını uygular', () => {
    expect(lintCard({ ...base, target: 'all' })).toContain('{secilen} jetonu picked/twoPicked hedef ister');
    expect(lintCard({ ...base, text: '{kimse} bir şey yap.' })[0]).toMatch(/bilinmeyen/);
  });
});
