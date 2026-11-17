// <GameCard>: 5:7 dikey kart. Titrek mürekkep kenar, çizgili başlık bandı, gotik kemerli görsel penceresi,
// parşömen metin paneli (HTML), bal mumu mührü (bedel), hedef etiketi, TIK yorumu. Nadirlik süsleri.
import { useMemo, type CSSProperties } from 'react';
import type { Card } from '../../../engine/cards';
import type { TokenKey } from '../../../engine/types';
import { InkFrame } from '../ink/InkFrame';
import { spiral } from '../ink/wobble';
import { keyItem, useManifest } from '../../art/manifest';
import { CardArt } from './CardArt';
import { CardText } from './CardText';
import { TARGET_LABEL, cardLabel, hashId } from './labels';
import { Flames, TypeIcon } from './TypeIcon';

export interface GameCardProps {
  card: Card;
  width: number;
  tokens?: Partial<Record<TokenKey, string>>;
  names?: Record<string, string>;
  sober?: boolean;
  inherited?: boolean;
  className?: string;
  style?: CSSProperties;
}

// Gotik sivri kemer maskesi (görsel penceresi)
const ARCH = 'polygon(0% 100%, 0% 34%, 3% 24%, 9% 15%, 18% 8%, 30% 3%, 42% 0.6%, 50% 0%, 58% 0.6%, 70% 3%, 82% 8%, 91% 15%, 97% 24%, 100% 34%, 100% 100%)';

export function GameCard({ card, width, tokens, names, sober, inherited, className = '', style }: GameCardProps) {
  const u = width / 100; // 1 birim = kart genişliğinin %1'i
  const len = card.text.length;
  const textSize = Math.max(len <= 60 ? 7.6 * u : len <= 90 ? 7 * u : 6.6 * u, 16);
  const seed = hashId(card.id) % 1000;
  const unit = sober ? 'ceza' : 'yudum';
  const legendary = card.rarity === 'legendary';
  const rare = card.rarity === 'rare';
  const frame = legendary ? 'var(--gold-400)' : rare ? '#C9CED6' : 'var(--bone-100)';

  return (
    <div
      className={`relative select-none overflow-hidden ${className}`}
      style={{
        width,
        height: width * 1.4,
        borderRadius: 4 * u,
        background: 'var(--ink-800)',
        boxShadow: legendary ? '0 0 30px #D4AF3755, 0 18px 40px #000c' : '0 18px 40px #000c',
        ...style,
      }}
      role="group"
      aria-label={`${cardLabel(card)} kartı`}
    >
      {/* başlık bandı */}
      <div className="stripes relative flex items-center justify-between" style={{ height: 11 * u, padding: `0 ${2.5 * u}px` }}>
        <span className="flex items-center justify-center rounded-full bg-parchment-200" style={{ width: 8.4 * u, height: 8.4 * u }}>
          <TypeIcon type={card.type} size={6 * u} />
        </span>
        <span className="rounded-[6px] bg-ink-950 font-gothic leading-none text-bone-100" style={{ fontSize: 6.4 * u, padding: `${1.1 * u}px ${3 * u}px` }}>
          {cardLabel(card)}
        </span>
        <span className="flex items-center rounded-full bg-parchment-200" style={{ padding: `${0.8 * u}px ${1.6 * u}px` }}>
          <Flames n={card.intensity} />
        </span>
      </div>

      {/* görsel penceresi: üst %55 (bant dahil), gotik kemer */}
      <div className="relative" style={{ height: width * 1.4 * 0.55 - 11 * u, padding: `${2 * u}px ${5 * u}px 0` }}>
        <div className="h-full w-full overflow-hidden" style={{ clipPath: ARCH, background: '#1E1A24' }}>
          <CardArt card={card} width={width} />
        </div>
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <path
            d="M5,100 L5,36 C8,22 22,9 50,2 C78,9 92,22 95,36 L95,100"
            fill="none"
            stroke={frame}
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
            transform="translate(0 0)"
          />
        </svg>
        {inherited && (
          <span className="absolute rounded-full bg-ink-950 text-bone-100 shadow-[0_0_0_2px_var(--accent)]" style={{ left: 6 * u, top: 6 * u, fontSize: Math.max(4.2 * u, 14), padding: `${0.6 * u}px ${2.4 * u}px` }}>
            Miras
          </span>
        )}
      </div>

      {/* metin paneli: parşömen üstünde koyu mürekkep (kontrast ≥ 7:1) */}
      <div
        className="paper absolute flex flex-col"
        style={{ left: 3 * u, right: 3 * u, bottom: 3 * u, top: width * 1.4 * 0.55 + 1.5 * u, borderRadius: 2.5 * u, padding: `${3 * u}px ${4 * u}px ${2.5 * u}px` }}
      >
        <p className="flex flex-1 items-center justify-center text-center font-extrabold leading-[1.18] text-ink-text" style={{ fontSize: textSize }}>
          <span>
            <CardText text={card.text} tokens={tokens} names={names} sober={sober} />
          </span>
        </p>
        {card.quip && (
          <p className="text-center italic text-[#3a2f2a]" style={{ fontSize: Math.max(4.3 * u, 14), lineHeight: 1.2, marginBottom: 1.5 * u }}>
            TIK: “{card.quip}”
          </p>
        )}
        <div className="flex items-center justify-between">
          <WaxSeal n={card.penalty} size={11 * u} label={card.penalty ? `${card.penalty} ${unit}` : 'bedava'} />
          <span className="rounded-full bg-ink-950 text-bone-100" style={{ fontSize: Math.max(4.2 * u, 14), padding: `${0.8 * u}px ${2.8 * u}px` }}>
            {TARGET_LABEL[card.target]}
          </span>
        </div>
      </div>

      {/* titrek mürekkep kenar + köşe spiralleri */}
      <InkFrame w={100} h={140} seed={seed} stroke={frame} width={legendary ? 3 : 2} />
      <Corners u={u} color={frame} />
      {rare && <Webs u={u} />}
      {legendary && <div className="pointer-events-none absolute inset-0 animate-pulse" style={{ boxShadow: 'inset 0 0 24px #D4AF3766' }} />}
    </div>
  );
}

