// Titrek mürekkep çerçeve: 3 path varyantı ~8 fps'te sırayla değişir ("line boil").
import { useMemo } from 'react';
import { wobblyRect } from './wobble';

interface Props {
  w?: number;
  h?: number;
  seed?: number;
  stroke?: string;
  width?: number;
  className?: string;
}

export function InkFrame({ w = 300, h = 100, seed = 1, stroke = 'var(--bone-100)', width = 2, className = '' }: Props) {
  const paths = useMemo(() => [0, 1, 2].map((i) => wobblyRect(w, h, seed * 7 + i, 1.5)), [w, h, seed]);
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
    >
      <g className="boil" fill="none" stroke={stroke} strokeWidth={width} strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {paths.map((d, i) => (
          <path key={i} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}
