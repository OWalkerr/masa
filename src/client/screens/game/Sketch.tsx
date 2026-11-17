// Karakalem: parşömen üstüne mürekkep çizim. Çizen için tuval + araçlar, tahmin edenler için canlı çizim + tahmin kutusu.
// Çizim 0..1000 koordinatlarında taşınır; her ekran kendi boyutuna ölçekler.
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { SketchView, View } from '../../../engine/viewFor';
import { Avatar } from '../../components/Avatar';
import { useRoom } from '../../store/room';
import { buzz, useRemaining } from './hooks';

const INK = '#1d1612';
const PAPER = '#efe6d2';

// Yumuşak çizgi: orta noktalardan geçen ikinci derece eğriler
function drawStroke(ctx: CanvasRenderingContext2D, s: number[], k: number) {
  if (s.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(s[0]! * k, s[1]! * k);
  if (s.length === 2) {
    ctx.lineTo(s[0]! * k + 0.1, s[1]! * k + 0.1);
  } else {
    for (let i = 2; i < s.length - 2; i += 2) {
      const mx = ((s[i]! + s[i + 2]!) / 2) * k;
      const my = ((s[i + 1]! + s[i + 3]!) / 2) * k;
      ctx.quadraticCurveTo(s[i]! * k, s[i + 1]! * k, mx, my);
    }
    ctx.lineTo(s[s.length - 2]! * k, s[s.length - 1]! * k);
  }
  ctx.stroke();
}

function paint(canvas: HTMLCanvasElement, strokes: number[][], hidden = false) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.width;
  const k = size / 1000;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, size, size);
  // Hafif kâğıt lekesi (statik, ucuz)
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.75);
  g.addColorStop(0, '#00000000');
  g.addColorStop(1, '#5a3d2222');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  if (hidden) return;
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size * 0.008);
  for (const s of strokes) drawStroke(ctx, s, k);
}

function useCanvasSize(maxPx: number, fit = true) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => setSize(Math.round(Math.min(el.clientWidth, maxPx, fit ? window.innerHeight * 0.52 : Infinity)));
    on();
    const ro = new ResizeObserver(on);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxPx, fit]);
  return { ref, size };
}

// Canlı izleme: tam görünümden gelen çizgiler + aradaki parçalar (fx 'draw')
export function SketchBoard({ sk, maxPx = 560, className = '', fit = true }: { sk: SketchView; maxPx?: number; className?: string; fit?: boolean }) {
  const fx = useRoom((s) => s.fx);
  const { ref, size } = useCanvasSize(maxPx, fit);
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<number[][]>([]);
  const seen = useRef(fx.at(-1)?.seq ?? 0);
  const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;

  // Tam görünüm geldiğinde gerçeğe dön
  useEffect(() => {
    strokes.current = sk.strokes.map((s) => [...s]);
    if (canvas.current) paint(canvas.current, strokes.current);
  }, [sk.strokes, size]);

  // Aradaki parçaları sırayla ekle; sıra tutmazsa bir sonraki tam görünümü bekle
  useEffect(() => {
    let dirty = false;
    for (const f of fx) {
      if (f.seq <= seen.current) continue;
      seen.current = f.seq;
      if (f.kind !== 'draw') continue;
      const p = f.payload as { pos: number; fresh: boolean; s: number[] };
      const total = strokes.current.reduce((a, s) => a + s.length, 0);
      if (p.pos !== total) continue;
      if (p.fresh || !strokes.current.length) strokes.current.push([...p.s]);
      else strokes.current[strokes.current.length - 1]!.push(...p.s);
      dirty = true;
    }
    if (dirty && canvas.current) paint(canvas.current, strokes.current);
  }, [fx]);

  return (
    <div ref={ref} className={`w-full ${className}`}>
      <canvas
        ref={canvas}
        width={Math.round(size * dpr)}
        height={Math.round(size * dpr)}
        style={{ width: size, height: size }}
        className="mx-auto block rounded-[10px] shadow-[0_0_0_3px_#2a211b,0_14px_30px_#000b]"
        role="img"
        aria-label="Canlı çizim"
      />
    </div>
  );
}

