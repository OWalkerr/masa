// Oyun ekranı (telefon): üst çubuk, ortada kart sahnesi, altta bağlama göre tek birincil eylem.
import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { View } from '../../engine/viewFor';
import { Avatar } from '../components/Avatar';
import { Tik } from '../components/Tik';
import { useReducedMotion } from '../fx/motionPref';
import { useRoom } from '../store/room';
import { ActCurtain } from './game/ActCurtain';
import { ActionPanel } from './game/ActionPanel';
import { CardStage } from './game/CardStage';
import { ChoosePhase } from './game/ChoosePhase';
import { CatchButton, CatchOverlay, CatchResultToast } from './game/Effects';
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
  const cardPhase = ['reveal', 'action', 'resolve', 'tableEvent', 'finale'].includes(view.phase);

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col pb-40">
      <TopBar view={view} />
      {view.phase === 'actIntro' && <ActCurtain key={g.act} act={g.act} drinking={drinking} />}
      <section className="flex flex-1 flex-col items-center gap-4 px-3">
        {view.phase === 'actIntro' && (
          <div className="flex flex-col items-center gap-3 pt-10">
            <Tik size={120} className="tik-bob" variant={drinking ? 'raki' : 'tea'} />
          </div>
        )}
        {view.phase === 'choose' && <ChoosePhase view={view} />}
        {cardPhase && g.card && <Played view={view} />}
      </section>
      <CatchButton view={view} />
      <CatchOverlay view={view} />
      <CatchResultToast view={view} />
    </main>
  );
}

function Played({ view }: { view: View }) {
  const g = view.game!;
  const big = useCardWidth(0.86, 340, 0.6);
  const small = useCardWidth(0.62, 250, 0.4);
  const reader = view.players.find((p) => p.id === g.readerId);
  const width = view.phase === 'reveal' || view.phase === 'tableEvent' || view.phase === 'finale' ? big : small;
  const legendary = g.card!.rarity === 'legendary' && view.phase === 'reveal';
  const duel = g.card!.type === 'duel' && view.phase !== 'resolve';
  return (
    <>
      {g.system ? (
        <p className="font-gothic text-[28px]">{view.phase === 'finale' ? 'Final' : 'Masa Olayı'}</p>
      ) : (
        <div className="flex items-center gap-2 text-[16px] text-bone-dim">
          {reader && <Avatar index={reader.avatar} size={28} />}
          <span>{reader?.name} okuyor</span>
        </div>
      )}
      {legendary && <LegendaryBurst />}
      {duel && <DuelSplit view={view} />}
      <CardStage key={g.card!.id + g.turnNo + view.phase.slice(0, 0)} view={view} card={g.card!} width={width} />
      {view.phase === 'action' && <ActionPanel view={view} />}
      {(view.phase === 'resolve' || view.phase === 'tableEvent') && <ResolvePanel view={view} />}
      {view.phase === 'finale' && <Tik size={110} className="tik-bob" variant={view.settings.drinking && !view.you?.sober ? 'raki' : 'tea'} />}
    </>
  );
}

// Legendary: ekran kararır, altın huzmeler, kısa sarsıntı (metin panelinin üstüne çıkmaz: kartın arkasında)
function LegendaryBurst() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.2, times: [0, 0.15, 0.7, 1] }}
      aria-hidden
    >
      <div className="absolute inset-0 bg-black/70" />
      <motion.div
        className="absolute left-1/2 top-[40%] h-[160vmax] w-[160vmax] -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'repeating-conic-gradient(from 0deg, #D4AF3733 0deg 6deg, transparent 6deg 18deg)' }}
        animate={{ rotate: 40 }}
        transition={{ duration: 2.2, ease: 'linear' }}
      />
    </motion.div>
  );
}

// Düello: ekran ikiye bölünür, ortada şimşek
function DuelSplit({ view }: { view: View }) {
  const g = view.game!;
  const [a, b] = g.targets.map((id) => view.players.find((p) => p.id === id));
  if (!a || !b) return null;
  return (
    <div className="flex w-full max-w-sm items-center justify-between rounded-[14px] bg-gradient-to-r from-[#2a1f30] via-ink-950 to-[#1f2a30] px-4 py-2">
      <span className="flex items-center gap-2"><Avatar index={a.avatar} size={36} />{a.name}</span>
      <svg width="20" height="40" viewBox="0 0 20 40" aria-hidden>
        <path d="M13,0 L4,18 L12,20 L3,40 L18,15 L10,13 Z" fill="var(--accent)" />
      </svg>
      <span className="flex items-center gap-2">{b.name}<Avatar index={b.avatar} size={36} /></span>
    </div>
  );
}

// Efekt olaylarına dokunsal geri bildirim (Android). iOS'ta titreşim yok; görsel efektler yeterli.
function useFxFeedback(view: View) {
  const fx = useRoom((s) => s.fx);
  const toast = useRoom((s) => s.toast);
  const seen = useRef(fx.at(-1)?.seq ?? 0);
  const me = view.you?.id;
  useEffect(() => {
    for (const f of fx) {
      if (f.seq <= seen.current) continue;
      seen.current = f.seq;
      if (f.kind === 'resolve' && me && (f.payload as { payers: string[] }).payers.includes(me)) buzz([40, 60, 40]);
      if (f.kind === 'deal' && (f.payload as { readerId: string }).readerId === me) buzz(25);
      if (f.kind === 'powerEarned') {
        const names: Record<string, string> = { shield: 'Kalkan', mirror: 'Ayna', swap: 'Takas', sabotage: 'Sabotaj' };
        toast(`Cebine bir ${names[(f.payload as { power: string }).power] ?? 'güç'} girdi.`);
        buzz(30);
      }
      if (f.kind === 'pass') {
        const id = (f.payload as { playerId: string }).playerId;
        const n = view.players.find((p) => p.id === id)?.name;
        if (n) toast(`${n} pas geçti.`);
      }
      if (f.kind === 'waterBreak') toast('Su Molası: bir bardak su iç. Bedellerin artık ceza.');
    }
  }, [fx, me, toast, view.players]);
}
