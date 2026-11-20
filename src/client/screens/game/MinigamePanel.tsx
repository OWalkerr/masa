// Mini oyunlar: bomba (telefondan telefona zıplar), refleks (TIK'in bardağı dolar), geri sayım (içinden 10 say).
import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { View } from '../../../engine/viewFor';
import { Avatar } from '../../components/Avatar';
import { Tik } from '../../components/Tik';
import { useReducedMotion } from '../../fx/motionPref';
import { useRoom } from '../../store/room';
import { keyItem, useManifest } from '../../art/manifest';
import { buzz, useRemaining } from './hooks';

export function MinigamePanel({ view }: { view: View }) {
  const g = view.game!;
  const mg = g.mg!;
  const left = useRemaining(mg.startAt);
  const art = keyItem(useManifest(), `mg-${mg.kind}`);
  if (mg.stage === 'wait') {
    const n = Math.max(1, Math.ceil(left / 1000));
    return (
      <div className="flex flex-col items-center gap-2 py-2" role="status">
        <p className="text-center text-[20px]">{intro(mg.kind)}</p>
        <div className="relative flex items-center justify-center">
          {art && <img src={art.w400} alt="" width={220} height={220} className="h-[220px] w-[220px] rounded-[20px] object-cover shadow-[0_0_0_2px_#2a211b,0_14px_30px_#000b] land:h-[180px] land:w-[180px]" />}
          <motion.p
            key={n}
            className={`font-gothic leading-none text-accent ${art ? 'absolute -bottom-3 -right-3 flex h-[84px] w-[84px] items-center justify-center rounded-full bg-ink-950/95 text-[60px] shadow-[0_0_0_2px_var(--bone-100)]' : 'text-[96px]'}`}
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {n}
          </motion.p>
        </div>
      </div>
    );
  }
  if (mg.kind === 'bomb') return <Bomb view={view} />;
  if (mg.kind === 'reflex') return <Reflex view={view} />;
  return <Countdown view={view} />;
}

function intro(kind: string) {
  if (kind === 'bomb') return 'Bomba geliyor. Eline düşerse hemen at!';
  if (kind === 'reflex') return 'Bardak dolunca dokun. Erken dokunan da yanar!';
  return 'Başla deyince içinden 10 say ve dokun.';
}

