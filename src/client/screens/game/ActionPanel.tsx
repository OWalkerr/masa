// Eylem: kart türüne göre herkesin telefonunda tek bir girdi.
import { SketchPanel } from './Sketch';
import { useEffect, useState } from 'react';
import { DUR } from '../../../engine/types';
import type { View } from '../../../engine/viewFor';
import { Avatar } from '../../components/Avatar';
import { InkButton } from '../../components/InkButton';
import { useRoom } from '../../store/room';
import { CandleTimer } from './CandleTimer';
import { drinkWord } from './explain';
import { SecretBox } from './Flow';
import { MinigamePanel } from './MinigamePanel';

export function ActionPanel({ view }: { view: View }) {
  const g = view.game!;
  const me = view.you!.id;
  const card = g.card!;
  const reader = view.players.find((p) => p.id === g.readerId);
  const isReader = me === g.readerId;
  const total =
    g.input === 'votePlayer' ? DUR.vote : g.input === 'yesNo' ? DUR.yesNo : g.input === 'choice' ? DUR.mirror
      : g.input === 'text' ? (g.stage === 'guess' ? DUR.guess : DUR.write) : DUR.judge + (card.timer ?? 0) * 1000;
  const waiting = g.expected.filter((id) => !g.submitted.includes(id)).length;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  const passed = g.passed.includes(me);
  const word = drinkWord(view);
  const tags = card.tags ?? [];

  if (card.type === 'sketch' && g.sketch) {
    return (
      <div className="flex w-full max-w-[560px] flex-col items-center gap-3">
        {passed ? <Info>Pas geçtin.</Info> : <SketchPanel view={view} />}
        <PassVeto view={view} />
      </div>
    );
  }

  if (card.type === 'minigame' && g.mg) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        {passed ? <Info>Pas geçtin. Bu oyun sana bedava.</Info> : <MinigamePanel view={view} />}
        {g.mg.stage === 'wait' && <PassVeto view={view} />}
      </div>
    );
  }

  let body;
  if (passed) {
    body = <Info>Pas geçtin. Bu kart sana bedava.</Info>;
  } else if (card.type === 'duel') {
    const voter = g.expected.includes(me);
    body = !voter ? (
      <Info>{g.targets.includes(me) ? 'Düellodasın! Masa kazananı seçecek.' : 'Masa oyluyor…'}</Info>
    ) : g.myInput ? (
      <Info>Oyun gizli. {waiting > 0 ? `${waiting} kişi bekleniyor…` : 'Sayılıyor…'}</Info>
    ) : (
      <DuelVote view={view} />
    );
  } else if (g.input === 'choice') {
    const isTarget = g.targets[0] === me;
    body = g.myInput ? (
      <Info>{isTarget ? 'Gizli seçimin kaydedildi.' : 'Tahminin gizli.'} {waiting > 0 ? `${waiting} kişi bekleniyor…` : ''}</Info>
    ) : (
      <ChoiceGrid
        view={view}
        prompt={
          tags.includes('yalan')
            ? isTarget ? 'Üç şey söyle: ikisi doğru, biri yalan. Sonra yalanı gizlice işaretle.' : `${name(g.targets[0] ?? '')} üç şey söyleyecek. Sence hangisi yalan?`
            : tags.includes('olcek')
              ? isTarget ? 'Gizli puanını ver. Dürüst ol, sonuçta açılacak.' : `${name(g.targets[0] ?? '')} kaç dedi? Tahmin et.`
              : isTarget ? 'Gizlice seç. Kimse görmeyecek.' : `${name(g.targets[0] ?? '')} ne seçti? Tahmin et.`
        }
      />
    );
  } else if (g.input === 'text') {
    if (g.stage === 'write') {
      body = g.myText !== null ? <Info>Cevabın anonim olarak kaydedildi. {waiting > 0 ? `${waiting} kişi yazıyor…` : ''}</Info> : <ConfessionWrite />;
    } else {
      body = <ConfessionGuess view={view} waiting={waiting} />;
    }
  } else if (g.input === 'judge') {
    body = isReader ? (
      card.target === 'all' ? <JudgeAll view={view} /> : <JudgeOne view={view} />
    ) : (
      <Info>
        {g.targets.includes(me)
          ? `Sahne senin: yap ya da ${card.penalty ? (view.you?.sober || !view.settings.drinking ? `${card.penalty} ceza al` : `${card.penalty} yudum iç`) : 'pas geç'}. Bitince ${reader?.name} hüküm verecek.`
          : `İzle, gül, yorum yap. Bitince ${reader?.name} hüküm verecek.`}
      </Info>
    );
  } else if (g.input === 'votePlayer') {
    body = !g.expected.includes(me) ? (
      <Info>{reader?.name} seçiyor…</Info>
    ) : g.myInput ? (
      <Info>Oyun gizli. {waiting > 0 ? `${waiting} kişi bekleniyor…` : 'Sayılıyor…'}</Info>
    ) : (
      <VoteGrid view={view} />
    );
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
      {g.phaseEndsAt && <CandleTimer endsAt={g.phaseEndsAt} total={total} beat={g.expected.includes(me) && !g.submitted.includes(me)} />}
      {g.secret && <SecretBox secret={g.secret} />}
      {card.timer && (isReader || g.targets.includes(me)) && (g.input === 'judge' || card.type === 'duel') && <DareTimer seconds={card.timer} />}
      {body}
      <PassVeto view={view} />
    </div>
  );
}

