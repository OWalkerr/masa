// Aktif kurallar/lanetler (asma tabelalar), Yakala! düğmesi, masa oylaması ve sonucu.
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { EffectView, View } from '../../../engine/viewFor';
import { Avatar } from '../../components/Avatar';
import { InkButton } from '../../components/InkButton';
import { useReducedMotion } from '../../fx/motionPref';
import { useRoom } from '../../store/room';
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
  if (!g.effects.length) return null;
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
              <span className={`max-w-[150px] truncate rounded-[6px] px-2 py-1 text-[14px] ${e.kind === 'curse' ? 'bg-[#3B2650] text-bone-100' : 'bg-parchment-200 text-ink-text'}`}>
                {e.kind === 'curse' ? 'Lanet · ' : e.kind === 'decree' ? 'Ferman · ' : 'Kural · '}
                {e.text.replace(/^(Kural|Lanet|Ferman):\s*/, '')}
              </span>
            </motion.span>
          ))}
        </AnimatePresence>
      </button>
      {open && (
        <ul className="ink-panel mt-2 flex flex-col gap-2 p-3">
          {g.effects.map((e) => (
            <li key={e.id} className="text-[16px]">
              <span className="font-bold">{e.text}</span>
              <span className="block text-[14px] text-bone-dim">
                {turnsLabel(e)} · bozan {e.penalty} öder
                {e.targetId ? ` · lanetli: ${view.players.find((p) => p.id === e.targetId)?.name}` : ''}
              </span>
            </li>
          ))}
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
  const effect = g.effects.find((e) => e.id === (effectId ?? (g.effects.length === 1 ? g.effects[0]!.id : '')));
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
        className="fixed bottom-[96px] right-3 z-30 flex h-[64px] w-[64px] flex-col items-center justify-center rounded-full bg-[#5A1218] text-[14px] text-bone-100 shadow-[0_0_0_2px_var(--bone-100),0_6px_18px_#000c]"
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
                  {g.effects.map((e) => (
                    <button key={e.id} type="button" onClick={() => setEffectId(e.id)} className="min-h-[56px] rounded-[12px] bg-ink-950 px-3 text-left text-[16px] shadow-[inset_0_0_0_1px_var(--ash-500)]">
                      {e.text}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="mb-2 text-[16px]">{effect.text}</p>
                <p className="mb-2 text-bone-dim">Kim bozdu? Masa 5 saniyede oylar. Yanlış suçlarsan 1 ödersin.</p>
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
  const me = view.you!.id;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  const accused = view.players.find((p) => p.id === cv.accused);
  const effect = g.effects.find((e) => e.id === cv.effectId);
  const canVote = cv.voters.includes(me) && cv.myVote === null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="alertdialog" aria-label="Yakala oylaması">
      {!reduce && <div className="pointer-events-none absolute inset-0 animate-pulse shadow-[inset_0_0_80px_#D7263D]" />}
      <div className="ink-panel relative flex w-full max-w-sm flex-col items-center gap-3 p-5 text-center">
        <p className="font-gothic text-[34px] text-[#FF6B5A]">Yakalandı!</p>
        {accused && (
          <motion.div animate={reduce ? undefined : { x: [0, -6, 6, -4, 4, 0] }} transition={{ duration: 0.5, repeat: 2 }}>
            <Avatar index={accused.avatar} size={72} />
          </motion.div>
        )}
        <p className="text-[18px]">
          <b>{name(cv.accuser)}</b>, <b>{name(cv.accused)}</b> kişisini yakaladı.
        </p>
        {effect && <p className="text-[16px] text-bone-dim">{effect.text}</p>}
        <div className="h-[8px] w-full rounded-full bg-ink-950">
          <div className="h-full rounded-full bg-[#FF6B5A] transition-[width] duration-200" style={{ width: `${Math.min(100, (left / 5000) * 100)}%` }} />
        </div>
        {canVote ? (
          <div className="flex w-full gap-2">
            <InkButton variant="secondary" className="flex-1" onClick={() => send({ t: 'catchVote', yes: false })}>
              Bozmadı
            </InkButton>
            <InkButton className="flex-1" onClick={() => send({ t: 'catchVote', yes: true })}>
              Bozdu
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

// Yakala! sonucu: birkaç saniyelik kart
export function CatchResultToast({ view }: { view: View }) {
  const lc = view.game?.lastCatch;
  const serverNow = useRoom((s) => s.serverNow);
  const [shownAt, setShownAt] = useState<number | null>(null);
  useEffect(() => {
    if (!lc) return;
    if (serverNow() - lc.at > 6000) return;
    setShownAt(lc.at);
    const t = window.setTimeout(() => setShownAt(null), 5000);
    return () => window.clearTimeout(t);
  }, [lc?.at, lc, serverNow]);
  if (!lc || shownAt !== lc.at) return null;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  const pay = lc.payments[0];
  return (
    <div className="fixed inset-x-3 top-24 z-40 mx-auto max-w-sm rounded-[14px] bg-parchment-200 p-4 text-ink-text shadow-[0_10px_30px_#000c]" role="status">
      <p className="font-gothic text-[24px]">{lc.guilty ? 'Suçlu!' : 'Yanlış suçlama!'}</p>
      <p className="text-[17px]">
        {lc.guilty ? `${name(lc.accused)} kuralı bozdu` : `${name(lc.accuser)} boşuna fener yaktı`} ({lc.yes} evet, {lc.no} hayır).
        {pay ? ` ${name(pay.id)} ${pay.label} öder.` : ''}
      </p>
      {lc.mini.map((m, i) => (
        <p key={i} className="mt-1 text-[16px]">Ceza Destesi: {m.text}</p>
      ))}
    </div>
  );
}
