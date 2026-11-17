// Kazan: boş geçen turlarda dolan, köpüren cadı kazanı. İçindeki sayı biriken yudum.
import { motion } from 'motion/react';
import { useReducedMotion } from '../fx/motionPref';

export function Cauldron({ n, size = 44, label = true }: { n: number; size?: number; label?: boolean }) {
  const reduce = useReducedMotion();
  const fill = Math.min(1, n / 4);
  return (
    <span className="relative inline-flex flex-col items-center" role="img" aria-label={`Kazanda ${n} yudum birikti`}>
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
        {/* köpük kabarcıkları: doldukça çoğalır */}
        {n > 0 &&
          [0, 1, 2].slice(0, Math.ceil(n * 0.75)).map((i) => (
            <motion.circle
              key={i}
              cx={16 + i * 8}
              cy={14}
              r={2.5 + (i % 2)}
              fill="#A3E635"
              fillOpacity="0.8"
              animate={reduce ? undefined : { cy: [16, 6, 16], opacity: [0, 1, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.45 }}
            />
          ))}
        <path d="M6,18 L42,18 C43,32 36,42 24,42 C12,42 5,32 6,18 Z" fill="#1b1820" stroke="#ede6d6" strokeWidth="2" strokeLinejoin="round" />
        {/* iksir seviyesi */}
        <clipPath id="pot-clip">
          <path d="M6,18 L42,18 C43,32 36,42 24,42 C12,42 5,32 6,18 Z" />
        </clipPath>
        <rect x="0" y={42 - 24 * fill} width="48" height="48" fill="#5c8a1e" opacity="0.85" clipPath="url(#pot-clip)" />
        <path d="M4,18 L44,18" stroke="#ede6d6" strokeWidth="3" strokeLinecap="round" />
        <path d="M12,42 L9,46 M36,42 L39,46" stroke="#ede6d6" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {label && n > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#A3E635] px-1 text-[12px] font-extrabold text-ink-950">
          {n}
        </span>
      )}
    </span>
  );
}
