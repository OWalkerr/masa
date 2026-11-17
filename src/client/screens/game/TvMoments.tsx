// Ana Ekran'ın büyük anları: sahne üstünde birkaç saniyelik gösteriler (oy sayımı, kazan, suçlu damgası, efsanevi kart, düello).
// Olaylar (fx) geldikçe sıraya girer, biri bitince öbürü oynar. Hareketi azaltta sade bir kart olarak görünür.
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { View } from '../../../engine/viewFor';
import { play } from '../../audio/sound';
import { Avatar } from '../../components/Avatar';
import { Cauldron } from '../../components/Cauldron';
import { useReducedMotion } from '../../fx/motionPref';
import { useRoom } from '../../store/room';
import { keyItem, useManifest } from '../../art/manifest';
import { Tik } from '../../components/Tik';

type Moment =
  | { k: 'tally'; rows: { id: string; n: number }[]; winners: string[] }
  | { k: 'pot'; id: string; units: number }
  | { k: 'guilty'; id: string }
  | { k: 'legend' }
  | { k: 'duel'; a: string; b: string };

const DURATION: Record<Moment['k'], number> = { tally: 5200, pot: 3800, guilty: 2800, legend: 2600, duel: 2600 };

export function TvMoments({ view }: { view: View }) {
  const fx = useRoom((s) => s.fx);
  const seen = useRef(fx.at(-1)?.seq ?? 0);
  const [queue, setQueue] = useState<Moment[]>([]);
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    const add: Moment[] = [];
    for (const f of fx) {
      if (f.seq <= seen.current) continue;
      seen.current = f.seq;
      const v = viewRef.current;
      const g = v.game;
      if (f.kind === 'resolve' && g?.result?.tally && Object.keys(g.result.tally).length) {
        const rows = Object.entries(g.result.tally).map(([id, n]) => ({ id, n })).sort((a, b) => b.n - a.n);
        const max = rows[0]?.n ?? 0;
        add.push({ k: 'tally', rows: rows.slice(0, 6), winners: rows.filter((r) => r.n === max).map((r) => r.id) });
      }
      if (f.kind === 'potSpill') add.push({ k: 'pot', ...(f.payload as { id: string; units: number }) });
      if (f.kind === 'catchResult' && (f.payload as { guilty: boolean }).guilty) add.push({ k: 'guilty', id: (f.payload as { accused: string }).accused });
      if (f.kind === 'reveal' && (f.payload as { rarity: string }).rarity === 'legendary') add.push({ k: 'legend' });
      if (f.kind === 'reveal' && g?.card?.type === 'duel' && g.targets.length === 2) add.push({ k: 'duel', a: g.targets[0]!, b: g.targets[1]! });
    }
    if (add.length) setQueue((q) => [...q, ...add].slice(-4));
  }, [fx]);

  const cur = queue[0];
  useEffect(() => {
    if (!cur) return;
    const t = window.setTimeout(() => setQueue((q) => q.slice(1)), DURATION[cur.k]);
    return () => window.clearTimeout(t);
  }, [cur]);

  return <AnimatePresence>{cur && <MomentView key={JSON.stringify(cur)} m={cur} view={view} />}</AnimatePresence>;
}

