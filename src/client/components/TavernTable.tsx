// Lobi sahnesi: uzun, çarpık bir meyhane masası. Her katılan bir sandalyeye oturur, önünde mum yanar.
// Host'un sandalyesi yüksek sırtlıdır. Çevrimdışı oyuncunun mumu söner.
import type { PublicPlayer } from '../../engine/viewFor';
import { Avatar } from './Avatar';

const SEATS_PER_SIDE = 6;

function Chair({ high, side }: { high: boolean; side: 'l' | 'r' }) {
  const flip = side === 'r' ? 'scale(-1 1) translate(-60 0)' : undefined;
  return (
    <svg width="60" height={high ? 96 : 70} viewBox={`0 0 60 ${high ? 96 : 70}`} aria-hidden className="absolute bottom-0 left-1/2 -translate-x-1/2">
      <g transform={flip} fill="none" stroke="var(--bone-100)" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round">
        {high ? (
          <>
            <path d="M14,96 L12,24 Q12,4 30,2 Q48,4 47,24 L46,96" />
            <path d="M30,8 l0,-6 M22,18 q8,-8 16,0" />
            <path d="M18,40 h24 M18,52 h24" strokeOpacity="0.35" />
          </>
        ) : (
          <path d="M14,70 L13,22 Q13,12 30,10 Q47,12 46,22 L46,70" />
        )}
      </g>
    </svg>
  );
}

function Candle({ lit }: { lit: boolean }) {
  return (
    <svg width="18" height="34" viewBox="0 0 18 34" aria-hidden>
      {lit && <circle cx="9" cy="8" r="9" fill="var(--accent)" opacity="0.25" />}
      {lit ? (
        <path className="flame" d="M9,1 C13,6 13,10 9,13 C5,10 5,6 9,1 Z" fill="var(--accent)" />
      ) : (
        <path d="M9,12 q-3,-4 1,-7 q-2,-3 1,-5" stroke="var(--ash-500)" strokeWidth="1.3" fill="none" />
      )}
      <rect x="5" y="13" width="8" height="18" fill="var(--bone-100)" opacity={lit ? 0.9 : 0.4} rx="1" />
      <path d="M5,15 q2,4 0,7" stroke="var(--ink-950)" strokeOpacity="0.3" fill="none" />
    </svg>
  );
}

function Seat({ p, side, you }: { p: PublicPlayer | null; side: 'l' | 'r'; you: boolean }) {
  if (!p) {
    return (
      <div className="flex h-[104px] w-[96px] flex-col items-center justify-end opacity-40">
        <div className="relative h-[70px] w-[60px]">
          <Chair high={false} side={side} />
        </div>
        <span className="mt-1 text-[14px] text-bone-dim">boş</span>
      </div>
    );
  }
  return (
    <div className="flex w-[96px] flex-col items-center" aria-label={`${p.name}${p.isHost ? ', masanın sahibi' : ''}${p.connected ? '' : ', bağlantısı koptu'}`}>
      <div className="relative flex h-[96px] w-[60px] items-end justify-center">
        <Chair high={p.isHost} side={side} />
        <div className="relative mb-2">
          <Avatar index={p.avatar} size={52} dim={!p.connected} />
          {p.isHost && (
            <svg className="absolute -right-2 -top-2" width="22" height="18" viewBox="0 0 22 18" aria-hidden>
              <path d="M2,16 L1,4 L7,9 L11,1 L15,9 L21,4 L20,16 Z" fill="var(--gold-400)" stroke="var(--ink-950)" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <span className={`max-w-[96px] truncate text-center text-[15px] ${you ? 'text-accent' : 'text-bone-100'}`}>
        {p.name}
        {you ? ' (sen)' : ''}
      </span>
      <span className="text-[14px] text-bone-dim">{p.isBot ? 'bot' : p.connected ? 'masada' : 'koptu'}</span>
    </div>
  );
}

export function TavernTable({ players, youId }: { players: PublicPlayer[]; youId: string | null }) {
  const seated = players.filter((p) => !p.left).sort((a, b) => a.joinSeq - b.joinSeq);
  // Sandalyeler: sol ve sağ kenarlara sırayla; en az 3 sıra göster
  const rows = Math.max(3, Math.ceil(Math.min(seated.length + 1, 12) / 2));
  const left: (PublicPlayer | null)[] = [];
  const right: (PublicPlayer | null)[] = [];
  for (let i = 0; i < rows * 2 && i < SEATS_PER_SIDE * 2; i++) (i % 2 === 0 ? left : right).push(seated[i] ?? null);
  const candles = left.map((l, i) => [l, right[i] ?? null] as const);

  return (
    <div className="relative mx-auto w-full max-w-[400px]" style={{ height: rows * 118 + 30 }}>
      {/* masa: perspektifli, hafif eğik */}
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 400 ${rows * 118 + 30}`} preserveAspectRatio="none" aria-hidden>
        <defs>
          <pattern id="wood" width="400" height="22" patternUnits="userSpaceOnUse">
            <path d="M0,11 C80,6 160,16 240,10 S360,14 400,9" stroke="#2C2630" strokeWidth="2" fill="none" />
          </pattern>
        </defs>
        <path
          d={`M150,8 L262,14 L272,${rows * 118 + 22} L128,${rows * 118 + 16} Z`}
          fill="#16131A"
          stroke="var(--bone-100)"
          strokeOpacity="0.6"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d={`M150,8 L262,14 L272,${rows * 118 + 22} L128,${rows * 118 + 16} Z`} fill="url(#wood)" opacity="0.8" />
        <path d={`M140,${rows * 118 + 18} l-4,12 M262,${rows * 118 + 22} l4,10`} stroke="var(--bone-100)" strokeOpacity="0.5" strokeWidth="3" />
      </svg>
      {/* mumlar masanın üstünde, oturanın önünde */}
      <div className="absolute inset-y-0 left-1/2 flex w-[130px] -translate-x-1/2 flex-col justify-around py-6">
        {candles.map(([l, r], i) => (
          <div key={i} className="flex justify-between px-3">
            <span className={l ? '' : 'invisible'}><Candle lit={!!l?.connected} /></span>
            <span className={r ? '' : 'invisible'}><Candle lit={!!r?.connected} /></span>
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 flex flex-col justify-around py-2">
        {left.map((p, i) => <Seat key={p?.id ?? `l${i}`} p={p} side="l" you={p?.id === youId} />)}
      </div>
      <div className="absolute inset-y-0 right-0 flex flex-col justify-around py-2">
        {right.map((p, i) => <Seat key={p?.id ?? `r${i}`} p={p} side="r" you={p?.id === youId} />)}
      </div>
    </div>
  );
}
