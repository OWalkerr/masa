// Ortam efektleri: tavandan ara ara inen bulanık örümcek, mum ışığında süzülen toz, köşelerde titreyen sıcak ışık.
// Hepsi pointer-events:none, yalnızca transform/opacity anime eder; "Hareketi azalt" açıksa çizilmez.
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from './motionPref';

// Gotik, ince bacaklı örümcek (Burton çizgisi): tek parça SVG, bacaklar adım adım kıpırdar
function SpiderSvg({ size }: { size: number }) {
  const legs = [-1, 1].flatMap((side) =>
    [0, 1, 2, 3].map((i) => {
      const y = 22 + i * 5;
      const kx = 26 + side * (14 + i * 2);
      const fx = 26 + side * (24 + (i === 0 || i === 3 ? 4 : 0));
      const fy = y + (i < 2 ? -12 + i * 4 : 6 + (i - 2) * 8);
      return { d: `M26,${y} Q${kx},${y - 10} ${fx},${fy}`, side, i };
    }),
  );
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 52 62" aria-hidden>
      <g className="spider-legs" stroke="#3a3142" strokeWidth="2.8" fill="none" strokeLinecap="round">
        {legs.map((l) => (
          <path key={`${l.side}${l.i}`} d={l.d} />
        ))}
      </g>
      <ellipse cx="26" cy="36" rx="9" ry="11" fill="#2b2430" stroke="#ede6d6" strokeOpacity="0.7" strokeWidth="1" />
      <ellipse cx="26" cy="22" rx="6" ry="5.5" fill="#342c3a" stroke="#ede6d6" strokeOpacity="0.7" strokeWidth="1" />
      {/* çizgili sırt: siyah-beyaz tema */}
      <path d="M19,33 Q26,30 33,33 M18,38 Q26,35 34,38 M19,43 Q26,40 33,43" stroke="#ede6d6" strokeOpacity="0.55" strokeWidth="1.3" fill="none" />
      {/* iri, oyuk gözler */}
      <circle cx="23.5" cy="21" r="2.2" fill="#ede6d6" />
      <circle cx="28.5" cy="21" r="2.2" fill="#ede6d6" />
      <circle cx="23.8" cy="21.3" r="0.9" fill="#120e14" />
      <circle cx="28.2" cy="21.3" r="0.9" fill="#120e14" />
    </svg>
  );
}

interface Drop {
  id: number;
  x: number; // vw
  depth: number; // ne kadar aşağı iner (vh)
  size: number;
  blur: number;
  hang: number; // asılı kalma süresi (sn)
}

function nextDrop(id: number): Drop {
  const leftSide = Math.random() < 0.5;
  return {
    id,
    x: leftSide ? 6 + Math.random() * 14 : 64 + Math.random() * 12,
    depth: 16 + Math.random() * 20,
    size: 82 + Math.random() * 34, // ön planda: büyük ve odak dışında
    blur: 0.9 + Math.random() * 0.9,
    hang: 4 + Math.random() * 4,
  };
}

// İp + örümcek: iner, sallanır, bekler, tırmanır
function Spider({ d, onDone }: { d: Drop; onDone: () => void }) {
  const total = 2.6 + d.hang + 2.2;
  useEffect(() => {
    const t = window.setTimeout(onDone, total * 1000 + 200);
    return () => window.clearTimeout(t);
  }, [onDone, total]);
  const down = `${d.depth}vh`;
  return (
    <motion.div
      className="pointer-events-none fixed top-0 z-[60]"
      style={{ left: `${d.x}vw`, filter: `blur(${d.blur}px) drop-shadow(0 0 8px #ede6d690)`, transformOrigin: '50% 0%' }}
      initial={{ y: '-14vh', rotate: 0, opacity: 0.95 }}
      animate={{ y: ['-14vh', down, down, down, '-14vh'], rotate: [0, 4, -5, 3, 0] }}
      transition={{ duration: total, times: [0, 2.6 / total, (2.6 + d.hang / 2) / total, (2.6 + d.hang) / total, 1], ease: ['easeOut', 'easeInOut', 'easeInOut', 'easeIn'] }}
      aria-hidden
    >
      {/* ipek ip: örümceğin üstünden ekranın tepesine */}
      <div className="absolute bottom-full left-1/2 h-[120vh] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#ede6d655] to-[#ede6d6aa]" />
      <SpiderSvg size={d.size} />
    </motion.div>
  );
}

// Mum ışığında süzülen toz zerreleri (sabit sayıda, CSS ile)
function Dust() {
  const motes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        i,
        left: Math.random() * 100,
        top: 30 + Math.random() * 65,
        size: 1.5 + Math.random() * 2.5,
        dur: 14 + Math.random() * 16,
        delay: -Math.random() * 20,
        drift: (Math.random() - 0.5) * 60,
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      {motes.map((m) => (
        <span
          key={m.i}
          className="dust-mote absolute rounded-full"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.size,
            animationDuration: `${m.dur}s`,
            animationDelay: `${m.delay}s`,
            ['--drift' as string]: `${m.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export function Ambient({ spiders = true }: { spiders?: boolean }) {
  const reduce = useReducedMotion();
  const [drop, setDrop] = useState<Drop | null>(null);
  useEffect(() => {
    if (reduce || !spiders) return;
    let n = 0;
    let t = 0;
    // İlk örümcek 25–45 sn sonra, sonra her 50–110 sn'de bir; sekme gizliyken inmez
    const schedule = (ms: number) => {
      t = window.setTimeout(() => {
        if (document.visibilityState === 'visible') setDrop(nextDrop(++n));
        schedule(50_000 + Math.random() * 60_000);
      }, ms);
    };
    schedule(25_000 + Math.random() * 20_000);
    // Önizleme/test: ?spider=1 ya da 'masa:spider' olayı örümceği hemen indirir
    const now = () => setDrop(nextDrop(++n));
    window.addEventListener('masa:spider', now);
    const q = new URLSearchParams(location.search).get('spider') === '1' ? window.setTimeout(now, 800) : 0;
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(q);
      window.removeEventListener('masa:spider', now);
    };
  }, [reduce, spiders]);
  if (reduce) return null;
  return (
    <>
      <Dust />
      {/* köşelerde titreyen sıcak mum ışığı */}
      <div className="candle-glow pointer-events-none fixed inset-0 z-[1]" aria-hidden />
      <AnimatePresence>{drop && <Spider key={drop.id} d={drop} onDone={() => setDrop(null)} />}</AnimatePresence>
    </>
  );
}
