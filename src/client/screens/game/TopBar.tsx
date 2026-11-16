// Üst çubuk: eriyen mum olarak perde ilerlemesi, sıra şeridi (avatarlar), menü.
import { useState } from 'react';
import type { View } from '../../../engine/viewFor';
import { Avatar } from '../../components/Avatar';
import { Toggle } from '../../components/Segmented';
import { getReduceMotion, setReduceMotion } from '../../fx/motionPref';
import { navigate } from '../../router';
import { useMuted } from '../../audio/sound';
import { useRoom } from '../../store/room';
import { EffectSigns } from './Effects';
import { Pocket } from './Pocket';

export const ACT_NAMES = ['', 'Isınma', 'Kızışma', 'Kaos'];

export function TopBar({ view }: { view: View }) {
  const g = view.game!;
  const [menu, setMenu] = useState(false);
  const order = view.order.map((id) => view.players.find((p) => p.id === id)).filter((p) => p && !p.left);
  const progress = g.actTurns ? g.actTurn / g.actTurns : 0;
  const paying = new Set(g.result?.payments.map((p) => p.id) ?? []);
  const cursed = new Set(g.effects.filter((e) => e.kind === 'curse').map((e) => e.targetId));
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-ink-950 via-ink-950/90 to-transparent px-3 pb-3 pt-2">
      <div className="flex items-center gap-3">
        {/* perde mumu */}
        <div className="flex items-end gap-2" aria-label={`Perde ${g.act}: ${ACT_NAMES[g.act]}, tur ${g.actTurn + 1}/${g.actTurns}`}>
          <svg width="18" height="40" viewBox="0 0 18 40" aria-hidden>
            <path className="flame" d={`M9,${4 + progress * 22} C13,${9 + progress * 22} 13,${13 + progress * 22} 9,${16 + progress * 22} C5,${13 + progress * 22} 5,${9 + progress * 22} 9,${4 + progress * 22} Z`} fill="var(--accent)" />
            <rect x="4" y={16 + progress * 22} width="10" height={24 - progress * 22} rx="1.5" fill="var(--bone-100)" />
          </svg>
          <div className="leading-tight">
            <div className="font-gothic text-[20px]">Perde {g.act}</div>
            <div className="text-[14px] text-bone-dim">
              {ACT_NAMES[g.act]} · {Math.min(g.actTurn + 1, g.actTurns)}/{g.actTurns}
            </div>
          </div>
        </div>
        {/* sıra şeridi */}
        <ol className="flex flex-1 gap-1 overflow-x-auto py-1" aria-label="Sıra">
          {order.map((p) => {
            const reader = p!.id === g.readerId;
            return (
              <li key={p!.id} className="relative flex shrink-0 flex-col items-center" aria-current={reader ? 'true' : undefined}>
                <div className={`rounded-full ${reader ? 'shadow-[0_0_0_3px_var(--accent)]' : cursed.has(p!.id) ? 'shadow-[0_0_10px_4px_#8E6CD8]' : ''}`}>
                  <Avatar index={p!.avatar} size={reader ? 40 : 34} dim={!p!.connected} label={`${p!.name}${reader ? ', okuyucu' : ''}`} />
                </div>
                {paying.has(p!.id) && (
                  <span className="absolute -bottom-1 right-0 h-[14px] w-[14px] rounded-full bg-[#7A1E24] shadow-[0_0_0_2px_var(--ink-950)]" aria-hidden />
                )}
                {cursed.has(p!.id) && (
                  <svg className="absolute -top-1 left-0" width="40" height="14" viewBox="0 0 40 14" aria-label="lanetli">
                    <path d="M2,7 Q20,-2 38,7" stroke="var(--bone-100)" strokeWidth="2" fill="none" />
                    <ellipse cx="14" cy="7" rx="6" ry="4" fill="var(--ink-950)" stroke="var(--bone-100)" strokeWidth="1.5" />
                    <path d="M10,4 l8,6 M18,4 l-8,6" stroke="var(--bone-100)" strokeWidth="1" />
                  </svg>
                )}
                <span className="sr-only">{p!.name}</span>
              </li>
            );
          })}
        </ol>
        <Pocket view={view} />
        <MuteButton />
        <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Menü" className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-ink-800 shadow-[inset_0_0_0_1px_var(--ash-500)]">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
            <path d="M4,6 h14 M4,11 h14 M4,16 h14" stroke="var(--bone-100)" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <EffectSigns view={view} />
      {menu && <Menu view={view} onClose={() => setMenu(false)} />}
    </header>
  );
}

function Menu({ view, onClose }: { view: View; onClose: () => void }) {
  const send = useRoom((s) => s.send);
  const [rm, setRm] = useState(getReduceMotion);
  const [muted, setMuted] = useMuted();
  const you = view.you!;
  return (
    <div className="ink-panel mt-2 flex flex-col gap-1 p-4">
      <Toggle label="Sessiz" checked={muted} onChange={setMuted} />
      <Toggle label="Hareketi azalt" checked={rm} onChange={(v) => { setReduceMotion(v); setRm(v); }} />
      {view.settings.drinking && !you.sober && (
        <button type="button" className="min-h-[56px] rounded-[12px] bg-ink-950 px-4 text-left shadow-[inset_0_0_0_1px_var(--ash-500)]" onClick={() => { send({ t: 'quitDrinking' }); onClose(); }}>
          Ben bıraktım <span className="text-bone-dim">· bundan sonra içmek yok, ceza var</span>
        </button>
      )}
      {you.sober && view.settings.drinking && <p className="text-[15px] text-bone-dim">İçmiyorsun; sana ceza geliyor.</p>}
      <button type="button" className="min-h-[56px] rounded-[12px] px-4 text-left text-bone-dim underline" onClick={() => { send({ t: 'leave' }); navigate('/'); }}>
        Masadan kalk
      </button>
    </div>
  );
}

export function MuteButton() {
  const [muted, setMuted] = useMuted();
  return (
    <button type="button" onClick={() => setMuted(!muted)} aria-pressed={muted} aria-label={muted ? 'Sesi aç' : 'Sessiz'} className="flex h-[48px] w-[44px] items-center justify-center rounded-full bg-ink-800 shadow-[inset_0_0_0_1px_var(--ash-500)]">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
        <path d="M3,8 h4 l5,-4 v14 l-5,-4 h-4 Z" fill="var(--bone-100)" />
        {muted ? <path d="M15,8 l5,6 M20,8 l-5,6" stroke="var(--bone-100)" strokeWidth="2" /> : <path d="M15,7 q3,4 0,8 M17,4 q6,7 0,14" stroke="var(--bone-100)" strokeWidth="1.8" fill="none" />}
      </svg>
    </button>
  );
}