function Bomb({ view }: { view: View }) {
  const g = view.game!;
  const mg = g.mg!;
  const send = useRoom((s) => s.send);
  const me = view.you!.id;
  const reduce = useReducedMotion();
  const mine = mg.holders.map((h, i) => ({ ...h, i })).filter((h) => !h.exploded && h.holder === me);
  const holding = mine.length > 0;
  useEffect(() => {
    if (holding) buzz([30, 30, 30]);
  }, [holding]);
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  return (
    <div className="flex w-full flex-col items-center gap-3">
      {holding ? (
        <motion.button
          type="button"
          onClick={() => send({ t: 'minigameInput', action: 'throw', bomb: mine[0]!.i })}
          className="flex h-[260px] w-full max-w-sm flex-col items-center justify-center rounded-[20px] bg-[#2A1215] shadow-[0_0_0_3px_var(--accent),0_0_40px_#D7263D66]"
          animate={reduce ? undefined : { scale: [1, 1.04, 1], rotate: [0, -2, 2, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
          aria-label="Bomba sende! At!"
        >
          <BombIcon size={150} lit />
          <span className="text-[44px] font-extrabold leading-none">AT!</span>
        </motion.button>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2" aria-live="polite">
          {mg.holders.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <BombIcon size={56} lit={!h.exploded} />
              <Avatar index={view.players.find((p) => p.id === h.holder)?.avatar ?? 0} size={44} />
              <span className="text-[18px]">{h.exploded ? `${name(h.holder)} uçtu!` : `Bomba ${name(h.holder)} elinde`}</span>
            </div>
          ))}
          <p className="text-bone-dim">Dua et sana gelmesin.</p>
        </div>
      )}
    </div>
  );
}

export function BombIcon({ size, lit }: { size: number; lit: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <path d="M58,26 C64,14 76,12 84,8" fill="none" stroke="var(--bone-100)" strokeWidth="3" strokeDasharray="4 3" />
      {lit && <path className="flame" style={{ animationDuration: '0.2s' }} d="M86,2 C92,8 92,13 86,16 C80,13 80,8 86,2 Z" fill="#FF8A3D" />}
      <rect x="44" y="22" width="20" height="12" rx="2" transform="rotate(20 54 28)" fill="var(--ink-800)" stroke="var(--bone-100)" strokeWidth="2.5" />
      <circle cx="46" cy="60" r="32" fill="var(--ink-950)" stroke="var(--bone-100)" strokeWidth="3" />
      <path d="M28,52 Q34,40 46,38" stroke="var(--bone-100)" strokeOpacity="0.5" strokeWidth="3" fill="none" />
      <ellipse cx="38" cy="62" rx="5" ry="7" fill="var(--bone-100)" />
      <ellipse cx="54" cy="60" rx="5" ry="7" fill="var(--bone-100)" />
      <path d="M36,76 q10,6 20,0" stroke="var(--bone-100)" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

function Reflex({ view }: { view: View }) {
  const mg = view.game!.mg!;
  const send = useRoom((s) => s.send);
  const filled = mg.filled;
  const tapped = mg.myTapped;
  const sentRef = useRef(false);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (filled) buzz(60);
  }, [filled]);
  const tap = () => {
    if (tapped || sentRef.current) return;
    sentRef.current = true;
    send({ t: 'minigameInput', action: 'tap' });
  };
  return (
    <button
      type="button"
      onPointerDown={tap}
      disabled={tapped}
      className={`flex h-[320px] w-full max-w-sm flex-col items-center justify-center gap-2 rounded-[20px] ${filled ? 'bg-[#20301f]' : 'bg-ink-800'} shadow-[inset_0_0_0_2px_var(--ash-500)]`}
      aria-label={tapped ? 'Dokundun' : filled ? 'Bardak doldu, dokun!' : 'Bekle, bardak dolunca dokun'}
    >
      <div className="relative">
        <Tik size={150} mood={filled ? 'grin' : 'smirk'} liquid={filled} pose={filled ? 'cheer' : undefined} />
        {!reduce && filled && <motion.div className="absolute inset-0 rounded-full" initial={{ boxShadow: '0 0 0 0 #EDE6D6' }} animate={{ boxShadow: '0 0 60px 20px #EDE6D600' }} transition={{ duration: 0.6 }} />}
      </div>
      <span className="text-[44px] font-extrabold leading-none" aria-live="assertive">
        {tapped ? 'Dokundun' : filled ? 'ŞİMDİ!' : 'Bekle…'}
      </span>
      <span className="text-[15px] text-bone-dim">{mg.tapped.length}/{view.players.filter((p) => !p.left).length} dokundu</span>
    </button>
  );
}

function Countdown({ view }: { view: View }) {
  const mg = view.game!.mg!;
  const send = useRoom((s) => s.send);
  const sentRef = useRef(false);
  const tap = () => {
    if (mg.myTapped || sentRef.current) return;
    sentRef.current = true;
    send({ t: 'minigameInput', action: 'tap' });
  };
  return (
    <button
      type="button"
      onPointerDown={tap}
      disabled={mg.myTapped}
      className="flex h-[300px] w-full max-w-sm flex-col items-center justify-center gap-3 rounded-[20px] bg-ink-800 shadow-[inset_0_0_0_2px_var(--ash-500)]"
      aria-label={mg.myTapped ? 'Dokundun' : 'İçinden 10 say, sonra dokun'}
    >
      <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden>
        <circle cx="45" cy="45" r="40" fill="none" stroke="var(--bone-100)" strokeWidth="3" />
        <path d="M45,45 L45,14 M45,45 L64,56" stroke="var(--bone-100)" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className="text-[34px] font-extrabold leading-none">{mg.myTapped ? 'Dokundun' : 'Say… ve dokun'}</span>
      <span className="text-[15px] text-bone-dim">{mg.tapped.length}/{view.players.filter((p) => !p.left).length} dokundu</span>
    </button>
  );
}
