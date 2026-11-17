// Gecenin Özeti: ödüller yerden yükselen komik mezar taşları olarak gelir. İstatistikler ve "Tekrar Oyna".
import { tikLine } from '../../tik/lines';
import { TikSays } from '../../tik/TikSays';
import { motion } from 'motion/react';
import type { PublicStats, View } from '../../../engine/viewFor';
import { Avatar } from '../../components/Avatar';
import { InkButton } from '../../components/InkButton';
import { Logo } from '../../components/Logo';
import { useReducedMotion } from '../../fx/motionPref';
import { useRoom } from '../../store/room';

interface Award {
  title: string;
  epitaph: string;
  pick: (s: PublicStats) => number;
  min?: boolean;
}

const AWARDS: Award[] = [
  { title: 'Gecenin Cesuru', epitaph: 'Korkuyu tanımadı, sağduyuyu da.', pick: (s) => s.courage },
  { title: 'Masanın Kasası', epitaph: 'Masada en çok o içti. Karaciğerine selam olsun.', pick: (s) => s.paidUnits },
  { title: 'Kaçak Ruh', epitaph: 'Görevden kaçtı, mezardan kaçamadı.', pick: (s) => s.failed },
  { title: 'Masanın Gözdesi', epitaph: 'Herkes onu seçti, o kimseyi.', pick: (s) => s.targeted },
  { title: 'Temiz Hayalet', epitaph: 'En az içen. Şüpheli derecede ayık.', pick: (s) => s.paidUnits, min: true },
];

export function Summary({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const reduce = useReducedMotion();
  const players = view.players.filter((p) => !p.left && view.stats[p.id]);
  const used = new Set<string>();
  const awards = AWARDS.map((a) => {
    const sorted = [...players].sort((x, y) => (a.min ? 1 : -1) * (a.pick(view.stats[x.id]!) - a.pick(view.stats[y.id]!)));
    const winner = sorted.find((p) => !used.has(p.id) && (a.min || a.pick(view.stats[p.id]!) > 0));
    if (winner) used.add(winner.id);
    return winner ? { ...a, winner } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x);

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col items-center gap-5 px-4 pb-32 pt-6">
      <Logo size={56} />
      <h1 className="font-gothic text-[40px]">Gecenin Özeti</h1>
      <TikSays text={tikLine('summary', view.code)} drinking={view.settings.drinking} />
      <div className="flex w-full flex-wrap items-end justify-center gap-3">
        {awards.map((a, i) => (
          <motion.div
            key={a.title}
            className="flex w-[150px] flex-col items-center"
            initial={reduce ? { opacity: 0 } : { y: 160, opacity: 0, rotate: i % 2 ? 4 : -4 }}
            animate={{ y: 0, opacity: 1, rotate: i % 2 ? 2 : -2 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.3 + i * 0.35 }}
          >
            <div className="relative flex w-full flex-col items-center rounded-t-[70px] bg-[#2A2630] px-3 pb-4 pt-5 text-center shadow-[inset_0_0_0_3px_var(--bone-100),0_10px_20px_#000a]">
              <Avatar index={a.winner.avatar} size={46} />
              <p className="mt-1 text-[14px] text-bone-dim">Burada yatıyor:</p>
              <p className="font-gothic text-[20px] leading-tight text-accent">{a.title}</p>
              <p className="text-[18px]">{a.winner.name}</p>
              <p className="mt-1 text-[14px] italic text-bone-dim">{a.epitaph}</p>
            </div>
            <div className="h-[10px] w-[170px] rounded-full bg-ash-500" />
          </motion.div>
        ))}
      </div>

      <table className="ink-panel w-full text-left text-[16px]">
        <caption className="sr-only">İstatistikler</caption>
        <thead>
          <tr className="text-bone-dim">
            <th className="p-2 font-bold">Oyuncu</th>
            <th className="p-2 text-right font-bold">Cesaret</th>
            <th className="p-2 text-right font-bold">{view.settings.drinking ? "İçti" : "Ceza"}</th>
            <th className="p-2 text-right font-bold">Yaptı</th>
          </tr>
        </thead>
        <tbody>
          {[...players]
            .sort((a, b) => view.stats[b.id]!.courage - view.stats[a.id]!.courage)
            .map((p) => {
              const s = view.stats[p.id]!;
              return (
                <tr key={p.id} className="border-t border-ash-500">
                  <td className="flex items-center gap-2 p-2"><Avatar index={p.avatar} size={28} />{p.name}</td>
                  <td className="p-2 text-right tabular-nums">{s.courage}</td>
                  <td className="p-2 text-right tabular-nums">{s.paidUnits}</td>
                  <td className="p-2 text-right tabular-nums">{s.done}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
      <p className="text-[14px] text-bone-dim">{view.game?.log.length ?? 0} kart oynandı.</p>

      <footer className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink-950 to-transparent px-4 pt-6 safe-bottom">
        <div className="mx-auto max-w-md">
          {view.you?.isHost ? (
            <InkButton className="w-full" onClick={() => send({ t: 'restart' })} seed={71}>
              Tekrar Oyna
            </InkButton>
          ) : (
            <p className="text-center text-bone-dim">Masa sahibi yeni oyunu başlatabilir.</p>
          )}
        </div>
      </footer>
    </main>
  );
}