// Çizen: dokunarak çizer, parçalar 150 ms'de bir gönderilir
// Ortak çizim tuvali: Karakalem'de çizen, Sergi'de herkes kullanır
export function DrawPad({ sk }: { sk: Pick<SketchView, 'strokes' | 'blind' | 'singleLine'> }) {
  const send = useRoom((s) => s.send);
  const { ref, size } = useCanvasSize(560);
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<number[][]>(sk.strokes.map((s) => [...s]));
  const pending = useRef<{ nums: number[]; fresh: boolean } | null>(null);
  const drawing = useRef(false);
  const usedStroke = useRef(sk.strokes.length > 0);
  const [over, setOver] = useState(false); // tek çizgi bitti
  const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;

  const redraw = () => {
    if (canvas.current) paint(canvas.current, strokes.current, sk.blind);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(redraw, [size]);
  // Geri al / temizle sonrası sunucu gerçeğine dön (çizmiyorken)
  useEffect(() => {
    if (drawing.current) return;
    strokes.current = sk.strokes.map((s) => [...s]);
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sk.strokes.length]);

  const flush = () => {
    const p = pending.current;
    if (!p || !p.nums.length) return;
    // En fazla 80 nokta: fazlası seyreltilir
    let nums = p.nums;
    if (nums.length > 160) {
      const step = Math.ceil(nums.length / 160);
      const out: number[] = [];
      for (let i = 0; i < nums.length; i += 2 * step) out.push(nums[i]!, nums[i + 1]!);
      out.push(nums[nums.length - 2]!, nums[nums.length - 1]!);
      nums = out.slice(0, 160);
    }
    send({ t: 'drawSeg', s: nums, n: p.fresh || undefined });
    pending.current = { nums: [], fresh: false };
  };
  useEffect(() => {
    const id = window.setInterval(flush, 160);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const point = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(1000, ((e.clientX - r.left) / r.width) * 1000)));
    const y = Math.round(Math.max(0, Math.min(1000, ((e.clientY - r.top) / r.height) * 1000)));
    return [x, y] as const;
  };

  const onDown = (e: React.PointerEvent) => {
    if (sk.singleLine && usedStroke.current) {
      setOver(true);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    flush();
    drawing.current = true;
    usedStroke.current = true;
    const [x, y] = point(e);
    strokes.current.push([x, y]);
    pending.current = { nums: [x, y], fresh: true };
    redraw();
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const [x, y] = point(e);
    const s = strokes.current[strokes.current.length - 1]!;
    const lx = s[s.length - 2]!, ly = s[s.length - 1]!;
    if (Math.abs(x - lx) + Math.abs(y - ly) < 5) return;
    s.push(x, y);
    pending.current!.nums.push(x, y);
    redraw();
  };
  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    flush();
    if (sk.singleLine) {
      setOver(true);
      buzz(40);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div ref={ref} className="relative w-full">
        <canvas
          ref={canvas}
          width={Math.round(size * dpr)}
          height={Math.round(size * dpr)}
          style={{ width: size, height: size, touchAction: 'none' }}
          className="mx-auto block rounded-[10px] shadow-[0_0_0_3px_#2a211b,0_14px_30px_#000b]"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          aria-label="Çizim alanı: parmağınla çiz"
        />
        {sk.blind && (
          <p className="pointer-events-none absolute inset-x-0 top-3 text-center text-[15px] font-bold text-[#5a4636]">Kör Ressam: çizdiğini göremiyorsun</p>
        )}
        {over && sk.singleLine && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[16px] font-bold text-[#7A1E24]">Kalem kalktı. Çizim bu kadar!</p>
        )}
      </div>
      {!sk.singleLine && (
        <div className="flex w-full max-w-[560px] gap-2">
          <button type="button" onClick={() => send({ t: 'drawUndo' })} className="min-h-[52px] flex-1 ink-tile text-[17px]">
            ↶ Geri al
          </button>
          <button type="button" onClick={() => send({ t: 'drawClear' })} className="min-h-[52px] flex-1 ink-tile text-[17px]">
            Sil, baştan
          </button>
        </div>
      )}
    </div>
  );
}

export function TimeBar({ sk }: { sk: Pick<SketchView, 'startAt' | 'endsAt'> }) {
  const left = useRemaining(sk.endsAt);
  const total = sk.endsAt - sk.startAt;
  const sec = Math.ceil(left / 1000);
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  return (
    <div className="flex w-full max-w-[560px] items-center gap-3" aria-label={`Kalan süre ${sec} saniye`}>
      <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-ink-950 shadow-[inset_0_0_0_1px_var(--ash-500)]">
        <div className={`h-full rounded-full transition-[width] duration-200 ${sec <= 10 ? 'bg-[#D7263D]' : 'bg-[var(--accent)]'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`w-10 text-right font-extrabold tabular-nums ${sec <= 10 ? 'text-[#FF6B5A]' : ''}`}>{sec}</span>
    </div>
  );
}

// Uçuşan yanlış tahminler ve bilenler
function GuessFeed({ view, sk, big = false }: { view: View; sk: SketchView; big?: boolean }) {
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  const avatar = (id: string) => view.players.find((p) => p.id === id)?.avatar ?? 0;
  const recent = sk.wrong.slice(big ? -10 : -6);
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-2">
      {sk.correct.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-live="polite">
          {sk.correct.map((id, i) => (
            <span key={id} className={`flex items-center gap-1 rounded-full bg-[#2E5E4E] px-3 py-1 font-bold ${big ? 'text-[24px]' : 'text-[15px]'}`}>
              <Avatar index={avatar(id)} size={big ? 34 : 22} />✓ {name(id)} bildi{i === 0 ? ' (ilk!)' : ''}
            </span>
          ))}
        </div>
      )}
      <ul className="flex flex-wrap gap-2" aria-label="Yanlış tahminler">
        <AnimatePresence initial={false}>
          {recent.map((w, i) => (
            <motion.li
              key={`${w.id}-${w.text}-${sk.wrong.length - recent.length + i}`}
              initial={{ opacity: 0, y: 14, scale: 0.8, rotate: -4 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: ((i * 37) % 7) - 3 }}
              exit={{ opacity: 0 }}
              className={`rounded-[14px] rounded-bl-[4px] bg-parchment-200 px-3 py-1 text-ink-text shadow-[0_4px_10px_#0008] ${big ? 'text-[24px]' : 'text-[15px]'}`}
            >
              <b>{name(w.id)}:</b> {w.text}?
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function GuessBox({ sk }: { sk: SketchView }) {
  const send = useRoom((s) => s.send);
  const fx = useRoom((s) => s.fx);
  const [text, setText] = useState('');
  const [close, setClose] = useState(false);
  const seen = useRef(fx.at(-1)?.seq ?? 0);
  useEffect(() => {
    for (const f of fx) {
      if (f.seq <= seen.current) continue;
      seen.current = f.seq;
      if (f.kind === 'guessClose') {
        setClose(true);
        buzz(30);
        window.setTimeout(() => setClose(false), 2500);
      }
    }
  }, [fx]);
  return (
    <form
      className="flex w-full max-w-[560px] flex-col gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        send({ t: 'guess', text });
        setText('');
      }}
    >
      <label htmlFor="guess" className="sr-only">Tahminin</label>
      <div className="flex gap-2">
        <input
          id="guess"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={40}
          autoComplete="off"
          autoCapitalize="off"
          enterKeyHint="send"
          placeholder="Bu ne? Yaz…"
          className="min-h-[56px] min-w-0 flex-1 rounded-[12px] bg-ink-950 px-3 text-[19px] shadow-[inset_0_0_0_2px_var(--ash-500)] outline-none focus:shadow-[inset_0_0_0_2px_var(--accent)]"
        />
        <button type="submit" className="min-h-[56px] rounded-[12px] bg-[var(--accent)] px-5 text-[18px] font-extrabold text-ink-950">
          Tahmin
        </button>
      </div>
      <p className="min-h-[22px] text-center text-[15px]" aria-live="polite">
        {close ? <b className="text-[var(--accent)]">Çok yakın!</b> : <span className="text-bone-dim">İpucu: {sk.hint}</span>}
      </p>
    </form>
  );
}

export function SketchPanel({ view }: { view: View }) {
  const g = view.game!;
  const sk = g.sketch!;
  const me = view.you?.id;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  const drawer = me === sk.drawer;
  const solved = !!me && sk.correct.includes(me);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      {drawer && sk.word && (
        <div className="w-full max-w-[560px] rounded-[14px] bg-[#3B2650] px-4 py-2 text-center shadow-[0_0_0_2px_#8E6CD8]">
          <span className="block text-[14px] text-bone-dim">Çizeceğin (kimseye gösterme)</span>
          <span className="text-[26px] font-extrabold leading-tight">{sk.word}</span>
        </div>
      )}
      <TimeBar sk={sk} />
      {drawer ? <DrawPad sk={sk} /> : <SketchBoard sk={sk} />}
      {!drawer && !solved && <GuessBox sk={sk} />}
      {!drawer && solved && <p className="ink-panel w-full max-w-[560px] p-3 text-center text-[17px]">Bildin! {name(sk.drawer)} sana minnettar.</p>}
      <GuessFeed view={view} sk={sk} />
    </div>
  );
}

