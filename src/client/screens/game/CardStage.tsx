// Oynanan kart: açılışta tüm telefonlarda 600 ms 3D flip, ortasında mürekkep sıçraması.
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { Card } from '../../../engine/cards';
import type { View } from '../../../engine/viewFor';
import { CardBack, GameCard } from '../../components/GameCard/GameCard';
import { useReducedMotion } from '../../fx/motionPref';
import { buzz, useNames } from './hooks';

export function CardStage({ view, card, width }: { view: View; card: Card; width: number }) {
  const g = view.game!;
  const names = useNames(view);
  const reduce = useReducedMotion();
  // Yalnızca açılış fazında bağlanan telefon çevirmeyi görür; sonradan gelen düz kartı görür
  const firstPhase = useRef(view.phase);
  const flip = firstPhase.current === 'reveal' && !reduce;
  const [splash, setSplash] = useState(false);

  useEffect(() => {
    if (!flip) return;
    const t = window.setTimeout(() => {
      setSplash(true);
      buzz(card.rarity === 'legendary' ? [60, 40, 120] : 30);
    }, 300);
    return () => window.clearTimeout(t);
  }, [flip, card.rarity]);

  return (
    <div className="relative" style={{ width, height: width * 1.4, perspective: 1200 }}>
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        initial={flip ? { rotateY: 180 } : reduce && firstPhase.current === 'reveal' ? { opacity: 0 } : false}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: flip ? 0.6 : 0.3, ease: [0.3, 0.7, 0.3, 1] }}
      >
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
          <GameCard card={card} width={width} tokens={g.tokens} names={names} sober={!!view.you?.sober} />
        </div>
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <CardBack width={width} />
        </div>
      </motion.div>
      {splash && <InkSplash rarity={card.rarity} />}
    </div>
  );
}

// Mürekkep sıçraması: yalnızca kartın çevresinde, metin panelinin üstüne çıkmaz (opacity/transform)
function InkSplash({ rarity }: { rarity: Card['rarity'] }) {
  const color = rarity === 'legendary' ? 'var(--gold-400)' : rarity === 'rare' ? '#C9CED6' : 'var(--bone-100)';
  const drops = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    return { x: Math.cos(a), y: Math.sin(a), r: 4 + (i % 3) * 3 };
  });
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {drops.map((d, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-[28%] rounded-full"
          style={{ width: d.r * 2, height: d.r * 2, background: color, marginLeft: -d.r, marginTop: -d.r }}
          initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
          animate={{ x: d.x * 180, y: d.y * 160, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
