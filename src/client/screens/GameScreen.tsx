// Oyun ekranı (telefon): üst çubuk, ortada kart sahnesi, altta bağlama göre tek birincil eylem.
import { useEffect, useRef } from 'react';
import type { View } from '../../engine/viewFor';
import { Avatar } from '../components/Avatar';
import { Tik } from '../components/Tik';
import { useRoom } from '../store/room';
import { ActCurtain } from './game/ActCurtain';
import { ActionPanel } from './game/ActionPanel';
import { CardStage } from './game/CardStage';
import { ChoosePhase } from './game/ChoosePhase';
import { buzz, useCardWidth, useWakeLock } from './game/hooks';
import { ResolvePanel } from './game/ResolvePanel';
import { Summary } from './game/Summary';
import { TopBar } from './game/TopBar';

export function GameScreen({ view }: { view: View }) {
  useWakeLock(view.phase !== 'summary');
  useFxFeedback(view);
  const g = view.game;
  if (!g) return null;
  if (view.phase === 'summary') return <Summary view={view} />;
  const drinking = view.settings.drinking && !view.you?.sober;

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col pb-32">
      <TopBar view={view} />
      {view.phase === 'actIntro' && <ActCurtain key={g.act} act={g.act} drinking={drinking} />}
      <section className="flex flex-1 flex-col items-center gap-4 px-3">
        {view.phase === 'actIntro' && (
          <div className="flex flex-col items-center gap-3 pt-10">
            <Tik size={120} className="tik-bob" variant={drinking ? 'raki' : 'tea'} />
          </div>
        )}
        {view.phase === 'choose' && <ChoosePhase view={view} />}
        {(view.phase === 'reveal' || view.phase === 'action' || view.phase === 'resolve') && g.card && (
          <Played view={view} />
        )}
      </section>
    </main>
  );
}

function Played({ view }: { view: View }) {
  const g = view.game!;
  const big = useCardWidth(0.86, 340, 0.6);
  const small = useCardWidth(0.62, 250, 0.4);
  const reader = view.players.find((p) => p.id === g.readerId);
  const width = view.phase === 'reveal' ? big : small;
  return (
    <>
      <div className="flex items-center gap-2 text-[16px] text-bone-dim">
        {reader && <Avatar index={reader.avatar} size={28} />}
        <span>{reader?.name} okuyor</span>
      </div>
      <CardStage key={g.card!.id + g.turnNo} view={view} card={g.card!} width={width} />
      {view.phase === 'action' && <ActionPanel view={view} />}
      {view.phase === 'resolve' && <ResolvePanel view={view} />}
    </>
  );
}

// Efekt olaylarına dokunsal geri bildirim (Android). iOS'ta titreşim yok; görsel efektler yeterli.
function useFxFeedback(view: View) {
  const fx = useRoom((s) => s.fx);
  const seen = useRef(fx.at(-1)?.seq ?? 0);
  const me = view.you?.id;
  useEffect(() => {
    for (const f of fx) {
      if (f.seq <= seen.current) continue;
      seen.current = f.seq;
      if (f.kind === 'resolve' && me && (f.payload as { payers: string[] }).payers.includes(me)) buzz([40, 60, 40]);
      if (f.kind === 'deal' && (f.payload as { readerId: string }).readerId === me) buzz(25);
    }
  }, [fx, me]);
}