// Pas (perde başına 1, kendine gelen karta) ve anonim Veto (oyun boyunca 1)
export function PassVeto({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const g = view.game!;
  const you = view.you!;
  const [confirmVeto, setConfirmVeto] = useState(false);
  const card = g.card;
  if (!card || g.system || card.type === 'rule' || card.type === 'curse') return null;
  const canPass = you.canPass && g.targets.includes(you.id) && !g.passed.includes(you.id) && card.type !== 'golden';
  if (!canPass && !you.canVeto) return null;
  return (
    <div className="flex gap-2">
      {canPass && (
        <button type="button" onClick={() => send({ t: 'pass' })} className="min-h-[48px] flex-1 rounded-[12px] bg-ink-800 text-[16px] shadow-[inset_0_0_0_1px_var(--ash-500)]">
          Pas geç <span className="text-bone-dim">(perdede 1)</span>
        </button>
      )}
      {you.canVeto &&
        (confirmVeto ? (
          <button type="button" onClick={() => { send({ t: 'veto' }); setConfirmVeto(false); }} className="min-h-[48px] flex-1 rounded-[12px] bg-[#5A1218] text-[16px]">
            Eminim, veto et
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmVeto(true)} className="min-h-[48px] flex-1 rounded-[12px] bg-ink-800 text-[16px] shadow-[inset_0_0_0_1px_var(--ash-500)]">
            Anonim veto <span className="text-bone-dim">(oyunda 1)</span>
          </button>
        ))}
    </div>
  );
}

function DuelVote({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const g = view.game!;
  const [a, b] = g.targets.map((id) => view.players.find((p) => p.id === id));
  if (!a || !b) return null;
  const side = (p: typeof a) => (
    <button
      type="button"
      onClick={() => send({ t: 'vote', playerId: p!.id })}
      className="flex min-h-[140px] flex-1 flex-col items-center justify-center gap-2 rounded-[14px] bg-ink-800 shadow-[inset_0_0_0_1px_var(--ash-500)] active:scale-95"
    >
      <Avatar index={p!.avatar} size={64} />
      <span className="max-w-full truncate px-2 text-[18px]">{p!.name}</span>
    </button>
  );
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-[18px]">Kazanan kim?</p>
      <div className="relative flex items-stretch gap-6">
        {side(a)}
        {/* ortada çatlayan şimşek */}
        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" width="28" height="120" viewBox="0 0 28 120" aria-hidden>
          <path d="M18,0 L6,48 L18,52 L4,120 L24,44 L12,40 Z" fill="var(--accent)" stroke="var(--bone-100)" strokeWidth="1.5" />
        </svg>
        {side(b)}
      </div>
    </div>
  );
}

