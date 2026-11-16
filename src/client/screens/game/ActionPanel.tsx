// Eylem: kart türüne göre herkesin telefonunda tek bir girdi.
import { useEffect, useState } from 'react';
import { DUR } from '../../../engine/types';
import type { View } from '../../../engine/viewFor';
import { Avatar } from '../../components/Avatar';
import { InkButton } from '../../components/InkButton';
import { useRoom } from '../../store/room';
import { CandleTimer } from './CandleTimer';

export function ActionPanel({ view }: { view: View }) {
  const g = view.game!;
  const me = view.you!.id;
  const card = g.card!;
  const reader = view.players.find((p) => p.id === g.readerId);
  const isReader = me === g.readerId;
  const total = g.input === 'votePlayer' ? DUR.vote : g.input === 'yesNo' ? DUR.yesNo : DUR.judge + (card.timer ?? 0) * 1000;
  const waiting = g.expected.filter((id) => !g.submitted.includes(id)).length;

  let body;
  if (g.input === 'judge') {
    body = isReader ? (
      card.target === 'all' ? <JudgeAll view={view} /> : <JudgeOne view={view} />
    ) : (
      <Info>
        {g.targets.includes(me)
          ? `Sıra sende: yap ya da ${card.penalty ? 'bedeli öde' : 'pas geç'}. Hükmü ${reader?.name} verecek.`
          : `${reader?.name} hüküm verecek.`}
      </Info>
    );
  } else if (g.input === 'votePlayer') {
    body = g.myInput ? <Info>Oyun gizli. {waiting > 0 ? `${waiting} kişi bekleniyor…` : 'Sayılıyor…'}</Info> : <VoteGrid view={view} />;
  } else {
    const mine = g.expected.includes(me);
    body = !mine ? (
      <Info>Bu kart sana gelmedi. {waiting} kişi cevaplıyor…</Info>
    ) : g.myInput ? (
      <Info>Cevabın gizli. {waiting > 0 ? `${waiting} kişi bekleniyor…` : 'Açılıyor…'}</Info>
    ) : (
      <YesNo />
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <CandleTimer endsAt={g.phaseEndsAt} total={total} />
      {card.timer && isReader && g.input === 'judge' && <DareTimer seconds={card.timer} />}
      {body}
    </div>
  );
}

function Info({ children }: { children: React.ReactNode }) {
  return (
    <p className="ink-panel px-4 py-4 text-center text-[18px]" aria-live="polite">
      {children}
    </p>
  );
}

function JudgeOne({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const g = view.game!;
  const names = g.targets.map((id) => view.players.find((p) => p.id === id)?.name).join(' ve ');
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-[18px]">{names} görevi yaptı mı?</p>
      <div className="flex gap-2">
        <InkButton variant="secondary" className="flex-1" onClick={() => send({ t: 'judge', done: false })} seed={61}>
          Yapmadı
        </InkButton>
        <InkButton className="flex-1" onClick={() => send({ t: 'judge', done: true })} seed={62}>
          Yaptı
        </InkButton>
      </div>
    </div>
  );
}

function JudgeAll({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const g = view.game!;
  const [payers, setPayers] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-[18px]">Yapmayanları işaretle, onlar öder.</p>
      <div className="grid grid-cols-2 gap-2">
        {g.targets.map((id) => {
          const p = view.players.find((x) => x.id === id);
          if (!p) return null;
          const on = payers.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => setPayers((s) => (on ? s.filter((x) => x !== id) : [...s, id]))}
              className={`flex min-h-[56px] items-center gap-2 rounded-[12px] px-2 ${on ? 'bg-[#7A1E24] text-bone-100' : 'bg-ink-800 shadow-[inset_0_0_0_1px_var(--ash-500)]'}`}
            >
              <Avatar index={p.avatar} size={36} />
              <span className="truncate text-[16px]">{on ? 'Öder: ' : ''}{p.name}</span>
            </button>
          );
        })}
      </div>
      <InkButton onClick={() => send({ t: 'judge', payers })} seed={63}>
        {payers.length ? `Hükmü ver (${payers.length} kişi öder)` : 'Herkes yaptı'}
      </InkButton>
    </div>
  );
}

function VoteGrid({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const me = view.you!.id;
  const choices = view.players.filter((p) => !p.left && p.id !== me);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-[18px]">Gizlice birini seç.</p>
      <div className="grid grid-cols-3 gap-2">
        {choices.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => send({ t: 'vote', playerId: p.id })}
            className="flex min-h-[92px] flex-col items-center justify-center gap-1 rounded-[14px] bg-ink-800 shadow-[inset_0_0_0_1px_var(--ash-500)] active:scale-95"
          >
            <Avatar index={p.avatar} size={46} />
            <span className="max-w-full truncate px-1 text-[15px]">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function YesNo() {
  const send = useRoom((s) => s.send);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-[18px]">Dürüst ol. Cevabın sonuçta açılır.</p>
      <div className="flex gap-2">
        <InkButton variant="secondary" className="flex-1" onClick={() => send({ t: 'answer', yes: false })} seed={64}>
          Yapmadım
        </InkButton>
        <InkButton className="flex-1" onClick={() => send({ t: 'answer', yes: true })} seed={65}>
          Yaptım
        </InkButton>
      </div>
    </div>
  );
}

// Cesaret kartlarındaki süre: okuyucu başlatır (yalnızca gösterim)
function DareTimer({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = window.setTimeout(() => setLeft((l) => (l ?? 0) - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);
  return (
    <button
      type="button"
      onClick={() => setLeft(seconds)}
      className="min-h-[48px] rounded-[12px] bg-ink-800 text-[17px] shadow-[inset_0_0_0_1px_var(--ash-500)]"
      aria-live="polite"
    >
      {left === null ? `${seconds} sn geri sayımı başlat` : left > 0 ? `Kalan: ${left} sn` : 'Süre doldu!'}
    </button>
  );
}
