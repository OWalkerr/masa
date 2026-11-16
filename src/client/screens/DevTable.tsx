// /dev/table — tek sekmede 4 telefon boyutunda iframe; her biri ayrı bir oyuncu (ayrı localStorage ad alanı).
import { useEffect, useState } from 'react';
import { InkButton } from '../components/InkButton';
import { createRoom } from './Home';

const PHONES = 4;
const NAMES = ['Ayşe', 'Mehmet', 'Zeynep', 'Can'];

export function DevTable() {
  const q = new URLSearchParams(location.search);
  const [code, setCode] = useState<string | null>(q.get('code'));
  const [bots, setBots] = useState(Number(q.get('bots') ?? 0) || 0);
  const [mounted, setMounted] = useState(0); // sırayla yükle: ilk iframe host olsun
  const [nonce, setNonce] = useState<number[]>(Array(PHONES).fill(0));
  const [off, setOff] = useState<boolean[]>(Array(PHONES).fill(false));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!code) return;
    setMounted(1);
    const t = window.setInterval(() => setMounted((m) => (m >= PHONES ? m : m + 1)), 900);
    return () => window.clearInterval(t);
  }, [code]);

  async function newTable() {
    setBusy(true);
    try {
      const c = await createRoom(bots);
      history.replaceState(null, '', `/dev/table?code=${c}${bots ? `&bots=${bots}` : ''}`);
      setMounted(0);
      setOff(Array(PHONES).fill(false));
      setCode(c);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-full bg-ink-950 px-4 py-4 text-bone-100">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="font-gothic text-[32px]">Geliştirici Masası</h1>
        <label className="flex items-center gap-2 text-[16px]">
          Bot
          <select
            value={bots}
            onChange={(e) => setBots(Number(e.target.value))}
            className="h-[48px] rounded-[10px] bg-ink-800 px-3 shadow-[inset_0_0_0_1px_var(--ash-500)]"
          >
            {[0, 1, 2, 3, 4, 6, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <InkButton onClick={newTable} disabled={busy}>
          {code ? 'Yeni masa kur' : 'Masa kur ve 4 telefonu aç'}
        </InkButton>
        {code && (
          <span className="text-[16px] text-bone-dim">
            Masa <b className="font-extrabold text-[24px] tracking-[0.15em] text-bone-100">{code}</b> ·{' '}
            <a className="underline" href={`/m/${code}`} target="_blank" rel="noreferrer">
              yeni sekmede aç
            </a>
          </span>
        )}
      </header>
      {!code && (
        <p className="max-w-xl text-bone-dim">
          Masa kurulunca 4 telefon sırayla oturur. İlk telefon masanın sahibidir. “Yenile” ile koltuğa dönüşü, “Kopar” ile
          host devrini (10 sn sonra) deneyebilirsin.
        </p>
      )}
      {code && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: PHONES }, (_, i) => (
            <div key={i} className="flex shrink-0 flex-col gap-2">
              <div className="flex items-center justify-between gap-2 text-[14px]">
                <span>
                  Telefon {i + 1} · {NAMES[i]}
                </span>
                <span className="flex gap-1">
                  <button
                    className="min-h-[36px] rounded-[8px] bg-ink-800 px-3 shadow-[inset_0_0_0_1px_var(--ash-500)]"
                    onClick={() => setNonce((n) => n.map((x, j) => (j === i ? x + 1 : x)))}
                  >
                    Yenile
                  </button>
                  <button
                    className="min-h-[36px] rounded-[8px] bg-ink-800 px-3 shadow-[inset_0_0_0_1px_var(--ash-500)]"
                    onClick={() => setOff((o) => o.map((x, j) => (j === i ? !x : x)))}
                  >
                    {off[i] ? 'Bağla' : 'Kopar'}
                  </button>
                </span>
              </div>
              <div className="h-[760px] w-[360px] overflow-hidden rounded-[28px] bg-black shadow-[0_0_0_6px_#222,0_0_0_7px_var(--ash-500)]">
                {i < mounted && !off[i] ? (
                  <iframe
                    key={`${code}-${nonce[i]}`}
                    title={`Telefon ${i + 1}`}
                    src={`/m/${code}?seat=${i + 1}&autojoin=1&name=${encodeURIComponent(NAMES[i]!)}&avatar=${i * 3}`}
                    className="h-full w-full border-0"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-bone-dim">{off[i] ? 'Bağlantı kopuk' : 'Bekliyor…'}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
