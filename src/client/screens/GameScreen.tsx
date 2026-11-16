// Oyun ekranı — M0'da yer tutucu. Kart sahnesi ve tur döngüsü M1'de gelecek.
import type { View } from '../../engine/viewFor';
import { Avatar } from '../components/Avatar';
import { InkButton } from '../components/InkButton';
import { Tik } from '../components/Tik';
import { useRoom } from '../store/room';

export function GameScreen({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const order = view.order.map((id) => view.players.find((p) => p.id === id)).filter(Boolean);
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col items-center gap-6 px-4 pb-10 pt-6 text-center">
      <div className="flex w-full gap-2 overflow-x-auto pb-1" aria-label="Sıra">
        {order.map((p, i) => (
          <div key={p!.id} className={`flex shrink-0 flex-col items-center ${i === 0 ? '' : 'opacity-70'}`}>
            <Avatar index={p!.avatar} size={44} dim={!p!.connected} />
            <span className="max-w-[64px] truncate text-[14px]">{p!.name}</span>
          </div>
        ))}
      </div>
      <h1 className="font-gothic text-[44px]">Perde 1: Isınma</h1>
      <Tik size={150} className="tik-bob" variant={view.settings.drinking && !view.you?.quitDrinking ? 'raki' : 'tea'} />
      <p className="max-w-xs text-[18px] text-bone-dim">
        Perde açıldı. Kartlar, miras ve bedeller M1 ile masaya geliyor. Şimdilik TIK sahneyi ısıtıyor.
      </p>
      {view.settings.drinking && !view.you?.quitDrinking && (
        <InkButton variant="secondary" onClick={() => send({ t: 'quitDrinking' })}>
          Ben bıraktım
        </InkButton>
      )}
    </main>
  );
}
