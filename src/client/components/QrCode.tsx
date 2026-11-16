// QR kod (SVG, istemcide üretilir). Okunabilirlik için parşömen üzerine koyu mürekkep.
import QR from 'qrcode';
import { useEffect, useState } from 'react';

export function QrCode({ value, size = 160 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let alive = true;
    QR.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1A1418', light: '#D9CFB8' } })
      .then((s) => alive && setSvg(s))
      .catch(() => setSvg(''));
    return () => {
      alive = false;
    };
  }, [value]);
  return (
    <div
      role="img"
      aria-label={`Katılım QR kodu: ${value}`}
      className="overflow-hidden rounded-[12px] bg-parchment-200 p-1 shadow-[0_8px_24px_#000a]"
      style={{ width: size, height: size }}
      // qrcode kütüphanesinin ürettiği SVG; kullanıcı metni içermez
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
