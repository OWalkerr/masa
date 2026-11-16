// Katmanlı paralaks gece sahnesi: gökyüzü, dev dolunay, eğik İstanbul ahşap evleri, sokak lambası, iki sis katmanı.
// 45–90 sn'de bir yarasa ya da karga geçer. Hareketi azalt açıkken paralaks ve geçişler kapanır.
import { useEffect, useMemo, useRef, useState } from 'react';
import { makeRng } from '../../engine/rng';
import { spiral } from './ink/wobble';
import { useReducedMotion } from '../fx/motionPref';

interface House {
  d: string; // gövde + çatı
  windows: { x: number; y: number; w: number; h: number; lit: boolean }[];
  chimney: string;
}

// Eğik bir ahşap ev (cumbalı) üret
function makeHouses(seed: number, baseY: number, count: number, width: number, minH: number, maxH: number): House[] {
  const rng = makeRng(seed);
  const houses: House[] = [];
  let x = -20;
  for (let i = 0; i < count && x < width + 40; i++) {
    const w = 70 + rng.int(60);
    const h = minH + rng.int(maxH - minH);
    const lean = (rng.next() - 0.5) * 18; // eğiklik
    const top = baseY - h;
    const roofH = 26 + rng.int(30);
    const peakX = x + w / 2 + lean + (rng.next() - 0.5) * 20;
    const cumba = rng.next() > 0.35;
    const cy = top + h * 0.28;
    const cw = w * 0.55;
    const cx = x + (w - cw) / 2 + lean * 0.6;
    let d = `M${x},${baseY} L${x + lean * 0.4},${top + 6} `;
    d += `L${peakX - 4},${top - roofH} Q${peakX},${top - roofH - 6} ${peakX + 4},${top - roofH} `;
    d += `L${x + w + lean},${top + 2} L${x + w},${baseY} Z`;
    if (cumba) d += ` M${cx - 6},${cy} L${cx + cw + 6},${cy - 2} L${cx + cw + 4},${cy + 38} L${cx - 4},${cy + 40} Z`;
    const windows: House['windows'] = [];
    const rows = Math.max(1, Math.floor((h - 30) / 46));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 2; c++) {
        if (rng.next() < 0.3) continue;
        windows.push({
          x: x + 14 + c * (w / 2 - 4) + lean * (0.5 - r * 0.1),
          y: top + 22 + r * 46 + (cumba && r === 0 ? 10 : 0),
          w: 12 + rng.int(6),
          h: 18 + rng.int(6),
          lit: false,
        });
      }
    }
    const chX = x + w * (0.2 + rng.next() * 0.5) + lean * 0.5;
    const chTop = top - roofH * 0.5;
    const curl = rng.next() > 0.5 ? 1 : -1;
    const chimney = `M${chX},${chTop + 16} L${chX - 2},${chTop - 18} Q${chX + curl * 10},${chTop - 30} ${chX + curl * 4},${chTop - 38} L${chX + 6 + curl * 4},${chTop - 36} Q${chX + 8 + curl * 12},${chTop - 24} ${chX + 10},${chTop - 16} L${chX + 10},${chTop + 16} Z`;
    houses.push({ d, windows, chimney });
    x += w - 6;
  }
  return houses;
}

