// MASA logosu: Grenze Gotisch, altında çizgili bant ve spiraller
import { spiral } from './ink/wobble';

export function Logo({ size = 88 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center">
      <h1 className="font-gothic leading-none text-bone-100" style={{ fontSize: size, textShadow: '0 4px 0 #000, 0 0 30px #00000088' }}>
        Masa
      </h1>
      <svg width={size * 2.4} height="22" viewBox="0 0 240 22" aria-hidden>
        <path d={spiral(14, 11, 9, 2.2)} fill="none" stroke="var(--bone-100)" strokeWidth="2" />
        <rect x="30" y="7" width="180" height="8" fill="url(#logo-stripes)" />
        <path d={spiral(226, 11, 9, 2.2, Math.PI)} fill="none" stroke="var(--bone-100)" strokeWidth="2" />
        <defs>
          <pattern id="logo-stripes" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <rect width="5" height="10" fill="var(--bone-100)" />
            <rect x="5" width="5" height="10" fill="var(--ink-950)" />
          </pattern>
        </defs>
      </svg>
    </div>
  );
}
