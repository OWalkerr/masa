// Hüküm: bedeller (sayılı bal mumu mührü), cesaret puanları, oy sayımı, mini cezalar, Su Molası.
import { motion } from 'motion/react';
import type { View } from '../../../engine/viewFor';
import { Avatar } from '../../components/Avatar';
import { WaxSeal } from '../../components/GameCard/GameCard';
import { useReducedMotion } from '../../fx/motionPref';

export function ResolvePanel({ view }: { view: View }) {
  const g = view.game!;
  const r = g.result;
  const reduce = useReducedMotion();
  if (!r) return null;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  const avatar = (id: string) => view.players.find((p) => p.id === id)?.avatar ?? 0;
  const me = view.you?.id;
  const nextReader = nextReaderName(view);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3" aria-live="polite">
      {r.tally && Object.keys(r.tally).length > 0 && (
        <div className="ink-panel flex flex-col gap-2 p-3">
          <p className="text-[15px] text-bone-dim">Oylar</p>
          {Object.entries(r.tally)
            .sort((a, b) => b[1] - a[1])
            .map(([id, n]) => (
              <div key={id} className="flex items-center gap-2">
                <Avatar index={avatar(id)} size={30} />
                <span className="w-[96px] truncate text-[16px]">{name(id)}</span>
                <div className="h-[12px] flex-1 rounded-full bg-ink-950">
                  <motion.div
                    className="h-full rounded-full bg-bone-100"
                    initial={{ width: reduce ? `${(n / Math.max(...Object.values(r.tally!))) * 100}%` : 0 }}
                    animate={{ width: `${(n / Math.max(...Object.values(r.tally!))) * 100}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="w-6 text-right tabular-nums">{n}</span>
              </div>
            ))}
        </div>
      )}
      {r.yesIds && (
        <p className="ink-panel p-3 text-center text-[17px]">
          {r.yesIds.length ? `Yapmış olanlar: ${r.yesIds.map(name).join(', ')}` : 'Kimse yapmamış. Melekler masası.'}
        </p>
      )}

      {r.payments.length === 0 ? (
        <p className="ink-panel p-4 text-center text-[19px]">Bu tur kimse ödemiyor.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {r.payments.map((p, i) => (
            <motion.li
              key={p.id}
              className={`ink-panel flex items-center gap-3 p-3 ${p.id === me ? 'shadow-[0_0_0_2px_var(--accent)]' : ''}`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.3, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18, delay: i * 0.12 }}
            >
              <Avatar index={avatar(p.id)} size={40} />
              <span className="flex-1 truncate text-[18px]">{name(p.id)}{p.id === me ? ' (sen)' : ''}</span>
              <WaxSeal n={p.units} size={40} />
              <span className="text-[18px]">{p.label}</span>
            </motion.li>
          ))}
        </ul>
      )}

      {r.courage.length > 0 && (
        <p className="text-center text-[16px] text-bone-dim">
          {r.courage.map((c) => `${name(c.id)} +${c.pts} cesaret (${c.why})`).join(' · ')}
        </p>
      )}

      {r.mini.map((m, i) => (
        <div key={i} className="rounded-[14px] bg-parchment-200 p-4 text-ink-text">
          <p className="font-gothic text-[22px]">Ceza Destesi</p>
          <p className="text-[18px]">
            <b>{name(m.id)}</b>: {m.text}
          </p>
        </div>
      ))}

      {me && r.waterBreak.includes(me) && (
        <div className="rounded-[14px] bg-parchment-200 p-4 text-ink-text" role="alert">
          <p className="font-gothic text-[24px]">Su Molası</p>
          <p className="text-[18px]">Bir saatte epey içtin. Bir bardak su iç; bundan sonra bedellerin ceza olarak gelecek.</p>
        </div>
      )}

      {g.hasInheritForNext && nextReader && (
        <p className="text-center text-[15px] italic text-bone-dim">Seçilmeyen bir kart {nextReader} için miras kaldı…</p>
      )}
    </div>
  );
}

function nextReaderName(view: View): string | null {
  const g = view.game!;
  const order = view.order.filter((id) => view.players.some((p) => p.id === id && !p.left));
  const i = order.indexOf(g.readerId ?? '');
  if (i < 0 || order.length < 2) return null;
  return view.players.find((p) => p.id === order[(i + 1) % order.length])?.name ?? null;
}