function MomentView({ m, view }: { m: Moment; view: View }) {
  const reduce = useReducedMotion();
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  const avatar = (id: string) => view.players.find((p) => p.id === id)?.avatar ?? 0;
  const drinking = view.settings.drinking;
  const kazanArt = keyItem(useManifest(), 'kazan');

  useEffect(() => {
    if (m.k === 'tally') {
      [0, 700, 1400].forEach((d) => window.setTimeout(() => play('heartbeat'), d));
      window.setTimeout(() => play('organ'), 2600);
    }
    if (m.k === 'pot') play('boom');
    if (m.k === 'guilty') play('seal');
    if (m.k === 'duel') play('crow');
  }, [m]);

  return (
    <motion.div
      className="absolute inset-0 z-[70] flex items-center justify-center bg-ink-950/93 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      aria-live="polite"
    >
      {m.k === 'tally' && (
        <div className="flex w-[1100px] flex-col gap-5">
          <p className="text-center font-gothic text-[72px]">Oylar sayılıyor…</p>
          {m.rows.map((r, i) => {
            const max = m.rows[0]!.n || 1;
            const win = m.winners.includes(r.id);
            return (
              <div key={r.id} className="flex items-center gap-6">
                <Avatar index={avatar(r.id)} size={86} />
                <span className="w-[300px] truncate text-[44px] font-bold">{name(r.id)}</span>
                <div className="h-[34px] flex-1 overflow-hidden rounded-full bg-ink-950 shadow-[inset_0_0_0_2px_var(--ash-500)]">
                  <motion.div
                    className={`h-full rounded-full ${win ? 'bg-[#D7263D]' : 'bg-bone-100'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(r.n / max) * 100}%` }}
                    transition={{ delay: reduce ? 0 : 0.5 + i * 0.35, duration: reduce ? 0 : 0.9, ease: 'easeOut' }}
                  />
                </div>
                <motion.span
                  className="w-[70px] text-right text-[48px] font-extrabold tabular-nums"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reduce ? 0 : 1.2 + i * 0.35 }}
                >
                  {r.n}
                </motion.span>
              </div>
            );
          })}
          <motion.p
            className="mt-4 text-center text-[56px] font-extrabold text-[#FF6B5A]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 2.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduce ? 0 : 2.6, type: 'spring', stiffness: 260, damping: 14 }}
          >
            {m.winners.map(name).join(' ve ')} {drinking ? 'içiyor!' : 'ceza alıyor!'}
          </motion.p>
        </div>
      )}

      {m.k === 'pot' && (
        <div className="flex flex-col items-center gap-6">
          <motion.div
            initial={{ rotate: 0, y: -40 }}
            animate={reduce ? { rotate: 0 } : { rotate: [0, -8, 8, -12, 70], y: [-40, 0, 0, 0, 30] }}
            transition={{ duration: 1.6, times: [0, 0.2, 0.4, 0.6, 1] }}
          >
            {kazanArt ? (
              <img
                src={kazanArt.w800}
                alt=""
                width={440}
                height={440}
                className="h-[440px] w-[440px] rounded-full object-cover shadow-[0_0_80px_#A3E63555]"
                style={{ maskImage: 'radial-gradient(circle, #000 58%, transparent 72%)', WebkitMaskImage: 'radial-gradient(circle, #000 58%, transparent 72%)' }}
              />
            ) : (
              <Cauldron n={m.units} size={260} label={false} />
            )}
          </motion.div>
          {!reduce && (
            <div className="pointer-events-none absolute left-1/2 top-1/2">
              {Array.from({ length: 18 }, (_, i) => (
                <motion.span
                  key={i}
                  className="absolute h-[18px] w-[18px] rounded-full bg-[#A3E635]"
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{ x: Math.cos((i / 18) * Math.PI) * (260 + (i % 4) * 60), y: [0, -160 - (i % 3) * 40, 240], opacity: [0, 1, 0] }}
                  transition={{ delay: 1.3, duration: 1.8, ease: 'easeOut' }}
                />
              ))}
            </div>
          )}
          <motion.p className="font-gothic text-[110px] text-[#A3E635]" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.4, type: 'spring', stiffness: 220, damping: 12 }}>
            Kazan devrildi!
          </motion.p>
          <p className="flex items-center gap-4 text-[54px] font-bold">
            <Avatar index={avatar(m.id)} size={90} />
            {name(m.id)} +{m.units} {drinking ? 'yudum' : 'ceza'}
          </p>
        </div>
      )}

      {m.k === 'guilty' && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-end gap-8">
            <Avatar index={avatar(m.id)} size={220} />
            <Tik size={170} pose="point" variant={drinking ? 'raki' : 'tea'} />
          </div>
          <motion.p
            className="rounded-[18px] border-[10px] border-[#D7263D] px-12 py-2 font-gothic text-[150px] leading-none text-[#D7263D]"
            initial={reduce ? { opacity: 0 } : { scale: 3.5, rotate: -18, opacity: 0 }}
            animate={{ scale: 1, rotate: -8, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 16 }}
          >
            SUÇLU!
          </motion.p>
          <p className="text-[48px] font-bold">{name(m.id)} kuralı bozdu</p>
        </div>
      )}

      {m.k === 'legend' && (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
          {!reduce && (
            <motion.div
              className="absolute h-[3000px] w-[3000px]"
              style={{ background: 'repeating-conic-gradient(from 0deg, #D4AF3740 0deg 6deg, transparent 6deg 18deg)' }}
              animate={{ rotate: 30 }}
              transition={{ duration: 2.6, ease: 'linear' }}
            />
          )}
          <Tik size={200} pose="cheer" className="absolute bottom-[90px] right-[160px]" />
          <motion.p className="relative font-gothic text-[140px] text-[#E8C26A]" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
            Efsanevi Kart
          </motion.p>
        </div>
      )}

      {m.k === 'duel' && (
        <div className="flex h-full w-full">
          <motion.div className="flex flex-1 flex-col items-center justify-center gap-6 bg-[#2a1f30]" initial={{ x: -900 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}>
            <Avatar index={avatar(m.a)} size={260} />
            <span className="text-[72px] font-extrabold">{name(m.a)}</span>
          </motion.div>
          <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" width="160" height="700" viewBox="0 0 28 120" aria-hidden>
            <motion.path d="M18,0 L6,48 L18,52 L4,120 L24,44 L12,40 Z" fill="var(--accent)" stroke="#fff" strokeWidth="1" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 0.3 }} />
          </svg>
          <motion.div className="flex flex-1 flex-col items-center justify-center gap-6 bg-[#1f2a30]" initial={{ x: 900 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}>
            <Avatar index={avatar(m.b)} size={260} />
            <span className="text-[72px] font-extrabold">{name(m.b)}</span>
          </motion.div>
          <p className="absolute top-[60px] w-full text-center font-gothic text-[110px]">Düello!</p>
        </div>
      )}
    </motion.div>
  );
}
