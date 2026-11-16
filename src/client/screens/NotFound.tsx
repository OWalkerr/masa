import { InkButton } from '../components/InkButton';
import { NightScene } from '../components/NightScene';
import { Tik } from '../components/Tik';
import { navigate } from '../router';

export function NotFound({ title = 'Burada kimse yok', text = 'Bu sokakta masa kurulmamış. TIK bile kayboldu.' }: { title?: string; text?: string }) {
  return (
    <main className="relative flex min-h-full flex-col items-center justify-center gap-4 px-4 text-center">
      <NightScene seed={3} />
      <Tik size={110} mood="smirk" />
      <h1 className="font-gothic text-[40px]">{title}</h1>
      <p className="max-w-xs text-bone-dim">{text}</p>
      <InkButton onClick={() => navigate('/')}>Ana kapıya dön</InkButton>
    </main>
  );
}
