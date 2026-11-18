// Aktif kurallar/lanetler (asma tabelalar), Yakala! düğmesi, masa oylaması ve sonucu.
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { EffectView, View } from '../../../engine/viewFor';
import { Avatar } from '../../components/Avatar';
import { InkButton } from '../../components/InkButton';
import { useReducedMotion } from '../../fx/motionPref';
import { useRoom } from '../../store/room';
import { drinkWord } from './explain';
import { SecretBox } from './Flow';
import { buzz, useRemaining } from './hooks';

const CATCH_PHASES = ['choose', 'reveal', 'action', 'resolve', 'tableEvent'];

function turnsLabel(e: EffectView) {
  return e.turnsLeft === 'act' ? 'perde sonuna kadar' : `${e.turnsLeft} tur`;
}

// Zincire asılı tabelalar: üst çubuğa sallanarak yerleşir
export function EffectSigns({ view }: { view: View }) {
  const g = view.game!;
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const send = useRoom((s) => s.send);
  const word = drinkWord(view);
  if (!g.effects.length) return null;
  const signLabel = (e: EffectView) =>
    e.kind === 'mission' ? (e.mine ? 'Görevin var! · dokun' : 'Gizli Görev · ajan kim?')
      : `${e.kind === 'curse' ? 'Lanet · ' : e.kind === 'decree' ? 'Ferman · ' : 'Kural · '}${e.text.replace(/^(Kural|Lanet|Ferman):\s*/, '')}`;
  const signClass = (e: EffectView) =>
    e.kind === 'mission' ? (e.mine ? 'bg-[#8E6CD8] text-ink-950 font-bold animate-pulse' : 'bg-[#3B2650] text-bone-100')
      : e.kind === 'curse' ? 'bg-[#3B2650] text-bone-100' : 'bg-parchment-200 text-ink-text';
  return (
    <div className="mt-1">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full gap-2 overflow-x-auto pb-1" aria-label={`${g.effects.length} aktif kural ve lanet, ayrıntı için dokun`}>
        <AnimatePresence initial={false}>
          {g.effects.map((e) => (
            <motion.span
              key={e.id}
              className="relative flex shrink-0 flex-col items-center"
              initial={reduce ? { opacity: 0 } : { y: -60, rotate: -14, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { y: 0, rotate: [0, 8, -5, 3, 0], opacity: 1 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.9 }}
              style={{ transformOrigin: '50% 0%' }}
            >
              <svg width="60" height="10" viewBox="0 0 60 10" aria-hidden>
                <path d="M14,0 L20,10 M46,0 L40,10" stroke="var(--ash-500)" strokeWidth="2" strokeDasharray="3 2" />
              </svg>
              <span className={`max-w-[170px] truncate rounded-[6px] px-2 py-1 text-[14px] ${signClass(e)}`}>{signLabel(e)}</span>
            </motion.span>
          ))}
        </AnimatePresence>
      </button>
      {open && (
        <ul className="ink-panel mt-2 flex flex-col gap-2 p-3">
          {g.effects.map((e) =>
            e.kind === 'mission' ? (
              <li key={e.id} className="flex flex-col gap-2 text-[16px]">
                <span className="font-bold">{e.text}</span>
                {e.mine && e.secret ? (
                  <>
                    <SecretBox secret={e.secret} title="Gizli görevin" />
                    <span className="text-[14px] text-bone-dim">
                      {turnsLabel(e)} içinde yap. Başarınca bas: masa onaylarsa herkes {e.penalty} {word.noun} {word.verb}. Süre biterse ya da yakalanırsan sen {word.verb}.
                    </span>
                    <InkButton onClick={() => { send({ t: 'missionDone', effectId: e.id }); setOpen(false); }}>Görevi yaptım!</InkButton>
                  </>
                ) : (
                  <span className="text-[14px] text-bone-dim">
                    {turnsLabel(e)} · ajanı bilen “Yakala!” desin: doğruysa ajan {e.penalty} {word.noun} {word.verb}, yanlışsa suçlayan 1 {word.noun}.
                  </span>
                )}
              </li>
            ) : (
              <li key={e.id} className="text-[16px]">
                <span className="font-bold">{e.text}</span>
                <span className="block text-[14px] text-bone-dim">
                  {turnsLabel(e)} · bozan {e.penalty} {word.noun} {word.verb}
                  {e.targetId ? ` · lanetli: ${view.players.find((p) => p.id === e.targetId)?.name}` : ''}
                </span>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

// Fener: Yakala! düğmesi + suçlama akışı
export function CatchButton({ view }: { view: View }) {
  const g = view.game!;
  const send = useRoom((s) => s.send);
  const [sheet, setSheet] = useState(false);
  const [effectId, setEffectId] = useState<string | null>(null);
  if (!g.effects.length || !CATCH_PHASES.includes(view.phase) || g.catchVote) return null;
  const me = view.you!.id;
  const word = drinkWord(view);
  // Kendi görevin "yakalanacak" bir şey değildir
  const catchable = g.effects.filter((e) => !(e.kind === 'mission' && e.mine));
  if (!catchable.length) return null;
  const effect = catchable.find((e) => e.id === (effectId ?? (catchable.length === 1 ? catchable[0]!.id : '')));
  const suspects = effect?.kind === 'curse'
    ? view.players.filter((p) => p.id === effect.targetId && p.id !== me)
    : view.players.filter((p) => !p.left && p.id !== me);
  const close = () => {
    setSheet(false);
    setEffectId(null);
  };
  return (
    <>
      <button
        type="button"
        onClick={() => setSheet(true)}
        className="fixed bottom-[96px] right-3 z-30 flex h-[64px] w-[64px] flex-col items-center justify-center rounded-full bg-[#5A1218] text-[14px] text-bone-100 shadow-[0_0_0_2px_var(--bone-100),0_6px_18px_#000c] land:bottom-auto land:right-[256px] land:top-[8px] land:h-[46px] land:w-auto land:flex-row land:gap-2 land:px-4 land:text-[16px] land:font-bold"
        aria-label="Yakala! Kuralı bozanı bildir"
      >
        <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden>
          <path d="M7,4 h8 M11,0 v4 M5,6 h12 l-1,14 h-10 Z M8,22 h6" stroke="var(--bone-100)" strokeWidth="2" fill="none" strokeLinejoin="round" />
          <path className="flame" d="M11,9 C14,12 14,15 11,17 C8,15 8,12 11,9 Z" fill="#FF6B5A" />
        </svg>
        Yakala!
      </button>
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={close}>
          <div className="ink-panel w-full rounded-b-none p-4 safe-bottom" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Yakala">
            <p className="font-gothic text-[28px]">Yakala!</p>
            {!effect ? (
              <>
                <p className="mb-2 text-bone-dim">Hangi kural bozuldu?</p>
                <div className="flex flex-col gap-2">
                  {catchable.map((e) => (
                    <button key={e.id} type="button" onClick={() => setEffectId(e.id)} className="min-h-[56px] rounded-[12px] bg-ink-950 px-3 text-left text-[16px] shadow-[inset_0_0_0_1px_var(--ash-500)]">
                      {e.kind === 'mission' ? 'Gizli Görev: ajanı yakala' : e.text}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="mb-2 text-[16px]">{effect.kind === 'mission' ? 'Gizli Görev' : effect.text}</p>
                <p className="mb-2 text-bone-dim">
                  {effect.kind === 'mission'
                    ? `Ajan kim? Oylama yok, gerçek hemen açılır. Bilirsen ajan ${word.verb}; yanılırsan 1 ${word.noun} sen.`
                    : `Kim bozdu? Masa hemen oylar. Yanlış suçlarsan 1 ${word.noun} sen ${word.verb === 'içer' ? 'içersin' : 'ceza alırsın'}.`}
                </p>
                {suspects.length === 0 ? (
                  <p className="text-bone-dim">Bu laneti yalnızca lanetli bozabilir; o da sensin.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {suspects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          send({ t: 'catch', effectId: effect.id, accused: p.id });
                          close();
                        }}
                        className="flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-[12px] bg-ink-950 shadow-[inset_0_0_0_1px_var(--ash-500)]"
                      >
                        <Avatar index={p.avatar} size={42} />
                        <span className="max-w-full truncate px-1 text-[14px]">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            <InkButton variant="ghost" className="mt-2 w-full" onClick={close}>
              Vazgeç
            </InkButton>
          </div>
        </div>
      )}
    </>
  );
}

// Yakala! oylaması: tüm ekranlarda kırmızı fener yanıp söner, suçlanan titrer
export function CatchOverlay({ view }: { view: View }) {
  const g = view.game!;
  const cv = g.catchVote;
  const send = useRoom((s) => s.send);
  const left = useRemaining(cv?.endsAt);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (cv) buzz([80, 40, 80]);
  }, [cv?.accused, cv]);
  if (!cv) return null;
  const me = view.you?.id ?? '';
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  const accused = view.players.find((p) => p.id === cv.accused);
  const effect = g.effects.find((e) => e.id === cv.effectId);
  const canVote = cv.voters.includes(me) && cv.myVote === null;
  const mission = cv.mode === 'mission';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="alertdialog" aria-label="Yakala oylaması">
      {!reduce && <div className="pointer-events-none absolute inset-0 animate-pulse shadow-[inset_0_0_80px_#D7263D]" />}
      <div className="ink-panel relative flex w-full max-w-sm flex-col items-center gap-3 p-5 text-center">
        <p className="font-gothic text-[34px] text-[#FF6B5A]">{mission ? 'Görev tamam mı?' : 'Yakalandı!'}</p>
        {accused && (
          <motion.div animate={reduce ? undefined : { x: [0, -6, 6, -4, 4, 0] }} transition={{ duration: 0.5, repeat: 2 }}>
            <Avatar index={accused.avatar} size={72} />
          </motion.div>
        )}
        {mission ? (
          <>
            <p className="text-[18px]">
              Ajan <b>{name(cv.accused)}</b>’miş! Görevini yaptığını söylüyor:
            </p>
            {cv.missionText && <p className="rounded-[10px] bg-parchment-200 p-3 text-[18px] font-bold text-ink-text">“{cv.missionText}”</p>}
          </>
        ) : (
          <>
            <p className="text-[18px]">
              <b>{name(cv.accuser)}</b>, <b>{name(cv.accused)}</b> kişisini yakaladı.
            </p>
            {effect && <p className="text-[16px] text-bone-dim">{effect.text}</p>}
          </>
        )}
        <div className="h-[8px] w-full rounded-full bg-ink-950">
          <div className="h-full rounded-full bg-[#FF6B5A] transition-[width] duration-200" style={{ width: `${Math.min(100, (left / (mission ? 12000 : 8000)) * 100)}%` }} />
        </div>
        {canVote ? (
          <div className="flex w-full gap-2">
            <InkButton variant="secondary" className="flex-1" onClick={() => send({ t: 'catchVote', yes: false })}>
              {mission ? 'Yapmadı' : 'Bozmadı'}
            </InkButton>
            <InkButton className="flex-1" onClick={() => send({ t: 'catchVote', yes: true })}>
              {mission ? 'Yaptı' : 'Bozdu'}
            </InkButton>
          </div>
        ) : (
          <p className="text-bone-dim">
            {cv.voters.includes(me) ? 'Oyun verildi.' : me === cv.accused ? 'Masa seni yargılıyor…' : 'Masa oyluyor…'} ({cv.votedCount}/{cv.voters.length})
          </p>
        )}
      </div>
    </div>
  );
}

// Yakala!/görev sonucu: alt kısımda 6 sn'lik kart; dokununca kapanır, kural tabelalarını örtmez.
// (Önceki sürümde her yeni görünümde zamanlayıcı yeniden kurulduğu için kart ekranda takılı kalıyordu.)
export function CatchResultToast({ view }: { view: View }) {
  const lc = view.game?.lastCatch;
  const at = lc?.at;
  const serverNow = useRoom((s) => s.serverNow);
  const [shownAt, setShownAt] = useState<number | null>(null);
  useEffect(() => {
    if (!at || serverNow() - at > 6000) return;
    setShownAt(at);
    const t = window.setTimeout(() => setShownAt((cur) => (cur === at ? null : cur)), 6000);
    return () => window.clearTimeout(t);
    // yalnızca yeni bir sonuç geldiğinde
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at]);
  if (!lc || shownAt !== lc.at) return null;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  const word = drinkWord(view);
  const pays = lc.payments.map((p) => `${name(p.id)} ${p.label}`).join(', ');
  let title: string;
  let body: string;
  switch (lc.mode) {
    case 'mission':
      title = lc.guilty ? 'Görev başarıldı!' : 'Masa inanmadı!';
      body = lc.guilty ? `${name(lc.accused)} ajanmış ve işini yaptı. ${lc.payments.length} kişi ${word.verb}.` : `${name(lc.accused)} yaptım dedi ama masa yemedi. Ajan ${word.verb}.`;
      break;
    case 'missionGuess':
      title = lc.guilty ? 'Ajan yakalandı!' : 'Yanlış ajan!';
      body = lc.guilty ? `${name(lc.accuser)}, ajanı buldu: ${name(lc.accused)}.` : `${name(lc.accused)} ajan değil. ${name(lc.accuser)} boşuna fener yaktı.`;
      break;
    case 'missionFail':
      title = 'Görev başarısız';
      body = `Süre doldu. Ajan ${name(lc.accused)}’miş.`;
      break;
    default:
      title = lc.guilty ? 'Suçlu!' : 'Yakalanmadı!';
      body = lc.guilty
        ? `${name(lc.accused)} kuralı bozdu (${lc.yes} evet, ${lc.no} hayır).`
        : `Masa ${name(lc.accused)} kişisini akladı (${lc.yes} evet, ${lc.no} hayır). ${name(lc.accuser)} boşuna fener yaktı.`;
  }
  return (
    <button
      type="button"
      onClick={() => setShownAt(null)}
      className="fixed inset-x-3 bottom-[92px] z-40 mx-auto block max-w-sm land:left-1/2 land:bottom-[76px] rounded-[14px] bg-parchment-200 p-4 text-left text-ink-text shadow-[0_10px_30px_#000c]"
      role="status"
      aria-label={`${title}. Kapatmak için dokun.`}
    >
      <p className="font-gothic text-[24px]">{title}</p>
      <p className="text-[17px]">{body}</p>
      {lc.missionText && <p className="mt-1 text-[16px] italic">Görev: “{lc.missionText}”</p>}
      {pays && <p className="mt-1 text-[17px] font-bold">{word.verb === 'içer' ? 'İçiyor' : 'Ceza'}: {pays}</p>}
      {lc.mini.map((m, i) => (
        <p key={i} className="mt-1 text-[16px]">Ceza Destesi: {m.text}</p>
      ))}
      <span className="mt-1 block text-right text-[13px] text-[#5a4f4a]">kapat ✕</span>
    </button>
  );
}
