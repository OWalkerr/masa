// TIK: masanın sunucusu. Alkollüde lale biçimli rakı kadehi, alkolsüzde ince belli çay bardağı.
// İnce çöp kolları, iri oyuk gözleri ve dikişli bir gülümsemesi vardır.
interface Props {
  variant?: 'raki' | 'tea';
  size?: number;
  className?: string;
  mood?: 'grin' | 'smirk';
  title?: string;
  liquid?: boolean; // bardak dolu mu
}

const STROKE = 'var(--bone-100)';

export function Tik({ variant = 'raki', size = 140, className = '', mood = 'grin', title = 'TIK', liquid = true }: Props) {
  const tea = variant === 'tea';
  const body = tea
    ? 'M62,44 C66,84 90,112 88,132 C86,152 64,182 70,214 L130,214 C136,182 114,152 112,132 C110,112 134,84 138,44 Z'
    : 'M66,38 C74,62 84,82 81,102 C62,124 54,170 74,202 C84,216 94,222 96,228 L104,228 C106,222 116,216 126,202 C146,170 138,124 119,102 C116,82 126,62 134,38 Z';
  const eyesY = tea ? 76 : 150;
  const mouthY = tea ? 104 : 180;
  const armY = tea ? 84 : 150;
  const smile =
    mood === 'grin'
      ? `M78,${mouthY} Q100,${mouthY + 16} 123,${mouthY - 3}`
      : `M82,${mouthY + 2} Q104,${mouthY + 8} 120,${mouthY - 6}`;
  // Dikişler: gülümseme boyunca kısa çapraz çizgiler
  const stitches = [0.15, 0.35, 0.55, 0.75, 0.92].map((t) => {
    const x = 78 + t * 45;
    const y = mouthY + Math.sin(t * Math.PI) * (mood === 'grin' ? 8 : 4) - t * 3;
    return `M${x - 3},${y - 5} L${x + 3},${y + 5}`;
  });
  return (
    <svg
      viewBox="0 0 200 260"
      width={size}
      height={(size * 260) / 200}
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <clipPath id={`tik-body-${variant}`}>
          <path d={body} />
        </clipPath>
        <radialGradient id="tik-glow" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="150" rx="95" ry="105" fill="url(#tik-glow)" />
      {/* kollar */}
      <g fill="none" stroke={STROKE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${tea ? 70 : 60},${armY} C46,${armY - 6} 36,${armY - 28} 28,${armY - 46}`} />
        <path d={`M28,${armY - 46} l-8,-6 M28,${armY - 46} l-2,-10 M28,${armY - 46} l6,-7`} />
        <path d={`M${tea ? 130 : 140},${armY} C156,${armY + 8} 166,${armY + 22} 178,${armY + 18}`} />
        <path d={`M178,${armY + 18} l8,-5 M178,${armY + 18} l9,3 M178,${armY + 18} l4,8`} />
      </g>
      {/* gövde */}
      <path d={body} fill="var(--ink-800)" fillOpacity="0.85" />
      <g clipPath={`url(#tik-body-${variant})`}>
        {liquid && (tea ? (
          <rect x="0" y="58" width="200" height="200" fill="#6E3B1A" />
        ) : (
          <rect x="0" y="118" width="200" height="200" fill="var(--bone-100)" fillOpacity="0.82" />
        ))}
        <path
          d={tea ? 'M72,52 C76,80 92,104 92,124' : 'M76,46 C82,66 90,84 86,104 C72,124 66,160 76,190'}
          stroke="var(--bone-100)"
          strokeOpacity="0.55"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      <path d={body} fill="none" stroke={STROKE} strokeWidth="3.2" strokeLinejoin="round" />
      {tea ? (
        <ellipse cx="100" cy="220" rx="50" ry="8" fill="var(--ink-800)" stroke={STROKE} strokeWidth="3" />
      ) : (
        <>
          <path d="M96,228 L96,244 M104,228 L104,244" stroke={STROKE} strokeWidth="3" />
          <ellipse cx="100" cy="246" rx="28" ry="5.5" fill="var(--ink-800)" stroke={STROKE} strokeWidth="3" />
        </>
      )}
      {/* iri oyuk gözler */}
      <g>
        <ellipse cx="85" cy={eyesY} rx="12" ry="15" fill="var(--ink-950)" stroke={STROKE} strokeWidth="2.5" />
        <ellipse cx="117" cy={eyesY - 2} rx="13" ry="16.5" fill="var(--ink-950)" stroke={STROKE} strokeWidth="2.5" />
        <circle cx="89" cy={eyesY - 5} r="2.6" fill="var(--bone-100)" />
        <circle cx="121" cy={eyesY - 8} r="3" fill="var(--bone-100)" />
        <path d={`M72,${eyesY - 20} q12,-7 22,0 M106,${eyesY - 24} q12,-8 24,2`} stroke={STROKE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
      {/* dikişli gülümseme */}
      <g stroke={tea || !liquid ? STROKE : 'var(--ink-950)'} strokeWidth="2.6" fill="none" strokeLinecap="round">
        <path d={smile} />
        {stitches.map((d, i) => (
          <path key={i} d={d} strokeWidth="2" />
        ))}
      </g>
    </svg>
  );
}
