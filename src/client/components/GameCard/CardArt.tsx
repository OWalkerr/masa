// Kart görsel penceresi için yer tutucu sahneler (4:3). Gemini görselleri gelince manifest'ten görsel kullanılır.
// Stil: mürekkep siluetler, dolunay, spiraller, eğik çatılar, tek vurgu ışığı.
import type { ReactNode } from 'react';
import type { Card } from '../../../engine/cards';
import { spiral } from '../ink/wobble';
import { hashId } from './labels';

const B = 'var(--bone-100)';
const I = 'var(--ink-950)';
const A = 'var(--accent)';

function Sky({ moonX = 290, moonY = 80, r = 52 }: { moonX?: number; moonY?: number; r?: number }) {
  return (
    <>
      <rect width="400" height="300" fill="#1E1A24" />
      <circle cx={moonX} cy={moonY} r={r * 1.9} fill={B} opacity="0.08" />
      <circle cx={moonX} cy={moonY} r={r} fill={B} opacity="0.92" />
      <path d={spiral(moonX + 6, moonY + 4, r * 0.45, 2.5)} fill="none" stroke="#BDB4A2" strokeWidth="2.5" opacity="0.6" />
      {[30, 90, 150, 210, 360].map((x, i) => (
        <circle key={x} cx={x} cy={20 + ((i * 37) % 70)} r={1.5} fill={B} opacity="0.6" />
      ))}
    </>
  );
}

function Roofs({ y = 230 }: { y?: number }) {
  return (
    <g fill={I} stroke={B} strokeOpacity="0.6" strokeWidth="2.5" strokeLinejoin="round">
      <path d={`M-10,300 L-10,${y} L30,${y - 50} L72,${y - 6} L70,300 Z`} />
      <path d={`M60,300 L64,${y - 20} L110,${y - 76} L150,${y - 24} L146,300 Z`} />
      <path d={`M300,300 L304,${y - 30} L340,${y - 70} L388,${y - 20} L410,300 Z`} />
      <path d={`M108,${y - 74} l2,-26 q10,-14 4,-22 l8,2 q4,12 -4,22 l-2,22`} />
    </g>
  );
}

const SCENES: Record<string, ((v: number) => ReactNode) | undefined> = {
  question: (v) => (
    <>
      <Sky moonX={v ? 110 : 290} />
      <Roofs />
      {/* bacadan soru işareti biçiminde duman */}
      <path d="M118,128 C116,104 140,96 150,82 C164,62 140,40 120,52 C108,60 110,74 120,74" fill="none" stroke={B} strokeWidth="5" strokeLinecap="round" opacity="0.75" />
      <circle cx="122" cy="150" r="0" />
      <path d="M200,300 L204,180 Q206,160 230,156 Q254,160 256,180 L260,300 Z" fill={I} stroke={B} strokeWidth="3" />
      <path d="M216,214 L216,190 Q230,174 244,190 L244,214 Z" fill={A} stroke={B} strokeWidth="2.5" />
      <path d="M230,174 L230,214 M216,200 L244,200" stroke={I} strokeWidth="2" />
    </>
  ),
  dare: (v) => (
    <>
      <Sky moonX={200} moonY={v ? 90 : 70} r={60} />
      <Roofs y={250} />
      {/* iki çatı arasında ip, üstünde çöp adam */}
      <path d="M30,196 Q200,232 370,200" fill="none" stroke={B} strokeWidth="2.5" />
      <g stroke={B} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M200,212 L194,180 M200,212 L208,180" />
        <path d="M200,182 L200,148" />
        <path d="M200,160 Q172,150 150,160 M200,160 Q228,150 252,158" />
      </g>
      <circle cx="200" cy="136" r="13" fill={I} stroke={B} strokeWidth="3" />
      <circle cx="196" cy="134" r="3.5" fill={B} /><circle cx="205" cy="134" r="3.5" fill={B} />
      <path d="M150,160 l-6,-14 M252,158 l6,-14" stroke={B} strokeWidth="3" />
      <circle cx="144" cy="144" r="5" fill={A} />
    </>
  ),
  mostLikely: (v) => (
    <>
      <Sky moonX={v ? 300 : 80} moonY={70} r={46} />
      <Roofs y={260} />
      {/* sokak lambası altında küçük figür, üç kemik parmak onu gösteriyor */}
      <circle cx="200" cy="150" r="60" fill={A} opacity="0.18" />
      <path d="M232,270 C236,200 226,130 246,104 C258,90 272,96 270,108" fill="none" stroke={B} strokeWidth="4" strokeLinecap="round" />
      <path d="M260,108 L282,108 L278,124 L264,124 Z" fill={A} stroke={B} strokeWidth="2" />
      <g fill={I} stroke={B} strokeWidth="3">
        <path d="M188,250 L190,196 Q200,182 210,196 L212,250 Z" />
        <circle cx="200" cy="176" r="14" />
      </g>
      <circle cx="195" cy="174" r="3.5" fill={B} /><circle cx="205" cy="174" r="3.5" fill={B} />
      <g stroke={B} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M10,120 L120,170 M114,164 l8,7 M108,176 l14,-4" />
        <path d="M30,250 L136,214 M130,208 l8,6" />
        <path d="M390,150 L280,190 M286,184 l-8,6" />
      </g>
    </>
  ),
  neverHave: (v) => (
    <>
      <Sky moonX={v ? 300 : 110} moonY={80} r={50} />
      <path d="M-10,300 Q200,236 410,300 Z" fill={I} stroke={B} strokeOpacity="0.5" strokeWidth="2.5" />
      {/* "HİÇ" yazılı eğik mezar taşı ve üstünde karga */}
      <g transform="rotate(-6 200 220)">
        <path d="M150,290 L150,180 Q150,140 200,140 Q250,140 250,180 L250,290 Z" fill="#26222C" stroke={B} strokeWidth="3.5" />
        <text x="200" y="210" textAnchor="middle" fontFamily="Grenze Gotisch, serif" fontWeight="700" fontSize="38" fill={B}>Hiç</text>
        <path d="M168,230 L232,230 M176,244 L224,244" stroke={B} strokeOpacity="0.5" strokeWidth="2" />
      </g>
      <g fill={I} stroke={B} strokeWidth="2.5" strokeLinejoin="round">
        <path d="M222,142 C214,126 220,112 236,110 C248,108 256,116 256,124 L272,128 L256,132 C254,142 240,148 222,142 Z" />
        <path d="M226,142 l-4,10 M236,144 l2,9" fill="none" />
      </g>
      <circle cx="244" cy="120" r="3" fill={A} />
    </>
  ),
};

function Fallback({ v }: { v: number }) {
  return (
    <>
      <Sky moonX={v % 2 ? 120 : 280} />
      <Roofs />
      <path d={spiral(200, 190, 40, 3)} fill="none" stroke={A} strokeWidth="3" />
    </>
  );
}

export function CardArt({ card }: { card: Pick<Card, 'id' | 'type'> }) {
  const v = hashId(card.id) % 2;
  const scene = SCENES[card.type];
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      {scene ? scene(v) : <Fallback v={v} />}
      {/* kâğıt dokusu: ince tarama */}
      <g stroke={I} strokeOpacity="0.18" strokeWidth="1">
        {Array.from({ length: 14 }, (_, i) => (
          <path key={i} d={`M${i * 32 - 40},300 L${i * 32 + 60},200`} />
        ))}
      </g>
    </svg>
  );
}