function ChoiceGrid({ view, prompt }: { view: View; prompt: string }) {
  const send = useRoom((s) => s.send);
  const g = view.game!;
  const label = (o: string) => (g.optionPlayers ? view.players.find((p) => p.id === o)?.name ?? '?' : o);
  const scale = g.options.length === 10 && g.options[0] === '1';
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-[18px]">{prompt}</p>
      <div className={`grid gap-2 ${scale ? 'grid-cols-5' : g.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {g.options.map((o, i) => (
          <button
            key={i}
            type="button"
            onClick={() => send({ t: 'choose', index: i })}
            className={`flex min-h-[64px] items-center justify-center gap-2 rounded-[12px] bg-ink-800 px-2 shadow-[inset_0_0_0_1px_var(--ash-500)] active:scale-95 ${scale ? 'text-[24px] font-extrabold' : 'text-[17px]'}`}
          >
            {g.optionPlayers && <Avatar index={view.players.find((p) => p.id === o)?.avatar ?? 0} size={32} />}
            <span className="truncate">{label(o)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfessionWrite() {
  const send = useRoom((s) => s.send);
  const [text, setText] = useState('');
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) send({ t: 'answerText', text });
      }}
    >
      <label htmlFor="confess" className="text-center text-[18px]">Anonim yaz. Kimse senin yazdığını bilmeyecek.</label>
      <textarea
        id="confess"
        maxLength={80}
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="rounded-[12px] bg-ink-950 p-3 text-[18px] shadow-[inset_0_0_0_2px_var(--ash-500)] outline-none focus:shadow-[inset_0_0_0_2px_var(--accent)]"
      />
      <span className="text-right text-[14px] text-bone-dim">{[...text].length}/80</span>
      <InkButton type="submit" disabled={!text.trim()}>
        Gönder
      </InkButton>
    </form>
  );
}

function ConfessionGuess({ view, waiting }: { view: View; waiting: number }) {
  const g = view.game!;
  const send = useRoom((s) => s.send);
  const me = view.you!.id;
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" aria-label="Anonim cevaplar">
        {g.answers.map((a, i) => (
          <li
            key={i}
            className={`rounded-[12px] p-3 text-[17px] ${i === g.spotlight ? 'bg-parchment-200 text-ink-text shadow-[0_0_24px_#EDE6D655]' : 'bg-ink-800 text-bone-dim'}`}
          >
            {i === g.spotlight && <span className="block font-gothic text-[18px]">Spot ışığında</span>}
            {a}
          </li>
        ))}
      </ul>
      {g.amAuthor ? (
        <Info>Spot ışığındaki cevap senin. Belli etme!</Info>
      ) : g.myInput ? (
        <Info>Tahminin gizli. {waiting > 0 ? `${waiting} kişi bekleniyor…` : ''}</Info>
      ) : (
        <>
          <p className="text-center text-[18px]">Spot ışığındakini kim yazdı?</p>
          <div className="grid grid-cols-3 gap-2">
            {view.players
              .filter((p) => !p.left && p.id !== me)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => send({ t: 'vote', playerId: p.id })}
                  className="flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-[14px] bg-ink-800 shadow-[inset_0_0_0_1px_var(--ash-500)] active:scale-95"
                >
                  <Avatar index={p.avatar} size={42} />
                  <span className="max-w-full truncate px-1 text-[15px]">{p.name}</span>
                </button>
              ))}
          </div>
        </>
      )}
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
  const q = g.card?.type === 'question';
  const anlat = g.card?.tags?.includes('anlat');
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-[18px]">
        {anlat ? 'Masa kelimeyi bildi mi?' : q ? `${names} dürüstçe cevapladı mı?` : `${names} görevi yaptı mı?`}
        <span className="block text-[14px] text-bone-dim">Acele yok; bitince bas.</span>
      </p>
      <div className="flex gap-2">
        <InkButton variant="secondary" className="flex-1" onClick={() => send({ t: 'judge', done: false })} seed={61}>
          {anlat ? 'Bilemedi' : q ? 'Kaçtı' : 'Yapmadı'} → {drinkWord(view).verb}
        </InkButton>
        <InkButton className="flex-1" onClick={() => send({ t: 'judge', done: true })} seed={62}>
          {anlat ? 'Bildi' : q ? 'Cevapladı' : 'Yaptı'}
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
      <p className="text-center text-[18px]">Yapmayanları işaretle, onlar {drinkWord(view).verb}.</p>
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
              <span className="truncate text-[16px]">{on ? (view.settings.drinking ? 'İçer: ' : 'Ceza: ') : ''}{p.name}</span>
            </button>
          );
        })}
      </div>
      <InkButton onClick={() => send({ t: 'judge', payers })} seed={63}>
        {payers.length ? `Hükmü ver (${payers.length} kişi ${drinkWord(view).verb})` : 'Herkes yaptı'}
      </InkButton>
    </div>
  );
}

function VoteGrid({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const me = view.you!.id;
  const choices = view.players.filter((p) => !p.left && p.id !== me);
  if (view.game!.card?.type === 'golden') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-center text-[18px]">Kimi seçiyorsun?</p>
        <div className="grid grid-cols-3 gap-2">
          {choices.map((p) => (
            <button key={p.id} type="button" onClick={() => send({ t: 'vote', playerId: p.id })} className="flex min-h-[92px] flex-col items-center justify-center gap-1 rounded-[14px] bg-ink-800 shadow-[inset_0_0_0_1px_var(--ash-500)]">
              <Avatar index={p.avatar} size={46} />
              <span className="max-w-full truncate px-1 text-[15px]">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
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