function Corners({ u, color }: { u: number; color: string }) {
  const s = 7 * u;
  const pos = [
    { left: 0.8 * u, top: 12 * u, r: 0 },
    { right: 0.8 * u, top: 12 * u, r: 90 },
    { left: 0.8 * u, bottom: 0.8 * u, r: 270 },
    { right: 0.8 * u, bottom: 0.8 * u, r: 180 },
  ];
  return (
    <>
      {pos.map((p, i) => (
        <svg key={i} width={s} height={s} viewBox="0 0 20 20" className="pointer-events-none absolute" style={{ ...p, transform: `rotate(${p.r}deg)` }} aria-hidden>
          <path d={spiral(10, 10, 7, 2)} fill="none" stroke={color} strokeWidth="1.4" opacity="0.8" />
        </svg>
      ))}
    </>
  );
}

// Rare: köşelerde gümüş örümcek ağı
function Webs({ u }: { u: number }) {
  const s = 16 * u;
  const web = (
    <g fill="none" stroke="#C9CED6" strokeWidth="0.8" opacity="0.85">
      <path d="M0,0 L40,10 M0,0 L28,28 M0,0 L10,40" />
      <path d="M12,3 Q11,9 8.5,8.5 Q9,11 3,12 M22,5.5 Q19,16 15.5,15.5 Q16,19 5.5,22 M32,8 Q27,24 22.5,22.5 Q24,27 8,32" />
    </g>
  );
  return (
    <>
      <svg width={s} height={s} viewBox="0 0 40 40" className="pointer-events-none absolute left-0 top-[11%]" aria-hidden>{web}</svg>
      <svg width={s} height={s} viewBox="0 0 40 40" className="pointer-events-none absolute right-0 top-[11%] -scale-x-100" aria-hidden>{web}</svg>
    </>
  );
}

// Sayılı bal mumu mührü
export function WaxSeal({ n, size, label }: { n: number; size: number; label?: string }) {
  const d = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = i % 2 ? 46 : 50;
      pts.push(`${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`);
    }
    return `M${pts.join(' L')}Z`;
  }, []);
  return (
    <span className="inline-flex items-center gap-2" role="img" aria-label={`Ceza: ${label ?? n}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
        <path d={d} fill="#7A1E24" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="#5A1218" strokeWidth="4" />
        <text x="50" y="66" textAnchor="middle" fontSize="46" fontWeight="800" fill="#F1E2C8" fontFamily="Alegreya Sans, sans-serif">
          {n}
        </text>
      </svg>
      {label && <span className="font-extrabold text-ink-text" style={{ fontSize: Math.max(size * 0.38, 14) }}>{label}</span>}
    </span>
  );
}

// Kart arkası: kurum zemin, çizgili kenar, dolunay içinde TIK silueti, vurgu renginde spiral
export function CardBack({ width, className = '', style }: { width: number; className?: string; style?: CSSProperties }) {
  const u = width / 100;
  const m = useManifest();
  const img = keyItem(m, 'card-back');
  if (img) {
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ width, height: width * 1.4, borderRadius: 4 * u, boxShadow: '0 14px 30px #000b', ...style }} aria-hidden>
        <img src={width > 200 ? img.w800 : img.w400} alt="" className="h-full w-full object-cover" draggable={false} />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height: width * 1.4, borderRadius: 4 * u, background: 'var(--ink-800)', boxShadow: '0 14px 30px #000b', ...style }} aria-hidden>
      <div className="stripes absolute inset-0" style={{ borderRadius: 4 * u }} />
      <div className="absolute" style={{ inset: 3.4 * u, borderRadius: 3 * u, background: 'radial-gradient(circle at 50% 40%, #2a2530, #121016)' }}>
        <svg viewBox="0 0 100 140" className="h-full w-full">
          <circle cx="50" cy="56" r="30" fill="var(--bone-100)" opacity="0.9" />
          <path d="M42,36 C44,44 47,50 46,56 C40,62 38,72 44,79 L56,79 C62,72 60,62 54,56 C53,50 56,44 58,36 Z" fill="var(--ink-950)" />
          <path d="M44,58 C38,54 35,48 33,44 M56,58 C62,54 66,50 68,46" stroke="var(--ink-950)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d={spiral(50, 110, 14, 3)} fill="none" stroke="var(--accent)" strokeWidth="1.8" />
          <text x="50" y="20" textAnchor="middle" fontFamily="Grenze Gotisch, serif" fontWeight="700" fontSize="11" fill="var(--bone-100)">
            Masa
          </text>
        </svg>
      </div>
      <InkFrame w={100} h={140} seed={5} stroke="var(--ink-950)" width={2} />
    </div>
  );
}
