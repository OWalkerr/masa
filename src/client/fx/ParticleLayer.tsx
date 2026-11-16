import { useEffect, useRef } from 'react';
import { attachParticles } from './particles';

// Tek, tam ekran partikül tuvali. Tıklamaları engellemez; kart metninin altında kalmaz ama yalnızca kısa süreli.
export function ParticleLayer() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) attachParticles(ref.current);
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[1] h-full w-full" />;
}
