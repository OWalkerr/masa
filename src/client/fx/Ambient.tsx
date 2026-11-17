// Ortam efektleri: tavandan ara ara inen bulanık örümcek, mum ışığında süzülen toz, köşelerde titreyen sıcak ışık.
// Hepsi pointer-events:none, yalnızca transform/opacity anime eder; "Hareketi azalt" açıksa çizilmez.
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from './motionPref';

// Korkunç örümcek: tamamen siyah, kıllı silüet. Baş aşağı sarkar (karın üstte, ipe bağlı; dişler altta).
// Eklemli uzun bacaklar, dikenler, tüylü karın. Arkadan yalnızca mum ışığı vurur (drop-shadow ile).
const INK = '#040305';

// Tüylü elips: kenarı sık, düzensiz kıllarla
function hairy(cx: number, cy: number, rx: number, ry: number, n: number, hair: number, seed: number): string {
  let a = seed;
  const rnd = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const h = i % 2 ? hair * (0.6 + rnd() * 0.9) : -hair * 0.2;
    pts.push(`${(cx + Math.cos(t) * (rx + h)).toFixed(1)},${(cy + Math.sin(t) * (ry + h)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

// Bacaklar (sağ taraf; sol ayna). [gövdeye bağlandığı nokta, diz, ayak]; i=0 en öndeki (başa yakın, aşağı uzanır)
const LEGS: [number, number, number, number, number, number][] = [
  [4, 70, 24, 82, 31, 99],
  [5, 66, 30, 60, 43, 85],
  [5, 62, 31, 45, 45, 58],
  [4, 58, 23, 33, 38, 22],
];

function SpiderSvg({ size }: { size: number }) {
  const body = useMemo(() => ({ abd: hairy(50, 38, 14, 18, 72, 2.2, 7), ceph: hairy(50, 64, 9, 9, 40, 1.4, 3) }), []);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden overflow="visible">
      {/* ip, karnın ucundaki örümcek memesine bağlanır */}
      <line x1="50" y1="-2" x2="50" y2="21" stroke="#ede6d6" strokeOpacity="0.55" strokeWidth="0.6" />
      <g className="spider-legs" stroke={INK} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {[-1, 1].flatMap((side) =>
          LEGS.map(([ax, ay, kx, ky, fx, fy], i) => {
            const X = (v: number) => 50 + side * v;
            // diken: her eklemin biraz ilerisinde kısa, dışa bakan çizgiler
            const sx = X((kx + fx) / 2), sy = (ky + fy) / 2;
            return (
              <g key={`${side}${i}`}>
                <path d={`M${X(ax)},${ay} L${X(kx)},${ky}`} strokeWidth="3.4" />
                <path d={`M${X(kx)},${ky} L${X(fx)},${fy}`} strokeWidth="2" />
                <path d={`M${X(fx)},${fy} l${side * 2.5},${fy > ky ? 3 : -3}`} strokeWidth="1.2" />
                <path d={`M${sx},${sy} l${side * 2.6},-1.6 M${X(kx)},${ky} l${side * 1.5},-2.4`} strokeWidth="0.9" />
              </g>
            );
          }),
        )}
      </g>
      {/* karın: iri ve tüylü; bel ince */}
      <path d={body.abd} fill={INK} />
      <path d="M46,54 Q50,58 54,54 L53,57 Q50,59 47,57 Z" fill={INK} />
      <path d={body.ceph} fill={INK} />
      {/* zehir dişleri ve dokunaçlar (palp) */}
      <g stroke={INK} fill="none" strokeLinecap="round">
        <path d="M46.5,71 Q44,76 46.5,80" strokeWidth="2.4" />
        <path d="M53.5,71 Q56,76 53.5,80" strokeWidth="2.4" />
        <path d="M45,70 Q39,74 40,79" strokeWidth="1.6" />
        <path d="M55,70 Q61,74 60,79" strokeWidth="1.6" />
      </g>
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
    size: 104 + Math.random() * 40, // ön planda: büyük ve hafif odak dışında
    blur: 0.5 + Math.random() * 0.8,
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
      style={{ left: `${d.x}vw`, filter: `blur(${d.blur}px) drop-shadow(0 0 2px #E8B04A55) drop-shadow(0 0 16px #E8B04A30)`, transformOrigin: '50% 0%' }}
      initial={{ y: '-14vh', rotate: 0, opacity: 1 }}
      animate={{ y: ['-14vh', down, down, down, '-14vh'], rotate: [0, 4, -5, 3, 0] }}
      transition={{ duration: total, times: [0, 2.6 / total, (2.6 + d.hang / 2) / total, (2.6 + d.hang) / total, 1], ease: ['easeOut', 'easeInOut', 'easeInOut', 'easeIn'] }}
      aria-hidden
    >
      {/* ipek ip: örümceğin üstünden ekranın tepesine */}
      <div className="absolute bottom-[98%] left-1/2 h-[120vh] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#ede6d640] to-[#ede6d68c]" />
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