// Ana Ekran: büyük tuval + akış
export function SketchTv({ view }: { view: View }) {
  const sk = view.game!.sketch!;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-[34px] font-bold">{name(sk.drawer)} çiziyor · <span className="tracking-widest text-bone-dim">{sk.hint}</span></p>
      <TimeBar sk={sk} />
      <GuessFeed view={view} sk={sk} big />
    </div>
  );
}

// Sonuç: son çizim küçük bir tablo gibi
export function SketchFinal({ strokes, word, size = 220, caption }: { strokes: number[][]; word: string; size?: number; caption?: React.ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
  useEffect(() => {
    if (canvas.current) paint(canvas.current, strokes);
  }, [strokes, size]);
  return (
    <figure className="flex flex-col items-center gap-2">
      <canvas
        ref={canvas}
        width={Math.round(size * dpr)}
        height={Math.round(size * dpr)}
        style={{ width: size, height: size }}
        className="rounded-[8px] shadow-[0_0_0_6px_#3a2a1e,0_0_0_8px_#c9a96b,0_14px_30px_#000b]"
        role="img"
        aria-label={`Çizim: ${word}`}
      />
      <figcaption className="text-center text-[15px] text-bone-dim">
        {caption ?? (
          <>
            Eser: <b className="text-bone-100">“{word}”</b>
          </>
        )}
      </figcaption>
    </figure>
  );
}
