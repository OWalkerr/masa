// Eriyen mum zamanlayıcı: kalan süre kadar uzun mum; son 5 sn alev hızlanır.
import { useEffect } from 'react';
import { play } from '../../audio/sound';
import { useRemaining } from './hooks';

export function CandleTimer({ endsAt, total, label, beat }: { endsAt: number | null; total: number; label?: string; beat?: boolean }) {
  const left = useRemaining(endsAt);
  const sec = Math.ceil(left / 1000);
  // Son 5 sn: kalp atışı (yalnızca süresi işleyen kişide)
  useEffect(() => {
    if (beat && endsAt && sec > 0 && sec <= 5) play('heartbeat');
  }, [sec, beat, endsAt]);
  if (!endsAt) return null;
  const frac = Math.max(0, Math.min(1, left / total));
  const secs = Math.ceil(left / 1000);
  const urgent = secs <= 5;
  return (
    <div className="flex w-full items-center gap-3" role="timer" aria-label={`${label ?? 'Kalan süre'}: ${secs} saniye`}>
      <div className="relative h-[14px] flex-1 rounded-full bg-ink-950 shadow-[inset_0_0_0_1px_var(--ash-500)]">
        <div
          className="absolute inset-y-[3px] left-[3px] rounded-full bg-bone-100 transition-[width] duration-300 ease-linear"
          style={{ width: `calc(${frac * 100}% - 6px)` }}
        />
        <svg
          width="16"
          height="24"
          viewBox="0 0 16 24"
          className="absolute -top-[14px]"
          style={{ left: `calc(${frac * 100}% - 10px)` }}
          aria-hidden
        >
          <path
            className="flame"
            style={urgent ? { animationDuration: '0.25s' } : undefined}
            d="M8,2 C13,9 13,14 8,18 C3,14 3,9 8,2 Z"
            fill="var(--accent)"
          />
        </svg>
      </div>
      <span className={`w-[44px] text-right text-[18px] tabular-nums ${urgent ? 'text-accent' : 'text-bone-dim'}`}>{secs}</span>
    </div>
  );
}
