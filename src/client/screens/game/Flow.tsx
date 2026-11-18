// Akış: "şu an ne oluyor" şeridi, kompakt kart, host'un "Sonraki" çubuğu, gizli kelime kutusu.
import { InkButton } from '../../components/InkButton';
import { InkFrame } from '../../components/ink/InkFrame';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { Card } from '../../../engine/cards';
import type { View } from '../../../engine/viewFor';
import { CardText } from '../../components/GameCard/CardText';
import { WaxSeal } from '../../components/GameCard/GameCard';
import { TypeIcon } from '../../components/GameCard/TypeIcon';
import { cardLabel } from '../../components/GameCard/labels';
import { useRoom } from '../../store/room';
import { drinkWord, howTo, nowLine } from './explain';
import { useNames } from './hooks';

// Üst çubuğun altında: sıra kimde, ne bekleniyor. Sıra sendeyse vurgulu.
export function NowBar({ view }: { view: View }) {
  const line = nowLine(view);
  if (!line) return null;
  return (
    <motion.p
      key={line.text}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`ribbon mx-2 mb-2 py-2 text-center text-[17px] font-bold leading-snug land:mx-auto land:mb-1 land:w-full land:max-w-2xl land:py-1 land:text-[15px] ${line.mine ? 'ribbon-mine' : 'ribbon-idle'}`}
      role="status"
      aria-live="polite"
    >
      {line.text}
    </motion.p>
  );
}

// Eylem ve sonuç fazlarında kart: görselsiz, okunaklı, kuralıyla birlikte
export function CardCompact({ view, card, dense = false }: { view: View; card: Card; dense?: boolean }) {
  const g = view.game!;
  const names = useNames(view);
  const unit = view.you?.sober || !view.settings.drinking ? 'ceza' : 'yudum';
  const frame = card.rarity === 'legendary' ? 'var(--gold-400)' : card.rarity === 'rare' ? '#C9CED6' : 'transparent';
  return (
    <div
      className={`paper relative w-full max-w-sm rounded-[14px] ${dense ? 'p-3 pt-2' : 'p-4 pt-3'}`}
      style={{ outline: `2px solid ${frame}`, outlineOffset: 3 }}
      role="group"
      aria-label={`${cardLabel(card)} kartı`}
    >
      <InkFrame seed={hashSeed(card.id)} stroke="#2a1f17" width={1.6} className="m-[5px] !h-[calc(100%-10px)] !w-[calc(100%-10px)]" />
      <Flourish className="left-1 top-1" />
      <Flourish className="right-1 top-1 -scale-x-100" />
      <Flourish className="bottom-1 left-1 -scale-y-100" />
      <Flourish className="bottom-1 right-1 -scale-100" />
      <div className={`flex items-center justify-between gap-2 ${dense ? 'mb-1' : 'mb-2'}`}>
        <span className="flex items-center gap-2 rounded-full bg-ink-950 py-1 pl-1 pr-3 text-[15px] text-bone-100">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-parchment-200">
            <TypeIcon type={card.type} size={18} />
          </span>
          {cardLabel(card)}
        </span>
        {card.penalty > 0 && (
          <span className="flex items-center gap-1 text-[15px] font-bold">
            <WaxSeal n={card.penalty} size={30} label={`${card.penalty} ${unit}`} />
          </span>
        )}
      </div>
      <p className={`text-center font-extrabold leading-[1.2] ${dense ? 'text-[18px]' : 'text-[21px]'}`}>
        <CardText text={card.text} tokens={g.tokens} names={names} sober={unit === 'ceza'} />
      </p>
      {!dense && <p className="mt-2 border-t border-[#0002] pt-2 text-center text-[15px] leading-snug text-[#3a2f2a]">{howTo(card, view)}</p>}
    </div>
  );
}

function hashSeed(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return h;
}

