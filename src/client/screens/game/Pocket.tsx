// Cep: güç kartları (yalnızca sana görünür), Sabotaj seçimi, Sultan Kedi fermanı.
import { useState } from 'react';
import type { PowerKind } from '../../../engine/types';
import type { View } from '../../../engine/viewFor';
import { GameCard } from '../../components/GameCard/GameCard';
import { InkButton } from '../../components/InkButton';
import { useRoom } from '../../store/room';
import { useNames } from './hooks';

export const POWER_INFO: Record<PowerKind, { name: string; desc: string }> = {
  shield: { name: 'Kalkan', desc: 'Sana gelen bir bedeli iptal eder. Bedel anında kullanılır.' },
  mirror: { name: 'Ayna', desc: 'Bedelini başkasına yansıtır. Hedef kendi Kalkan’ıyla karşılık verebilir.' },
  swap: { name: 'Takas', desc: 'Okuyucuyken elini yeniden çekersin.' },
  sabotage: { name: 'Sabotaj', desc: 'Sonraki okuyucunun miras kartını sen seçersin.' },
};

export function PowerIcon({ kind, size = 22 }: { kind: PowerKind; size?: number }) {
  const s = { fill: 'none', stroke: 'var(--ink-950)', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {kind === 'shield' && <path d="M12,2 L20,5 C20,13 17,19 12,22 C7,19 4,13 4,5 Z" {...s} />}
      {kind === 'mirror' && (
        <g {...s}>
          <ellipse cx="12" cy="9" rx="6" ry="7" />
          <path d="M12,16 L12,22 M9,22 h6 M9,7 l3,-2" />
        </g>
      )}
      {kind === 'swap' && <path d="M4,8 h14 l-3,-3 M20,16 H6 l3,3" {...s} />}
      {kind === 'sabotage' && <path d="M6,20 L18,4 M8,4 c4,0 8,4 8,8 M4,14 l4,4" {...s} />}
    </svg>
  );
}

export function Pocket({ view }: { view: View }) {
  const you = view.you!;
  const g = view.game!;
  const [open, setOpen] = useState(false);
  const hasSabotage = g.restCards.length > 0;
  if (!you.powers.length && !you.decree) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-[48px] items-center gap-1 rounded-full bg-parchment-200 px-2 shadow-[0_0_0_2px_var(--gold-400)]"
        aria-label={`Cep: ${you.powers.map((p) => POWER_INFO[p].name).join(', ')}${you.decree ? ', ferman hakkı' : ''}`}
      >
        {you.powers.map((p, i) => (
          <PowerIcon key={i} kind={p} />
        ))}
        {you.decree && <span className="px-1 text-[14px] text-ink-text">Ferman</span>}
        {hasSabotage && <span className="h-2 w-2 rounded-full bg-[#7A1E24]" aria-hidden />}
      </button>
      {open && <PocketSheet view={view} onClose={() => setOpen(false)} />}
    </>
  );
}

function PocketSheet({ view, onClose }: { view: View; onClose: () => void }) {
  const you = view.you!;
  const g = view.game!;
  const send = useRoom((s) => s.send);
  const names = useNames(view);
  const [text, setText] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={onClose}>
      <div className="ink-panel max-h-[85vh] w-full overflow-y-auto rounded-b-none p-4 safe-bottom" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Cep">
        <p className="font-gothic text-[28px]">Cebin</p>
        <ul className="mt-2 flex flex-col gap-2">
          {you.powers.map((p, i) => (
            <li key={i} className="flex items-start gap-3 rounded-[12px] bg-parchment-200 p-3 text-ink-text">
              <PowerIcon kind={p} size={28} />
              <span>
                <b className="text-[17px]">{POWER_INFO[p].name}</b>
                <span className="block text-[15px]">{POWER_INFO[p].desc}</span>
              </span>
            </li>
          ))}
        </ul>
        {g.restCards.length > 0 && (
          <div className="mt-4">
            <p className="text-[17px]">Sabotaj: sonraki okuyucuya hangisi miras kalsın?</p>
            <div className="mt-2 flex justify-center gap-3">
              {g.restCards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    send({ t: 'usePower', power: 'sabotage', cardId: c.id });
                    onClose();
                  }}
                  aria-label={`Bu kartı miras bırak: ${c.text}`}
                >
                  <GameCard card={c} width={150} names={names} sober={you.sober} />
                </button>
              ))}
            </div>
          </div>
        )}
        {you.decree && (
          <form
            className="mt-4 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim().length < 3) return;
              send({ t: 'decree', text });
              onClose();
            }}
          >
            <label htmlFor="decree" className="text-[17px]">Ferman: masaya kendi kuralını koy (perde sonuna kadar)</label>
            <input
              id="decree"
              maxLength={80}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-[56px] rounded-[12px] bg-ink-950 px-3 text-[18px] shadow-[inset_0_0_0_2px_var(--ash-500)] outline-none"
              placeholder="Örn. Herkes miyavlayarak güler."
            />
            <InkButton type="submit" disabled={text.trim().length < 3}>
              Fermanı ilan et
            </InkButton>
          </form>
        )}
        <InkButton variant="ghost" className="mt-2 w-full" onClick={onClose}>
          Kapat
        </InkButton>
      </div>
    </div>
  );
}
