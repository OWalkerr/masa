// Tür ikonları (mürekkep çizgi). Renk tek başına anlam taşımaz: ikon + tür adı birlikte gösterilir.
import type { CardType } from '../../../engine/cards';
import { spiral } from '../ink/wobble';

export function TypeIcon({ type, size = 22, color = 'var(--ink-950)' }: { type: CardType; size?: number; color?: string }) {
  const common = { fill: 'none', stroke: color, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let body;
  switch (type) {
    case 'question':
      body = (
        <g {...common}>
          <path d="M8,9 C8,4 16,3 16,8 C16,11 12,12 12,15" />
          <circle cx="12" cy="19.5" r="1" fill={color} />
        </g>
      );
      break;
    case 'dare':
      body = (
        <g {...common}>
          <path d="M9,22 L9,11 L15,11 L15,22" />
          <path d="M12,9 C15,6 13,3 12,2 C11,3 9,6 12,9 Z" fill={color} />
        </g>
      );
      break;
    case 'mostLikely':
      body = (
        <g {...common}>
          <path d="M3,13 L13,13 M13,13 L10,10 M13,13 L10,16" />
          <path d="M14,8 C17,8 21,10 21,13 C21,16 17,18 14,18" />
        </g>
      );
      break;
    case 'neverHave':
      body = (
        <g {...common}>
          <path d="M6,22 L6,9 C6,4 18,4 18,9 L18,22 Z" />
          <path d="M9,11 L15,17 M15,11 L9,17" />
        </g>
      );
      break;
    default:
      body = <path d={spiral(12, 12, 9, 2.4)} {...common} />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {body}
    </svg>
  );
}

// Yoğunluk: 1–3 mum alevi
export function Flames({ n, color = 'var(--ink-950)' }: { n: number; color?: string }) {
  return (
    <span className="flex items-end gap-[2px]" aria-label={`Yoğunluk ${n}`} role="img">
      {[1, 2, 3].map((i) => (
        <svg key={i} width="12" height="18" viewBox="0 0 12 18" aria-hidden className={i <= n ? '' : 'opacity-25'}>
          <path className={i <= n ? 'flame' : ''} d="M6,1 C10,6 10,9 6,11 C2,9 2,6 6,1 Z" fill={i <= n ? 'var(--accent)' : 'none'} stroke={color} strokeWidth="1.4" />
          <rect x="4" y="11" width="4" height="6" fill={color} />
        </svg>
      ))}
    </span>
  );
}
