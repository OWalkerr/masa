// Ana Ekran (/tv/KOD): büyük kart, masa sahnesi, skor ve katılım QR'ı. Telefonlar kumanda olur.
// Koltuğa oturmaz (izleyici); ortam müziği burada çalar.
import { useEffect } from 'react';
import { modeById } from '../../engine/modes';
import type { View } from '../../engine/viewFor';
import { useMusic } from '../audio/sound';
import { Avatar } from '../components/Avatar';
import { CardBack } from '../components/GameCard/GameCard';
import { Logo } from '../components/Logo';
import { NightScene } from '../components/NightScene';
import { QrCode } from '../components/QrCode';
import { TavernTable } from '../components/TavernTable';
import { Tik } from '../components/Tik';
import { useRoom } from '../store/room';
import { useFxFeedback } from './GameScreen';
import { CardStage } from './game/CardStage';
import { CandleTimer } from './game/CandleTimer';
import { CatchOverlay, CatchResultToast } from './game/Effects';
import { useWakeLock } from './game/hooks';
import { BombIcon } from './game/MinigamePanel';
import { ResolvePanel } from './game/ResolvePanel';
import { howTo, nowLine } from './game/explain';
import { Summary } from './game/Summary';
import { ACT_NAMES } from './game/TopBar';
import { NotFound } from './NotFound';
import { DUR } from '../../engine/types';

export function TvScreen({ code }: { code: string }) {
  const open = useRoom((s) => s.open);
  const view = useRoom((s) => s.view);
  const status = useRoom((s) => s.status);
  useEffect(() => {
    open(code, true);
  }, [code, open]);
  const deck = view?.settings.deck ?? 'classic';
  useEffect(() => {
    document.documentElement.style.setProperty('--deck-accent', modeById(deck).accent);
  }, [deck]);
  useWakeLock(true);
  useMusic(true);

  if (status === 'missing') return <NotFound title="Masa kalkmış" text={`${code} kodlu masa bulunamadı.`} />;
  return (
    <div className="relative min-h-full overflow-hidden">
      <NightScene seed={21} tv />
      <div className="relative z-[2] min-h-full">{!view ? <TvLoading /> : view.phase === 'lobby' ? <TvLobby view={view} /> : <TvGame view={view} />}</div>
    </div>
  );
}

function TvLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Tik size={160} className="tik-bob" />
      <p className="text-[28px] text-bone-dim">Ana Ekran hazırlanıyor…</p>
    </main>
  );
}

function JoinQr({ code, size }: { code: string; size: number }) {
  const link = `${location.origin}/m/${code}`;
  return (
    <div className="flex flex-col items-center gap-2">
      <QrCode value={link} size={size} />
      <p className="text-[22px] text-bone-dim">{location.host}/m/{code}</p>
    </div>
  );
}

function TvLobby({ view }: { view: View }) {
  const seated = view.players.filter((p) => !p.left);
  const mode = modeById(view.settings.deck);
  return (
    <main className="grid min-h-screen grid-cols-[1fr_1fr] items-center gap-10 px-[5vw] py-[4vh]">
      <section className="flex flex-col items-center gap-6 text-center">
        <Logo size={120} />
        <p className="text-[32px]">Telefonunla masaya otur</p>
        <p className="font-extrabold text-[120px] leading-none tracking-[0.2em]">{view.code}</p>
        <JoinQr code={view.code} size={280} />
        <p className="text-[24px] text-bone-dim">
          {mode.name} · {view.settings.drinking ? 'Alkollü' : 'Alkolsüz'} · {seated.length} kişi
        </p>
      </section>
      <section className="flex flex-col items-center">
        <div className="w-full max-w-[520px] origin-top scale-[1.15]">
          <TavernTable players={view.players} youId={null} />
        </div>
        <p className="mt-10 text-[24px] text-bone-dim">Masayı kuran telefonundan “Başlat”a basınca perde açılır.</p>
      </section>
    </main>
  );
}

