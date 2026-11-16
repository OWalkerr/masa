// Ana Ekran (/tv/KOD) — M3'te dolacak. Şimdilik masa kodunu ve QR'ı büyük gösterir.
import { NightScene } from '../components/NightScene';
import { QrCode } from '../components/QrCode';
import { Logo } from '../components/Logo';

export function TvScreen({ code }: { code: string }) {
  const link = `${location.origin}/m/${code}`;
  return (
    <main className="relative flex min-h-full flex-col items-center justify-center gap-6 px-4">
      <NightScene seed={21} />
      <Logo size={120} />
      <div className="font-extrabold text-[96px] tracking-[0.2em]">{code}</div>
      <QrCode value={link} size={260} />
      <p className="text-[22px] text-bone-dim">Ana Ekran modu yolda: sahne, skor ve büyük kart M3'te geliyor.</p>
    </main>
  );
}
