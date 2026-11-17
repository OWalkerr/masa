// /m/KOD — bağlan, koltuğa dön ya da katıl; faza göre ekranı seç.
import { useEffect, useRef, useState } from 'react';
import { modeById } from '../../engine/modes';
import { NightScene } from '../components/NightScene';
import { Tik } from '../components/Tik';
import { useRoom } from '../store/room';
import { GameScreen } from './GameScreen';
import { JoinScreen } from './JoinScreen';
import { LobbyScreen } from './LobbyScreen';
import { NotFound } from './NotFound';

export function RoomScreen({ code }: { code: string }) {
  const open = useRoom((s) => s.open);
  const view = useRoom((s) => s.view);
  const status = useRoom((s) => s.status);
  const resuming = useRoom((s) => s.resuming);
  const send = useRoom((s) => s.send);
  const autoJoined = useRef(false);
  const online = useOnline();

  useEffect(() => {
    open(code);
  }, [code, open]);

  // Aktif destenin vurgu rengi tüm sayfaya uygulanır
  const deck = view?.settings.deck ?? 'classic';
  useEffect(() => {
    document.documentElement.dataset.deck = deck;
    document.documentElement.style.setProperty('--deck-accent', modeById(deck).accent);
  }, [deck]);

  // /dev/table için: ?autojoin=1&name=..&avatar=.. ile otomatik otur
  useEffect(() => {
    if (!view || view.you || resuming || autoJoined.current) return;
    const q = new URLSearchParams(location.search);
    if (q.get('autojoin') !== '1') return;
    autoJoined.current = true;
    send({
      t: 'join',
      name: q.get('name') ?? 'Oyuncu',
      avatar: Number(q.get('avatar') ?? 0) % 12,
      consent: { ageOk: true },
    });
  }, [view, resuming, send]);

  if (status === 'missing') return <NotFound title="Masa kalkmış" text={`${code} kodlu masa bulunamadı ya da kapanmış.`} />;

  let body;
  if (!view || resuming) {
    body = <Loading text={resuming ? 'Koltuğuna dönülüyor…' : 'Masaya yürünüyor…'} />;
  } else if (!view.you) {
    body = <JoinScreen view={view} />;
  } else if (view.phase === 'lobby') {
    body = <LobbyScreen view={view} />;
  } else {
    body = <GameScreen view={view} />;
  }

  return (
    <div className="relative min-h-full">
      <NightScene seed={code.charCodeAt(0) + code.charCodeAt(3)} lobby={!view || view.phase === 'lobby' || !view.you} />
      {(!online || ((status === 'reconnecting' || status === 'connecting') && view)) && <ConnBanner online={online} />}
      {status === 'closed' && <NotFound title="Masa kapandı" text="Bu masa uzun süre boş kaldığı için kaldırıldı." />}
      {/* içerik partikül katmanının (z-1) üstünde: efektler kart metnine binmez */}
      {status !== 'closed' && <div className="relative z-[2] min-h-full">{body}</div>}
    </div>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-3">
      <Tik size={100} className="tik-bob" />
      <p className="text-bone-dim" role="status">
        {text}
      </p>
    </main>
  );
}

function useOnline(): boolean {
  const [on, setOn] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOn(true);
    const down = () => setOn(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return on;
}

// Bağlantı şeridi: 15 sn'den uzun sürerse "Yenile" önerir
function ConnBanner({ online }: { online: boolean }) {
  const [long, setLong] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLong(true), 15_000);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-40 flex items-center justify-center gap-3 bg-ink-800/95 px-3 py-2 text-center text-[15px] text-bone-100 shadow-[0_1px_0_var(--ash-500)]">
      <span>{online ? 'Bağlantı koptu, yeniden bağlanıyor…' : 'İnternet yok. Bağlanınca kaldığın yerden devam edersin.'}</span>
      {long && (
        <button type="button" onClick={() => location.reload()} className="min-h-[40px] rounded-full bg-[var(--accent)] px-3 font-bold text-ink-950">
          Yenile
        </button>
      )}
    </div>
  );
}
