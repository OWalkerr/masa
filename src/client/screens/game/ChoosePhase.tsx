// Seçim: okuyucuya 3 kart tarot gibi yelpaze açar. Kartı yukarı kaydırarak ya da "Oyna" ile oynar.
// Diğerleri kapalı kartları ve "X kart seçiyor" yazısını görür.
import { tikLine } from '../../tik/lines';
import { TikSays } from '../../tik/TikSays';
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react';
import { useEffect, useState } from 'react';
import type { Card } from '../../../engine/cards';
import { DUR } from '../../../engine/types';
import type { View } from '../../../engine/viewFor';
import { Avatar } from '../../components/Avatar';
import { CardBack, GameCard } from '../../components/GameCard/GameCard';
import { InkButton } from '../../components/InkButton';
import { useReducedMotion } from '../../fx/motionPref';
import { preloadCards } from '../../art/manifest';
import { useRoom } from '../../store/room';
import { CandleTimer } from './CandleTimer';
import { useCardWidth, useLandscape, useNames } from './hooks';

const SPRING = { type: 'spring', stiffness: 260, damping: 22 } as const;

export function ChoosePhase({ view }: { view: View }) {
  const g = view.game!;
  const reader = view.players.find((p) => p.id === g.readerId);
  const isReader = view.you?.id === g.readerId;
  if (isReader && g.step === 'target' && g.card) return <TargetPicker view={view} card={g.card} />;
  if (isReader && g.hand) return <Hand view={view} hand={g.hand} />;

  return <Waiting view={view} readerName={reader?.name ?? '?'} readerAvatar={reader?.avatar ?? 0} />;
}

type HandItem = Card | { id: string; hidden: true };

function Hand({ view, hand }: { view: View; hand: HandItem[] }) {
  const g = view.game!;
  const send = useRoom((s) => s.send);
  const names = useNames(view);
  const w = useCardWidth(0.74, 320, 0.56);
  const [focus, setFocus] = useState(1);
  const [played, setPlayed] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const play = (id: string) => {
    if (played) return;
    setPlayed(id);
    send({ t: 'playCard', cardId: id });
  };
  const focused = hand[Math.min(focus, hand.length - 1)]!;
  useEffect(() => {
    preloadCards(hand.filter((c): c is Card => !('hidden' in c)));
  }, [hand]);
  return (
    // Yatay telefonda: yelpaze solda, yönerge ve "Oyna" sağda
    <div className="flex w-full flex-col items-center gap-3 land:grid land:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] land:content-center land:items-center land:gap-x-6 land:gap-y-3">
      <p className="text-center text-[18px] land:col-start-2 land:row-start-1 land:self-end land:text-[20px]" aria-live="polite">
        {g.blind ? 'Hayalet Saati: kartlar kapalı. Körlemesine seç.' : 'Sıra sende. Bir kart seç, yüksek sesle oku.'}
      </p>
      <div className="w-full max-w-[360px] px-2 land:col-start-2 land:row-start-2 land:justify-self-center empty:hidden">
        {g.phaseEndsAt && <CandleTimer endsAt={g.phaseEndsAt} total={DUR.choose + DUR.deal} label="Seçim süresi" beat />}
      </div>
      <div className="relative w-full land:col-start-1 land:row-span-5 land:row-start-1" style={{ height: w * 1.4 + 30 }}>
        {hand.map((c, i) => (
          <FanCard
            key={c.id + (g.turnNo ?? 0)}
            card={c}
            index={i}
            slot={i - (hand.length - 1) / 2}
            offset={i - focus}
            width={w}
            names={names}
            sober={!!view.you?.sober}
            inherited={g.inherited === c.id}
            played={played}
            reduce={reduce}
            onFocus={() => setFocus(i)}
            onPlay={() => play(c.id)}
          />
        ))}
      </div>
      <p className="text-[14px] text-bone-dim land:col-start-2 land:row-start-3 land:text-center">Yana dokun: diğer kart · Yukarı kaydır: oyna</p>
      {view.you?.powers.includes('swap') && !played && !g.blind && (
        <button
          type="button"
          onClick={() => send({ t: 'usePower', power: 'swap' })}
          className="min-h-[48px] rounded-[12px] bg-ink-800 px-4 text-[16px] shadow-[inset_0_0_0_1px_var(--ash-500)] land:col-start-2 land:row-start-4 land:justify-self-center"
        >
          Takas kullan: eli yeniden çek
        </button>
      )}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink-950 to-transparent px-4 pt-4 safe-bottom land:static land:col-start-2 land:row-start-5 land:w-full land:bg-none land:p-0">
        <InkButton className="mx-auto w-full max-w-sm" disabled={!!played} onClick={() => play(focused.id)} seed={51}>
          Oyna
        </InkButton>
      </div>
    </div>
  );
}

