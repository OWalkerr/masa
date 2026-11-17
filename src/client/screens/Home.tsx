// Giriş: logo, "Masa Kur", "Masaya Katıl" (kod girişi), tek satır sorumluluk notu.
import { InstallHint } from '../components/InstallHint';
import { useState } from 'react';
import { ROOM_CODE_ALPHABET } from '../../engine/types';
import { InkButton } from '../components/InkButton';
import { Logo } from '../components/Logo';
import { NightScene } from '../components/NightScene';
import { Tik } from '../components/Tik';
import { navigate } from '../router';
import { useRoom } from '../store/room';

export async function createRoom(bots = 0): Promise<string> {
  const r = await fetch(`/api/rooms${bots ? `?bots=${bots}` : ''}`, { method: 'POST' });
  if (!r.ok) throw new Error('Masa kurulamadı');
  const j = (await r.json()) as { code: string };
  return j.code;
}

export function cleanCode(raw: string): string {
  return raw
    .toLocaleUpperCase('tr')
    .replace(/İ/g, 'I')
    .split('')
    .filter((c) => ROOM_CODE_ALPHABET.includes(c))
    .join('')
    .slice(0, 4);
}

export function Home() {
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useRoom((s) => s.toast);

  const bots = Number(new URLSearchParams(location.search).get('bots') ?? 0) || 0;

  async function onCreate() {
    setBusy(true);
    try {
      const c = await createRoom(bots);
      navigate(`/m/${c}`);
    } catch {
      toast('Masa kurulamadı. İnternetini kontrol edip tekrar dene.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function onJoin() {
    if (code.length !== 4) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/room/${code}/exists`);
      const j = (await r.json()) as { exists: boolean };
      if (!j.exists) toast(`${code} kodlu bir masa yok. Kodu kontrol et.`, 'error');
      else navigate(`/m/${code}`);
    } catch {
      toast('Bağlanamadım. İnternetini kontrol et.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-full flex-col items-center px-4 pt-[8vh] safe-bottom" data-deck="classic">
      <NightScene lobby />
      <Tik size={118} className="tik-bob mb-1" />
      <Logo />
      <p className="mt-3 max-w-xs text-center text-[17px] text-bone-dim">
        Herkes kendi telefonundan. Kurulum yok, hesap yok. Gece giderek kızışır.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        {!joining ? (
          <>
            <InkButton onClick={onCreate} disabled={busy} seed={11}>
              Masa Kur
            </InkButton>
            <InkButton variant="secondary" onClick={() => setJoining(true)} seed={12}>
              Masaya Katıl
            </InkButton>
          </>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void onJoin();
            }}
          >
            <label htmlFor="code" className="text-center text-[16px] text-bone-dim">
              Masanın 4 harfli kodu
            </label>
            <input
              id="code"
              autoFocus
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(cleanCode(e.target.value))}
              className="ink-panel h-[68px] text-center font-extrabold text-[44px] tracking-[0.3em] text-bone-100 outline-none"
              placeholder="KOD"
              aria-label="Masa kodu"
            />
            <InkButton type="submit" disabled={busy || code.length !== 4} seed={13}>
              Otur
            </InkButton>
            <InkButton type="button" variant="ghost" onClick={() => setJoining(false)}>
              Vazgeç
            </InkButton>
          </form>
        )}
      </div>

      <InstallHint />

      <p className="mt-auto max-w-sm pt-10 text-center text-[14px] text-bone-dim">
        Alkollü mod 18 yaş üstü içindir. Sorumlu iç. Araba kullanacaksan alkolsüz oyna.
      </p>
      <a href="/dev/table" className="mt-2 text-[14px] text-ash-500 underline">
        Geliştirici masası
      </a>
    </main>
  );
}
