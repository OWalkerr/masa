// 12 gotik masal avatarı (mürekkep çizgi, iri oyuk gözler, dikişler). Emoji yok.
import type { ReactNode } from 'react';
import { keyItem, useManifest } from '../art/manifest';

const S = 'var(--bone-100)';
const D = 'var(--ink-950)';

export const AVATAR_NAMES = [
  // Çizilmiş görsellere göre adlandırıldı (assets-raw/avatar-01…12)
  'Garson İskelet', 'Kara Kedi', 'Simitçi', 'Çaycı Nine', 'Bereli Martı', 'Kemençeci İskelet',
  'Atkılı Çocuk', 'Vampir DJ', 'Şair', 'Terzi', 'Dolmuşçu', 'Balıkçı',
];

// Ortak oyuk göz
const eye = (cx: number, cy: number, rx = 6, ry = 8) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={D} stroke={S} strokeWidth="2" />
    <circle cx={cx + rx * 0.3} cy={cy - ry * 0.35} r={Math.max(1.2, rx * 0.25)} fill={S} />
  </g>
);
const stitchMouth = (x1: number, x2: number, y: number, curve = 4) => {
  const n = 4;
  return (
    <g stroke={S} strokeWidth="2" fill="none" strokeLinecap="round">
      <path d={`M${x1},${y} Q${(x1 + x2) / 2},${y + curve} ${x2},${y}`} />
      {Array.from({ length: n }, (_, i) => {
        const x = x1 + ((i + 0.5) / n) * (x2 - x1);
        return <path key={i} d={`M${x - 1.5},${y - 3} L${x + 1.5},${y + 4}`} strokeWidth="1.5" />;
      })}
    </g>
  );
};

