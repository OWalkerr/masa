// Hüküm: bedeller (sayılı bal mumu mührü), cesaret puanları, oy sayımı, mini cezalar, Su Molası.
import { Cauldron } from '../../components/Cauldron';
import { GalleryResult } from './Gallery';
import { SketchFinal } from './Sketch';
import { tikLine } from '../../tik/lines';
import { TikSays } from '../../tik/TikSays';
import { motion } from 'motion/react';
import { useState } from 'react';
import { InkButton } from '../../components/InkButton';
import { useRoom } from '../../store/room';
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

  const g2 = g;
  const optionLabel = (i: number) => {
    const o = g2.options[i];
    if (o === undefined) return '?';
    return g2.optionPlayers ? name(o) : o;
  };
  const effect = r.effect ? g.effects.find((e) => e.id === r.effect) : undefined;
  const tags = g.card?.tags ?? [];

  if (r.vetoed) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-3" aria-live="polite">
        <p className="ink-panel p-4 text-center text-[19px]">
          <span className="block font-gothic text-[28px]">Veto!</span>
          Biri kartı gömdü. Kim olduğunu mezar bile bilmiyor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3" aria-live="polite">
      {effect && (
        <p className="ink-panel p-4 text-center text-[18px]">
          <span className="block font-gothic text-[26px]">{effect.kind === 'curse' ? 'Lanet tuttu' : effect.kind === 'mission' ? 'Ajan iş başında' : 'Kural masada'}</span>
          <span className="block text-[15px] text-bone-dim">
            {effect.kind === 'mission' ? 'Kim olduğunu yalnızca ajan biliyor. Şüphelendiğin an “Yakala!”' : 'Üstteki tabelada duruyor. Bozanı gören “Yakala!” desin.'}
          </span>
        </p>
      )}
      {r.gallery && <GalleryResult view={view} r={r.gallery} />}
      {r.sketch && (
        <div className="flex flex-col items-center gap-2">
          <SketchFinal strokes={r.sketch.strokes} word={r.sketch.word} />
          <p className="text-center text-[16px]">
            Ressam: <b>{name(r.sketch.drawer)}</b> ·{' '}
            {r.sketch.correct.length ? `Bilenler: ${r.sketch.correct.map(name).join(', ')}` : 'Kimse bilemedi'}
          </p>
        </div>
      )}
      {r.note && <p className="ink-panel p-3 text-center text-[17px] italic">{r.note}</p>}
      {r.mg && r.mg.kind !== 'bomb' && (
        <ul className="ink-panel flex flex-col gap-1 p-3">
          {Object.entries(r.mg.times)
            .sort((a, b) => (r.mg!.kind === 'countdown' ? Math.abs((a[1] ?? 1e9) - 10000) - Math.abs((b[1] ?? 1e9) - 10000) : (a[1] ?? 1e9) - (b[1] ?? 1e9)))
            .map(([id, ms]) => (
              <li key={id} className={`flex justify-between text-[17px] ${r.mg!.losers.includes(id) ? 'text-[#FF8A7A]' : ''}`}>
                <span>{name(id)}</span>
                <span className="tabular-nums">
                  {ms === null ? 'dokunmadı' : r.mg!.kind === 'countdown' ? `${(ms / 1000).toFixed(2)} sn` : ms < 0 ? 'erken!' : `${ms} ms`}
                </span>
              </li>
            ))}
        </ul>
      )}
      {r.mg?.kind === 'bomb' && <p className="ink-panel p-3 text-center text-[18px]">Bomba {r.mg.losers.map(name).join(' ve ')} elinde patladı.</p>}
      {r.winner && <p className="ink-panel p-3 text-center text-[18px]">Düelloyu <b>{name(r.winner)}</b> kazandı.</p>}
      {r.secret !== undefined && (
        <div className="ink-panel p-3 text-center">
          <p className="text-[16px] text-bone-dim">{tags.includes('yalan') ? 'Yalan olan' : tags.includes('olcek') ? 'Gizli puan' : 'Gizli seçim'}</p>
          <p className={`font-extrabold ${tags.includes('olcek') ? 'text-[44px] leading-none' : 'text-[24px]'}`}>{optionLabel(r.secret)}</p>
          {r.guesses && (
            <ul className="mt-2 flex flex-wrap justify-center gap-2">
              {Object.entries(r.guesses).map(([id, i]) => (
                <li key={id} className={`flex items-center gap-1 rounded-full px-2 py-1 text-[15px] ${i === r.secret ? 'bg-[#2E5E4E]' : 'bg-ink-950'}`}>
                  <Avatar index={avatar(id)} size={22} />
                  {name(id)}: <b>{optionLabel(i)}</b>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-[15px] text-bone-dim">{r.correct?.length ? `Tam bilenler: ${r.correct.map(name).join(', ')}` : 'Kimse tam bilemedi.'}</p>
        </div>
      )}
      {r.author && (
        <div className="rounded-[14px] bg-parchment-200 p-4 text-center text-ink-text">
          <p className="text-[17px] italic">“{r.spotlight}”</p>
          <p className="mt-1 text-[18px]">
            Yazan: <b>{name(r.author)}</b>
          </p>
          <p className="text-[15px]">{r.correct?.length ? `Bilenler: ${r.correct.map(name).join(', ')}` : 'Kimse bilemedi.'}</p>
        </div>
      )}
      {r.passed && r.passed.length > 0 && <p className="text-center text-[16px] text-bone-dim">Pas geçenler: {r.passed.map(name).join(', ')}</p>}
      {r.shielded && r.shielded.length > 0 && <p className="text-center text-[16px]">Kalkan kaldıranlar: {r.shielded.map(name).join(', ')}</p>}
      {r.reflected?.map((x, i) => (
        <p key={i} className="text-center text-[16px]">
          {name(x.from)} aynayı {name(x.to)} kişisine tuttu.
        </p>
      ))}
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
          {r.yesIds.length ? `İtiraf edenler: ${r.yesIds.map(name).join(', ')}` : 'Kimse yapmamış. Ya melekler masası ya da yalancılar.'}
        </p>
      )}

      {r.potAdd !== undefined && (
        <div className="ink-panel flex items-center gap-3 p-3">
          <Cauldron n={r.potAdd} size={52} label={false} />
          <p className="text-[17px]">
            Kimse içmedi, kazana bir yudum düştü. <b>Kazanda {r.potAdd}.</b>
            <span className="block text-[14px] text-bone-dim">Sonraki cezalı kazanı da içer.</span>
          </p>
        </div>
      )}
      {r.potSpill && (
        <motion.div
          className="flex items-center gap-3 rounded-[14px] bg-[#23330f] p-3 shadow-[0_0_0_2px_#A3E635,0_0_24px_#A3E63555]"
          initial={reduce ? { opacity: 0 } : { scale: 1.4, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        >
          <Cauldron n={r.potSpill.units} size={52} label={false} />
          <p className="text-[17px]">
            <b className="font-gothic text-[24px]">Kazan devrildi!</b>
            <span className="block">
              {name(r.potSpill.id)} kazandaki {r.potSpill.units} {view.settings.drinking ? 'yudumu' : 'cezayı'} da {view.settings.drinking ? 'içiyor' : 'alıyor'}.
            </span>
          </p>
        </motion.div>
      )}
      {r.mercy?.map((id) => (
        <p key={id} className="ink-panel p-3 text-center text-[16px]">
          TIK, {name(id)} için merhamete geldi: cebine bir <b>Kalkan</b> koydu.
        </p>
      ))}
      {r.payments.length === 0 ? (
        effect || r.potAdd !== undefined ? null : (
          <>
            <p className="ink-panel p-4 text-center text-[19px]">{view.settings.drinking ? 'Bu tur kimse içmiyor.' : 'Bu tur ceza yok.'}</p>
            <TikSays text={tikLine('nobody', `${view.code}${g.turnNo}`)} drinking={view.settings.drinking} />
          </>
        )
      ) : (
        <ul className="flex flex-col gap-2" aria-label={view.settings.drinking ? 'İçenler' : 'Ceza alanlar'}>
          <li className="text-center font-gothic text-[30px] leading-none text-[var(--accent)]">{view.settings.drinking ? 'İçiyor!' : 'Ceza!'}</li>
          {r.payments.map((p, i) => (
            <motion.li
              key={p.id}
              className={`ink-panel flex items-center gap-3 p-3 ${p.id === me ? 'shadow-[0_0_0_2px_var(--accent)]' : ''}`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.3, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18, delay: i * 0.12 }}
            >
              <Avatar index={avatar(p.id)} size={48} />
              <span className="flex-1 truncate text-[20px] font-bold">{p.id === me ? 'SEN' : name(p.id)}</span>
              <WaxSeal n={p.units} size={40} />
              <span className="text-[18px]">{p.sober ? `${p.label} yap` : `${p.label} iç`}</span>
            </motion.li>
          ))}
        </ul>
      )}

      {r.payments.length > 0 && (
        <TikSays
          text={tikLine(!view.settings.drinking ? 'sober' : r.payments.length >= 3 ? 'heavy' : 'drink', `${view.code}${g.turnNo}`)}
          drinking={view.settings.drinking}
        />
      )}

      {me && r.payments.some((p) => p.id === me) && view.phase === 'resolve' && <PowerReact view={view} />}

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
          <p className="text-[18px]">Bir saatte epey içtin. Bir bardak su iç; bundan sonra içmek yerine ceza alacaksın.</p>
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

// Bedel anında Kalkan ya da Ayna
function PowerReact({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const powers = view.you!.powers;
  const [mirror, setMirror] = useState(false);
  const me = view.you!.id;
  if (!powers.includes('shield') && !powers.includes('mirror')) return null;
  return (
    <div className="rounded-[14px] bg-parchment-200 p-3 text-ink-text">
      <p className="text-[17px]">Cebinde bir şey var…</p>
      {!mirror ? (
        <div className="mt-2 flex gap-2">
          {powers.includes('shield') && (
            <InkButton className="flex-1" onClick={() => send({ t: 'usePower', power: 'shield' })}>
              Kalkan kaldır
            </InkButton>
          )}
          {powers.includes('mirror') && (
            <InkButton variant="secondary" className="flex-1" onClick={() => setMirror(true)}>
              Ayna tut
            </InkButton>
          )}
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {view.players
            .filter((p) => !p.left && p.id !== me)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => send({ t: 'usePower', power: 'mirror', targetId: p.id })}
                className="flex min-h-[80px] flex-col items-center justify-center rounded-[12px] bg-ink-950 text-bone-100"
              >
                <Avatar index={p.avatar} size={36} />
                <span className="max-w-full truncate px-1 text-[14px]">{p.name}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