function FanCard(props: {
  card: HandItem; index: number; slot: number; offset: number; width: number; names: Record<string, string>; sober: boolean;
  inherited: boolean; played: string | null; reduce: boolean; onFocus(): void; onPlay(): void;
}) {
  const { card, index, slot, offset, width, played, reduce } = props;
  const y = useMotionValue(0);
  const lift = useTransform(y, [-160, 0], [1.04, 1]);
  const isFocus = offset === 0;
  const gone = played && played !== card.id;
  const chosen = played === card.id;
  // Yelpaze sabit: kartlar yerinde durur, seçilen kart hafifçe ortaya doğru süzülüp öne çıkar.
  const baseX = slot * width * 0.3;
  const x = isFocus ? slot * width * 0.1 : baseX;
  const rotate = reduce || isFocus ? 0 : slot * 5;
  // İlk dağıtımda sırayla gelir; sonraki dokunuşlarda gecikme yok
  const [dealt, setDealt] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setDealt(true), 700);
    return () => window.clearTimeout(t);
  }, []);
  const ease = { duration: reduce ? 0 : 0.26, ease: [0.25, 0.8, 0.3, 1] as const, delay: dealt || reduce ? 0 : index * 0.07 };

  useEffect(() => {
    if (!isFocus) void animate(y, 0, { duration: 0.2 });
  }, [isFocus, y]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -120 || info.velocity.y < -800) props.onPlay();
    else void animate(y, 0, SPRING);
  };

  return (
    <motion.div
      className="absolute left-1/2 top-3"
      style={{ marginLeft: -width / 2, zIndex: isFocus ? 10 : 5 - Math.abs(offset), y, scale: lift, touchAction: 'none' }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: baseX, rotate, scale: 0.9, top: 40 }}
      animate={
        gone
          ? { opacity: 0, scale: 0.9, transition: { duration: 0.35 } }
          : chosen
            ? { opacity: 1, x: 0, rotate: 0, scale: 1, top: -18, filter: 'brightness(1)', transition: { duration: 0.3 } }
            : {
                opacity: 1,
                x,
                rotate,
                top: isFocus ? 0 : 12,
                scale: isFocus ? 1 : 0.9,
                filter: isFocus ? 'brightness(1)' : 'brightness(0.62)',
                transition: ease,
              }
      }
      drag={isFocus && !played ? 'y' : false}
      dragConstraints={{ top: -220, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={onDragEnd}
      onClick={() => (isFocus ? undefined : props.onFocus())}
      role="button"
      tabIndex={0}
      aria-label={isFocus ? 'Seçili kart, oynamak için yukarı kaydır ya da Oyna düğmesine bas' : 'Bu karta geç'}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') (isFocus ? props.onPlay() : props.onFocus());
      }}
    >
      {'hidden' in card ? (
        <CardBack width={width} />
      ) : (
        <GameCard card={card} width={width} names={props.names} sober={props.sober} inherited={props.inherited} />
      )}
    </motion.div>
  );
}

function TargetPicker({ view, card }: { view: View; card: Card }) {
  const g = view.game!;
  const send = useRoom((s) => s.send);
  const need = g.needTargets;
  const [sel, setSel] = useState<string[]>([]);
  const w = useCardWidth(0.5, 200, 0.3);
  const names = useNames(view);
  const toggle = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : need === 1 ? [id] : s.length < need ? [...s, id] : s));
  return (
    <div className="flex flex-col items-center gap-4 pb-28 land:grid land:grid-cols-[auto_minmax(0,1fr)] land:items-center land:gap-x-8 land:gap-y-3 land:pb-4">
      <div className="land:row-span-4"><GameCard card={card} width={w} names={names} sober={!!view.you?.sober} /></div>
      <p className="text-center text-[20px]">{need === 2 ? 'Kartı oynayacak iki kişiyi seç' : 'Kart kime gidiyor?'}</p>
      <div className="w-full max-w-[360px] px-2">
        {g.phaseEndsAt && <CandleTimer endsAt={g.phaseEndsAt} total={DUR.target} label="Hedef seçme süresi" />}
      </div>
      <div role="group" aria-label="Oyuncular" className="grid w-full max-w-sm grid-cols-3 gap-3 px-2">
        {g.targetChoices.map((id) => {
          const p = view.players.find((x) => x.id === id)!;
          const on = sel.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(id)}
              className={`flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-[14px] land:min-h-[76px] ${on ? 'bg-parchment-200 text-ink-text' : 'ink-tile'}`}
            >
              <Avatar index={p.avatar} size={48} />
              <span className="max-w-full truncate px-1 text-[15px]">{on ? '✓ ' : ''}{p.name}</span>
            </button>
          );
        })}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink-950 to-transparent px-4 pt-4 safe-bottom land:static land:w-full land:bg-none land:p-0">
        <InkButton className="mx-auto w-full max-w-sm" disabled={sel.length !== need} onClick={() => send({ t: 'pickTarget', playerIds: sel })} seed={52}>
          Seç
        </InkButton>
      </div>
    </div>
  );
}

function Waiting({ view, readerName, readerAvatar }: { view: View; readerName: string; readerAvatar: number }) {
  const g = view.game!;
  const land = useLandscape();
  const w = useCardWidth(0.34, land ? 100 : 140, 0.24);
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-5 pt-6 land:grid land:grid-cols-2 land:items-center land:gap-x-8 land:gap-y-3 land:pt-2">
      <div className="relative land:row-span-3 land:justify-self-center" style={{ height: w * 1.4 + 20, width: w * 2.4 }}>
        {[0, 1, 2].slice(0, g.handCount || 3).map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-0"
            style={{ marginLeft: -w / 2 }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 200 }}
            animate={{ opacity: 1, y: 0, x: (i - 1) * w * 0.55, rotate: reduce ? 0 : (i - 1) * 8 }}
            transition={{ ...SPRING, delay: reduce ? 0 : i * 0.08 }}
          >
            <CardBack width={w} />
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Avatar index={readerAvatar} size={44} />
        <p className="text-[20px]" aria-live="polite">
          {readerName} kart seçiyor…
        </p>
      </div>
      <TikSays pose="doze" text={tikLine('waiting', `${view.code}${g.turnNo}`)} drinking={view.settings.drinking} />
      <div className="w-full max-w-[320px]">
        {g.phaseEndsAt && <CandleTimer endsAt={g.phaseEndsAt} total={g.step === "target" ? DUR.target : DUR.choose + DUR.deal} />}
      </div>
    </div>
  );
}