const ART: ReactNode[] = [
  // 0 Hayalet
  <g key="0">
    <path d="M28,82 C26,50 30,22 50,20 C70,22 74,50 72,82 l-7,-6 l-7,7 l-8,-7 l-8,7 l-7,-7 Z" fill="var(--bone-100)" fillOpacity="0.14" stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
    {eye(42, 45, 6, 9)}{eye(59, 44, 7, 10)}
    <ellipse cx="51" cy="64" rx="4" ry="5" fill={D} stroke={S} strokeWidth="1.8" />
  </g>,
  // 1 Kara Kedi
  <g key="1">
    <path d="M26,40 L30,16 L44,30 Q50,28 56,30 L70,16 L74,40 C80,62 68,80 50,80 C32,80 20,62 26,40 Z" fill={D} stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
    <ellipse cx="40" cy="48" rx="6" ry="8" fill="var(--accent)" fillOpacity="0.9" stroke={S} strokeWidth="1.5" />
    <ellipse cx="60" cy="48" rx="6" ry="8" fill="var(--accent)" fillOpacity="0.9" stroke={S} strokeWidth="1.5" />
    <path d="M40,42 v12 M60,42 v12" stroke={D} strokeWidth="2.5" />
    <path d="M47,60 l3,3 l3,-3 M50,63 q-6,7 -10,3 M50,63 q6,7 10,3" stroke={S} strokeWidth="1.8" fill="none" />
    <path d="M22,60 l-12,-2 M22,64 l-12,3 M78,60 l12,-2 M78,64 l12,3" stroke={S} strokeWidth="1.3" />
  </g>,
  // 2 Baykuş
  <g key="2">
    <path d="M24,30 L34,22 Q50,18 66,22 L76,30 C82,56 74,84 50,84 C26,84 18,56 24,30 Z" fill="var(--ink-800)" stroke={S} strokeWidth="2.5" />
    <circle cx="38" cy="44" r="12" fill="none" stroke={S} strokeWidth="2" />
    <circle cx="62" cy="44" r="12" fill="none" stroke={S} strokeWidth="2" />
    {eye(38, 44, 7, 7)}{eye(62, 44, 7, 7)}
    <path d="M46,56 L50,64 L54,56 Z" fill={S} />
    <path d="M34,70 q4,4 8,0 q4,4 8,0 q4,4 8,0 q4,4 8,0" stroke={S} strokeWidth="1.5" fill="none" />
  </g>,
  // 3 Kuzgun
  <g key="3">
    <path d="M30,74 C20,54 26,28 48,24 C66,22 76,36 74,50 L94,58 L72,62 C70,76 54,84 30,74 Z" fill={D} stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
    {eye(56, 44, 6, 7)}
    <path d="M36,30 l-6,-12 M42,27 l-2,-13 M48,25 l3,-12" stroke={S} strokeWidth="2" strokeLinecap="round" />
    <path d="M34,62 q8,6 16,0" stroke={S} strokeWidth="1.5" fill="none" />
  </g>,
  // 4 Kabak
  <g key="4">
    <path d="M50,26 C30,24 16,40 18,58 C20,76 36,84 50,82 C64,84 80,76 82,58 C84,40 70,24 50,26 Z" fill="var(--ink-800)" stroke={S} strokeWidth="2.5" />
    <path d="M50,26 C42,40 42,70 50,82 M50,26 C58,40 58,70 50,82 M34,30 C26,46 28,70 38,80 M66,30 C74,46 72,70 62,80" stroke="var(--ash-500)" strokeWidth="2" fill="none" />
    <path d="M50,26 C48,18 52,12 58,10" stroke={S} strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M32,46 L42,40 L42,52 Z M68,46 L58,40 L58,52 Z" fill="var(--accent)" stroke={S} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M30,62 L36,66 L42,61 L50,67 L58,61 L64,66 L70,62 L64,72 L50,74 L36,72 Z" fill="var(--accent)" stroke={S} strokeWidth="1.5" strokeLinejoin="round" />
  </g>,
  // 5 Kemik Kukla (sevimli kafatası)
  <g key="5">
    <path d="M50,18 C30,18 20,32 22,50 C23,60 30,64 32,70 L34,80 L66,80 L68,70 C70,64 77,60 78,50 C80,32 70,18 50,18 Z" fill="var(--bone-100)" fillOpacity="0.16" stroke={S} strokeWidth="2.5" />
    <ellipse cx="38" cy="48" rx="9" ry="10" fill={D} stroke={S} strokeWidth="2" />
    <ellipse cx="62" cy="48" rx="9" ry="10" fill={D} stroke={S} strokeWidth="2" />
    <circle cx="40" cy="45" r="2.3" fill={S} /><circle cx="64" cy="45" r="2.3" fill={S} />
    <path d="M47,62 L50,57 L53,62 Z" fill={D} stroke={S} strokeWidth="1.5" />
    <path d="M38,72 h24 M42,68 v8 M48,68 v8 M54,68 v8 M60,68 v8" stroke={S} strokeWidth="1.6" />
  </g>,
  // 6 Mum
  <g key="6">
    <path d="M32,40 C32,36 68,36 68,40 L66,84 L34,84 Z" fill="var(--bone-100)" fillOpacity="0.18" stroke={S} strokeWidth="2.5" />
    <path d="M36,40 q2,8 -1,14 M62,40 q-2,10 2,16" stroke={S} strokeWidth="2" fill="none" />
    <path d="M50,36 v-8" stroke={S} strokeWidth="2" />
    <path className="flame" d="M50,8 C56,16 58,24 50,30 C42,24 44,16 50,8 Z" fill="var(--accent)" stroke={S} strokeWidth="1.5" />
    {eye(43, 56, 5, 7)}{eye(58, 56, 5, 7)}
    {stitchMouth(42, 59, 70, 4)}
  </g>,
  // 7 Örümcek
  <g key="7">
    <path d="M50,6 v20" stroke={S} strokeWidth="1.5" />
    <g stroke={S} strokeWidth="2.2" fill="none" strokeLinecap="round">
      <path d="M36,46 q-14,-14 -22,-6 M36,52 q-16,-4 -24,6 M38,58 q-12,6 -16,18 M40,62 q-6,10 -6,22" />
      <path d="M64,46 q14,-14 22,-6 M64,52 q16,-4 24,6 M62,58 q12,6 16,18 M60,62 q6,10 6,22" />
    </g>
    <ellipse cx="50" cy="52" rx="16" ry="20" fill={D} stroke={S} strokeWidth="2.5" />
    {eye(43, 46, 5, 6)}{eye(57, 46, 5, 6)}
    <circle cx="50" cy="38" r="2" fill={S} />
    {stitchMouth(42, 58, 60, 3)}
  </g>,
  // 8 Ay Yüzlü
  <g key="8">
    <path d="M62,14 C38,14 20,32 20,52 C20,72 38,88 62,88 C44,80 36,66 36,52 C36,36 46,22 62,14 Z" fill="var(--bone-100)" fillOpacity="0.85" stroke={S} strokeWidth="2.5" />
    <ellipse cx="34" cy="46" rx="4.5" ry="6.5" fill={D} />
    <path d="M27,62 q6,5 10,0" stroke={D} strokeWidth="2" fill="none" />
    <circle cx="28" cy="34" r="2" fill="var(--ash-500)" /><circle cx="40" cy="74" r="2.6" fill="var(--ash-500)" />
    <path d="M72,30 l2,5 l5,1 l-4,3 l1,5 l-4,-3 l-4,3 l1,-5 l-4,-3 l5,-1 Z" fill={S} />
  </g>,
  // 9 Yarasa
  <g key="9">
    <path d="M50,36 C42,36 38,44 38,52 C30,44 18,40 8,44 C14,50 14,58 12,64 C20,60 28,62 34,68 C38,76 44,80 50,80 C56,80 62,76 66,68 C72,62 80,60 88,64 C86,58 86,50 92,44 C82,40 70,44 62,52 C62,44 58,36 50,36 Z" fill={D} stroke={S} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M42,38 L40,26 L47,35 M58,38 L60,26 L53,35" fill={D} stroke={S} strokeWidth="2" strokeLinejoin="round" />
    {eye(44, 52, 4.5, 6)}{eye(56, 52, 4.5, 6)}
    <path d="M45,66 l2,4 l2,-4 M51,66 l2,4 l2,-4" stroke={S} strokeWidth="1.4" fill="none" />
  </g>,
  // 10 Fesli Bebek (dikişli bez bebek)
  <g key="10">
    <path d="M36,28 L40,10 L60,10 L64,28 Z" fill="var(--accent)" fillOpacity="0.85" stroke={S} strokeWidth="2" strokeLinejoin="round" />
    <path d="M50,10 q8,-4 10,6 l2,10" stroke={S} strokeWidth="1.5" fill="none" />
    <ellipse cx="50" cy="54" rx="24" ry="27" fill="var(--parchment-200)" fillOpacity="0.2" stroke={S} strokeWidth="2.5" />
    <path d="M30,44 q20,-6 40,0" stroke={S} strokeWidth="1.3" strokeDasharray="3 3" fill="none" />
    <circle cx="40" cy="52" r="6" fill="none" stroke={S} strokeWidth="2" />
    <path d="M36,48 l8,8 M44,48 l-8,8" stroke={S} strokeWidth="2" />
    {eye(60, 52, 6, 7)}
    {stitchMouth(38, 62, 68, 5)}
  </g>,
  // 11 Çizgili Kukla
  <g key="11">
    <path d="M50,4 v14 M32,4 l6,16 M68,4 l-6,16" stroke="var(--ash-500)" strokeWidth="1.4" />
    <ellipse cx="50" cy="44" rx="20" ry="22" fill="var(--ink-800)" stroke={S} strokeWidth="2.5" />
    {eye(42, 42, 6, 8)}{eye(59, 42, 6, 8)}
    <path d="M43,56 q7,6 14,0" stroke={S} strokeWidth="2" fill="none" />
    <path d="M30,62 L70,62 L74,92 L26,92 Z" fill={D} stroke={S} strokeWidth="2.2" />
    <path d="M29,70 h42 M28,78 h44 M27,86 h46" stroke={S} strokeWidth="3.5" />
  </g>,
];

interface Props {
  index: number;
  size?: number;
  dim?: boolean;
  className?: string;
  label?: string;
}

export function Avatar({ index, size = 56, dim = false, className = '', label }: Props) {
  const i = ((index % 12) + 12) % 12;
  const m = useManifest();
  const img = keyItem(m, m?.avatars[String(i)]);
  if (img) {
    return (
      <img
        src={img.w400}
        width={size}
        height={size}
        // Avatar hep bir ismin yanında durur: yalnızca açık etiket verildiyse okunur, yoksa süs
        alt={label ?? ''}
        className={`rounded-full object-cover shadow-[0_0_0_2px_var(--ash-500)] ${className} ${dim ? 'opacity-40 grayscale' : ''}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`${className} ${dim ? 'opacity-40 grayscale' : ''}`}
      role="img"
      aria-label={label ?? AVATAR_NAMES[i]}
    >
      <circle cx="50" cy="50" r="48" fill="var(--ink-950)" stroke="var(--ash-500)" strokeWidth="2" />
      <g transform="translate(5 5) scale(0.9)">{ART[i]}</g>
    </svg>
  );
}
