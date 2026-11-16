// /m/KOD — bağlan, koltuğa dön ya da katıl; faza göre ekranı seç.
import { useEffect, useRef } from 'react';
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
      <NightScene seed={code.charCodeAt(0) + code.charCodeAt(3)} />
      {(status === 'reconnecting' || status === 'connecting') && view && (
        <div role="status" className="fixed inset-x-0 top-0 z-40 bg-ink-800/95 py-2 text-center text-[15px] text-bone-100 shadow-[0_1px_0_var(--ash-500)]">
          Bağlantı koptu, yeniden bağlanıyor…
        </div>
      )}
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
