// Perde geçişi (2,5 sn): siyah-beyaz çizgili tiyatro perdesi kapanır, iplerle sarkan kukla TIK ve perde adı, perde açılır.
import { speak } from '../../audio/voice';
import { useEffect } from 'react';
import { tikLine, type TikMoment } from '../../tik/lines';
import { motion } from 'motion/react';
import { Tik } from '../../components/Tik';
import { useReducedMotion } from '../../fx/motionPref';
import { ACT_NAMES } from './TopBar';

export function ActCurtain({ act, drinking }: { act: number; drinking: boolean }) {
  const reduce = useReducedMotion();
  const times = [0, 0.22, 0.78, 1];
  const half = (side: 'l' | 'r') => (
    <motion.div
      className="stripes absolute inset-y-0 w-1/2"
      style={{ [side === 'l' ? 'left' : 'right']: 0, transformOrigin: side === 'l' ? 'left' : 'right', boxShadow: 'inset 0 0 60px #000' }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: [0, 1, 1, 0] }}
      transition={{ duration: 2.5, times, ease: 'easeInOut' }}
    />
  );
  if (reduce) {
    return (
      <motion.div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-ink-950" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 2.5, times }} role="status">
        <p className="font-gothic text-[48px]">Perde {act}</p>
        <p className="font-gothic text-[32px] text-bone-dim">{ACT_NAMES[act]}</p>
      </motion.div>
    );
  }
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" role="status" aria-label={`Perde ${act}: ${ACT_NAMES[act]}`}>
      {half('l')}
      {half('r')}
      <motion.div
        className="absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center"
        initial={{ y: -420 }}
        animate={{ y: [-420, 0, 0, -420] }}
        transition={{ duration: 2.5, times: [0, 0.32, 0.72, 1], ease: 'easeInOut' }}
      >
        {/* kukla ipleri */}
        <svg width="160" height="120" viewBox="0 0 160 120" aria-hidden>
          <path d="M30,0 L50,120 M80,0 L80,120 M130,0 L112,120" stroke="var(--bone-100)" strokeWidth="1.5" />
          <path d="M20,4 L140,4" stroke="var(--bone-100)" strokeWidth="5" strokeLinecap="round" />
        </svg>
        <div className="rounded-[20px] bg-ink-950/90 px-8 pb-6 pt-2 text-center shadow-[0_0_0_2px_var(--bone-100)]">
          <Tik size={110} variant={drinking ? 'raki' : 'tea'} className="mx-auto" />
          <p className="font-gothic text-[52px] leading-none">Perde {act}</p>
          <p className="font-gothic text-[34px] text-accent">{ACT_NAMES[act]}</p>
          <ActLine act={act} />
        </div>
      </motion.div>
    </div>
  );
}

function ActLine({ act }: { act: number }) {
  const text = tikLine(`act${act}` as TikMoment, `perde${act}`);
  useEffect(() => speak(text), [text]);
  return <p className="mx-auto mt-2 max-w-[240px] text-[16px] italic text-bone-dim">“{text}”</p>;
}