export function NightScene({ seed = 7 }: { seed?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const W = 1200;
  const far = useMemo(() => makeHouses(seed, 560, 18, W, 120, 260), [seed]);
  const near = useMemo(() => {
    const hs = makeHouses(seed + 99, 620, 14, W, 90, 200);
    // Tek bir pencere vurgu renginde yanar (tek ışık kaynağı ilkesi)
    const withWin = hs.filter((h) => h.windows.length > 0);
    const lit = withWin[Math.floor(withWin.length * 0.68)];
    if (lit) lit.windows[0]!.lit = true;
    return hs;
  }, [seed]);
  const stars = useMemo(() => {
    const rng = makeRng(seed + 5);
    return Array.from({ length: 46 }, () => ({ x: rng.int(W), y: rng.int(360), r: 0.6 + rng.next() * 1.4 }));
  }, [seed]);

  // Paralaks: imleç/eğim ile hafif kayma
  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      el.style.setProperty('--px', cx.toFixed(3));
      el.style.setProperty('--py', cy.toFixed(3));
      raf = requestAnimationFrame(loop);
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reduce]);

  const layer = (k: number) => ({
    transform: `translate3d(calc(var(--px, 0) * ${-k}px), calc(var(--py, 0) * ${-k * 0.5}px), 0)`,
  });

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} 700`} preserveAspectRatio="xMidYMax slice">
        <defs>
          <radialGradient id="ns-sky" cx="70%" cy="20%" r="80%">
            <stop offset="0%" stopColor="#24202B" />
            <stop offset="60%" stopColor="#141118" />
            <stop offset="100%" stopColor="var(--ink-950)" />
          </radialGradient>
          <radialGradient id="ns-moonglow" cx="50%" cy="50%" r="50%">
            <stop offset="40%" stopColor="var(--bone-100)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--bone-100)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ns-lamp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ns-vignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ink-950)" stopOpacity="0.2" />
            <stop offset="70%" stopColor="var(--ink-950)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--ink-950)" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <rect width={W} height="700" fill="url(#ns-sky)" />
        <g style={layer(4)}>
          {stars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--bone-100)" opacity={0.35 + (i % 3) * 0.15} />
          ))}
        </g>
        {/* dev dolunay */}
        <g style={layer(8)}>
          <circle cx="860" cy="190" r="230" fill="url(#ns-moonglow)" />
          <circle cx="860" cy="190" r="128" fill="var(--bone-100)" opacity="0.93" />
          <g fill="#BDB4A2" opacity="0.55">
            <circle cx="820" cy="160" r="20" /><circle cx="900" cy="230" r="28" /><circle cx="890" cy="140" r="11" /><circle cx="800" cy="232" r="9" />
          </g>
          <path d={spiral(860, 190, 60, 3)} fill="none" stroke="#BDB4A2" strokeWidth="2" opacity="0.4" />
        </g>
        {/* uzak çatılar */}
        <g style={layer(14)} fill="#221E27" stroke="var(--ash-500)" strokeWidth="1.5">
          {far.map((h, i) => (
            <g key={i}>
              <path d={h.chimney} />
              <path d={h.d} fillRule="nonzero" />
            </g>
          ))}
        </g>
        {/* yakın çatılar */}
        <g style={layer(26)}>
          {near.map((h, i) => (
            <g key={i}>
              <path d={h.chimney} fill="var(--ink-950)" stroke="var(--bone-100)" strokeOpacity="0.5" strokeWidth="2" />
              <path d={h.d} fill="var(--ink-950)" stroke="var(--bone-100)" strokeOpacity="0.55" strokeWidth="2" strokeLinejoin="round" />
              {h.windows.map((w, j) => (
                <g key={j}>
                  {w.lit && <circle cx={w.x + w.w / 2} cy={w.y + w.h / 2} r="46" fill="url(#ns-lamp)" />}
                  <path
                    d={`M${w.x},${w.y + w.h} L${w.x + 1},${w.y + 4} Q${w.x + w.w / 2},${w.y - 4} ${w.x + w.w - 1},${w.y + 4} L${w.x + w.w},${w.y + w.h} Z`}
                    fill={w.lit ? 'var(--accent)' : '#17141B'}
                    stroke="var(--bone-100)"
                    strokeOpacity="0.4"
                    strokeWidth="1.2"
                  />
                </g>
              ))}
            </g>
          ))}
          {/* eğri sokak lambası */}
          <g transform="translate(120 0)">
            <path d="M0,700 C4,600 -10,520 10,470 C24,436 54,430 62,452" fill="none" stroke="var(--bone-100)" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />
            <path d={spiral(-6, 560, 12, 2)} fill="none" stroke="var(--bone-100)" strokeOpacity="0.6" strokeWidth="2.5" />
            <circle cx="62" cy="478" r="70" fill="url(#ns-lamp)" />
            <path d="M50,454 L74,454 L70,480 L54,480 Z" fill="var(--accent)" fillOpacity="0.85" stroke="var(--bone-100)" strokeOpacity="0.7" strokeWidth="2" />
          </g>
        </g>
        <rect width={W} height="700" fill="url(#ns-vignette)" />
      </svg>
      {/* iki sis katmanı (yalnızca transform animasyonu) */}
      <div className="fog absolute bottom-[6%] left-0 h-[32%] w-[200%] opacity-40" style={{ background: 'radial-gradient(ellipse 18% 50% at 12% 60%, #3A3640aa, transparent 70%), radial-gradient(ellipse 22% 40% at 40% 70%, #3A364088, transparent 70%), radial-gradient(ellipse 18% 50% at 62% 60%, #3A3640aa, transparent 70%), radial-gradient(ellipse 22% 40% at 90% 70%, #3A364088, transparent 70%)' }} />
      <div className="fog fog-2 absolute bottom-0 left-0 h-[22%] w-[200%] opacity-50" style={{ background: 'radial-gradient(ellipse 25% 50% at 20% 80%, #2A2630, transparent 70%), radial-gradient(ellipse 25% 50% at 70% 80%, #2A2630, transparent 70%)' }} />
      {!reduce && <Flyer />}
      {/* kâğıt dokusu + vinyet */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, #000000aa 100%)' }} />
    </div>
  );
}

// 45–90 sn'de bir geçen yarasa ya da karga
function Flyer() {
  const [n, setN] = useState(0);
  useEffect(() => {
    let t: number;
    const schedule = (first: boolean) => {
      const delay = first ? 6000 + Math.random() * 8000 : 45000 + Math.random() * 45000;
      t = window.setTimeout(() => {
        if (!document.hidden) setN((x) => x + 1);
        schedule(false);
      }, delay);
    };
    schedule(true);
    return () => window.clearTimeout(t);
  }, []);
  if (n === 0) return null;
  const crow = n % 2 === 0;
  return (
    <svg key={n} className="bat-fly absolute left-0 top-0" width="60" height="30" viewBox="0 0 60 30">
      <g className="bat-wing" fill="var(--ink-950)" stroke="var(--bone-100)" strokeOpacity="0.5" strokeWidth="1">
        {crow ? (
          <path d="M30,16 C22,6 10,4 2,10 C12,10 18,14 22,18 L30,20 L38,18 C42,14 48,10 58,10 C50,4 38,6 30,16 Z" />
        ) : (
          <path d="M30,14 C26,8 16,4 2,8 C8,12 8,16 6,20 C12,17 18,18 22,22 C26,20 28,22 30,24 C32,22 34,20 38,22 C42,18 48,17 54,20 C52,16 52,12 58,8 C44,4 34,8 30,14 Z" />
        )}
      </g>
    </svg>
  );
}