// Köşe süsü: mürekkep kıvrımı
function Flourish({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden width="26" height="26" viewBox="0 0 26 26" className={`pointer-events-none absolute ${className}`}>
      <path d="M3,23 C3,10 10,3 23,3 M3,23 C6,16 10,12 15,11 C11,13 10,17 13,18 C16,19 17,15 15,13" fill="none" stroke="#2a1f17" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// Gizli kelime / görev: yalnızca hedefin telefonunda, kapalı gelir, basılı tutunca açılır
export function SecretBox({ secret, title = 'Gizli kelimen' }: { secret: string; title?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onPointerDown={() => setOpen(true)}
      onPointerUp={() => setOpen(false)}
      onPointerLeave={() => setOpen(false)}
      onClick={(e) => e.preventDefault()}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setOpen(true); }}
      onKeyUp={() => setOpen(false)}
      className="w-full max-w-sm select-none rounded-[16px] bg-[#3B2650] p-4 text-center text-bone-100 shadow-[0_0_0_2px_#8E6CD8,0_10px_24px_#000a]"
      aria-label={`${title}: görmek için basılı tut`}
    >
      <span className="block text-[15px] text-bone-dim">{title} · yalnızca sende</span>
      <span className={`mt-1 block text-[28px] font-extrabold leading-tight ${open ? '' : 'blur-[10px]'}`} aria-hidden={!open}>
        {open ? secret : 'gizli gizli gizli'}
      </span>
      <span className="mt-1 block text-[14px] text-bone-dim">{open ? 'Kimseye gösterme!' : 'Görmek için basılı tut'}</span>
    </button>
  );
}

// Host çubuğu: rahat tempoda masa konuşur, host "Sonraki" der. Uzun bekleyişte "beklemeden geç".
export function HostBar({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const g = view.game!;
  const me = view.you;
  const host = view.players.find((p) => p.id === view.hostId);
  const canDrive = !!me && (me.isHost || !host || !host.connected || host.left);
  const key = `${view.phase}:${g.turnNo}:${g.stage}:${g.step}`;
  const [since, setSince] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setSince(Date.now());
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [key]);
  const waited = now - since;
  const word = drinkWord(view);

  const done = ['resolve', 'tableEvent', 'finale'].includes(view.phase);
  if (!done) {
    // Bekleyiş: biri uyuyakaldıysa host 20 sn sonra beklemeden geçebilir
    if (!canDrive || waited < 20_000) return null;
    let label: string | null = null;
    if (view.phase === 'choose' && g.readerId !== me?.id) label = 'Okuyucu yerine kart oynat';
    else if (view.phase === 'action' && !g.mg && g.waitingOn.length && !g.waitingOn.every((id) => id === me?.id))
      label = g.input === 'judge' ? 'Hükümsüz geç (kimse içmez)' : `Beklemeden geç (${g.waitingOn.length} kişi)`;
    if (!label) return null;
    return (
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-center px-3 pb-3 safe-bottom land:left-1/2 land:mx-0 land:max-w-none">
        <button type="button" onClick={() => send({ t: 'advance', at: g.stepKey })} className="min-h-[48px] rounded-full bg-ink-800 px-5 text-[16px] text-bone-dim shadow-[inset_0_0_0_1px_var(--ash-500)]">
          {label}
        </button>
      </div>
    );
  }

  const timed = view.settings.pace === 'timed';
  const label = view.phase === 'finale' ? 'Gecenin özetine geç' : 'Sonraki kart →';
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md bg-gradient-to-t from-ink-950 via-ink-950/95 to-transparent px-3 pb-3 pt-6 safe-bottom land:left-1/2 land:mx-0 land:max-w-none land:pb-2 land:pt-3">
      {canDrive ? (
        <InkButton className="min-h-[62px] w-full text-[21px] land:min-h-[52px]" seed={77} onClick={() => send({ t: 'advance', at: g.stepKey })}>
          {label}
        </InkButton>
      ) : (
        <p className="rounded-[14px] bg-ink-800 px-4 py-3 text-center text-[16px] text-bone-dim shadow-[inset_0_0_0_1px_var(--ash-500)]">
          {timed ? 'Sıradaki kart birazdan açılacak.' : `Hazır olunca ${host?.name ?? 'host'} sıradaki kartı açacak. Bu arada ${word.imp === 'iç' ? 'kadehler' : 'bardaklar'} dolsun.`}
        </p>
      )}
    </div>
  );
}