function TvGame({ view }: { view: View }) {
  useFxFeedback(view);
  const g = view.game;
  if (!g) return null;
  if (view.phase === 'summary') {
    return (
      <div className="mx-auto max-w-3xl scale-[1.1] pt-6">
        <Summary view={view} />
      </div>
    );
  }
  const reader = view.players.find((p) => p.id === g.readerId);
  const cardW = Math.round(Math.min(window.innerWidth * 0.36, (window.innerHeight * 0.84) / 1.4));
  const cardPhase = ['reveal', 'action', 'resolve', 'tableEvent', 'finale'].includes(view.phase);
  const drinking = view.settings.drinking;
  return (
    <main className="grid min-h-screen grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-[3vw] px-[3vw] py-[3vh]">
      <section className="flex flex-col items-center justify-center gap-4">
        <h1 className="font-gothic text-[40px] font-normal">
          Perde {g.act}: {ACT_NAMES[g.act]} <span className="text-bone-dim">· {Math.min(g.actTurn + 1, g.actTurns)}/{g.actTurns}</span>
        </h1>
        {view.phase === 'actIntro' && (
          <div className="flex flex-col items-center gap-4">
            <Tik size={260} className="tik-bob" variant={drinking ? 'raki' : 'tea'} />
            <p className="font-gothic text-[80px] text-accent">{ACT_NAMES[g.act]}</p>
          </div>
        )}
        {view.phase === 'choose' && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative" style={{ width: cardW * 1.6, height: cardW * 0.5 * 1.4 + 20 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="absolute left-1/2 top-0" style={{ marginLeft: -cardW * 0.25, transform: `translateX(${(i - 1) * cardW * 0.4}px) rotate(${(i - 1) * 8}deg)` }}>
                  <CardBack width={cardW * 0.5} />
                </div>
              ))}
            </div>
            <p className="flex items-center gap-4 text-[40px]">
              {reader && <Avatar index={reader.avatar} size={72} />}
              {reader?.name} kart seçiyor…
            </p>
            {g.phaseEndsAt && (
              <div className="w-[480px]">
                <CandleTimer endsAt={g.phaseEndsAt} total={g.step === 'target' ? DUR.target : DUR.choose + DUR.deal} />
              </div>
            )}
          </div>
        )}
        {cardPhase && g.card && <CardStage key={g.card.id + g.turnNo} view={view} card={g.card} width={cardW} />}
        {cardPhase && g.card && <p className="max-w-[44vw] text-center text-[26px] text-bone-dim">{howTo(g.card, view)}</p>}
      </section>
      <aside className="flex min-w-0 flex-col gap-4 py-2 text-[24px]">
        {g.effects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {g.effects.map((e) => (
              <span key={e.id} className={`rounded-[8px] px-3 py-1 text-[22px] ${e.kind === 'curse' ? 'bg-[#3B2650]' : 'bg-parchment-200 text-ink-text'}`}>
                {e.text}
              </span>
            ))}
          </div>
        )}
        {nowLine(view) && <p className="rounded-[14px] bg-ink-800 px-5 py-3 text-[30px] font-bold">{nowLine(view)!.text.replace(/^Sıra sende: /, '')}</p>}
        <TvStatus view={view} />
        <Scoreboard view={view} />
        <div className="mt-auto flex items-end justify-between">
          <JoinQr code={view.code} size={140} />
          <Tik size={110} variant={drinking ? 'raki' : 'tea'} mood="smirk" />
        </div>
      </aside>
      <CatchOverlayTv view={view} />
      <CatchResultToast view={view} />
    </main>
  );
}

// Faz durumu: kim girdi verdi, sonuçlar, mini oyun
function TvStatus({ view }: { view: View }) {
  const g = view.game!;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  if (view.phase === 'action' && g.mg) {
    const mg = g.mg;
    return (
      <div className="ink-panel flex flex-col items-center gap-3 p-6 text-center">
        {mg.stage === 'wait' && <p className="font-gothic text-[48px]">Hazırlan…</p>}
        {mg.kind === 'bomb' &&
          mg.holders.map((h, i) => (
            <p key={i} className="flex items-center gap-4 text-[36px]">
              <BombIcon size={90} lit={!h.exploded} /> {h.exploded ? `${name(h.holder)} uçtu!` : `${name(h.holder)} elinde!`}
            </p>
          ))}
        {mg.kind === 'reflex' && <p className="text-[72px] font-extrabold">{mg.filled ? 'ŞİMDİ!' : 'Bekle…'}</p>}
        {mg.kind === 'countdown' && mg.stage === 'live' && <p className="font-gothic text-[56px]">İçinden say…</p>}
        {mg.kind !== 'bomb' && <p className="text-bone-dim">{mg.tapped.length}/{view.players.filter((p) => !p.left).length} dokundu</p>}
      </div>
    );
  }
  if (view.phase === 'action') {
    return (
      <div className="ink-panel p-4">
        <p className="mb-2 text-bone-dim">{g.stage === 'write' ? 'Herkes anonim yazıyor…' : g.input === 'judge' ? `${name(g.readerId ?? '')} hüküm verecek` : 'Herkes gizlice seçiyor…'}</p>
        {g.stage === 'guess' && g.spotlight !== null && <p className="mb-3 rounded-[12px] bg-parchment-200 p-4 text-[30px] text-ink-text">“{g.answers[g.spotlight]}”</p>}
        <div className="flex flex-wrap gap-3">
          {g.expected.map((id) => (
            <span key={id} className={`flex items-center gap-2 rounded-full px-3 py-1 ${g.submitted.includes(id) ? 'bg-parchment-200 text-ink-text' : 'bg-ink-950 text-bone-dim'}`}>
              {g.submitted.includes(id) ? '✓ ' : '… '}
              {name(id)}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (view.phase === 'resolve' || view.phase === 'tableEvent') {
    return (
      <div className="origin-top-left scale-[1.25]" style={{ width: '80%' }}>
        <ResolvePanel view={view} />
      </div>
    );
  }
  return null;
}

function Scoreboard({ view }: { view: View }) {
  const players = view.players.filter((p) => !p.left).sort((a, b) => (view.stats[b.id]?.courage ?? 0) - (view.stats[a.id]?.courage ?? 0));
  return (
    <table className="ink-panel w-full text-[24px]">
      <thead>
        <tr className="text-[18px] text-bone-dim">
          <th className="p-2 text-left font-bold">Masa</th>
          <th className="p-2 text-right font-bold">Cesaret</th>
          <th className="p-2 text-right font-bold">{view.settings.drinking ? 'İçti' : 'Ceza'}</th>
        </tr>
      </thead>
      <tbody>
        {players.slice(0, 8).map((p) => (
          <tr key={p.id} className="border-t border-ash-500">
            <td className="flex items-center gap-3 p-2">
              <Avatar index={p.avatar} size={40} dim={!p.connected} />
              <span className={p.id === view.game?.readerId ? 'text-accent' : ''}>{p.name}</span>
            </td>
            <td className="p-2 text-right tabular-nums">{view.stats[p.id]?.courage ?? 0}</td>
            <td className="p-2 text-right tabular-nums">{view.stats[p.id]?.paidUnits ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// TV'de oylama yapılmaz, yalnızca gösterilir
function CatchOverlayTv({ view }: { view: View }) {
  if (!view.game?.catchVote) return null;
  return (
    <div className="scale-[1.4]">
      <CatchOverlay view={view} />
    </div>
  );
}
