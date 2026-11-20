// Düello Ligi tablosu: galibiyet 3, beraberlik 1 puan. Eşitlikte averaj (G-M), sonra cesaret.
import { motion } from 'motion/react';
import type { View } from '../../../engine/viewFor';
import { Avatar } from '../../components/Avatar';
import { useReducedMotion } from '../../fx/motionPref';
import { keyItem, useManifest } from '../../art/manifest';

export interface LeagueRow {
  id: string;
  name: string;
  avatar: number;
  w: number;
  d: number;
  l: number;
  played: number;
  pts: number;
}

export function leagueRows(view: View): LeagueRow[] {
  return view.players
    .filter((p) => !p.left && view.stats[p.id])
    .map((p) => {
      const s = view.stats[p.id]!;
      const w = s.duelW, d = s.duelD, l = s.duelL;
      return { id: p.id, name: p.name, avatar: p.avatar, w, d, l, played: w + d + l, pts: w * 3 + d };
    })
    .sort((a, b) => b.pts - a.pts || b.w - b.l - (a.w - a.l) || (view.stats[b.id]!.courage - view.stats[a.id]!.courage));
}

// Lider: puanı > 0 ve tek başına önde. Puan ve averaj eşitse cesaret ayırır; o da eşitse taç yok.
export function leagueLeader(rows: LeagueRow[], view?: View): LeagueRow | null {
  const [a, b] = rows;
  if (!a || a.pts === 0) return null;
  if (b && b.pts === a.pts && b.w - b.l === a.w - a.l) {
    const ca = view?.stats[a.id]?.courage ?? 0, cb = view?.stats[b.id]?.courage ?? 0;
    if (ca === cb) return null;
  }
  return a;
}

export function Crown({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 32 24" aria-hidden className="shrink-0">
      <path d="M2,20 L4,6 L11,13 L16,2 L21,13 L28,6 L30,20 Z" fill="#E8C26A" stroke="#1d1612" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="2" y="19" width="28" height="4" rx="1" fill="#C9A24A" stroke="#1d1612" strokeWidth="1.5" />
    </svg>
  );
}

export function LeagueTable({ view, tv = false, highlight = [] }: { view: View; tv?: boolean; highlight?: string[] }) {
  const reduce = useReducedMotion();
  const rows = leagueRows(view);
  const leader = leagueLeader(rows, view);
  const fs = tv ? 'text-[24px]' : 'text-[15px]';
  return (
    <table className={`ink-panel w-full text-left ${fs}`}>
      <caption className={`px-2 pt-2 text-left font-gothic ${tv ? 'text-[34px]' : 'text-[22px]'}`}>Lig Tablosu</caption>
      <thead>
        <tr className={`text-bone-dim ${tv ? 'text-[18px]' : 'text-[13px]'}`}>
          <th className="p-2 font-bold">#</th>
          <th className="p-2 font-bold">Düellocu</th>
          <th className="p-2 text-right font-bold" title="Oynadı">O</th>
          <th className="p-2 text-right font-bold" title="Galibiyet">G</th>
          <th className="p-2 text-right font-bold" title="Beraberlik">B</th>
          <th className="p-2 text-right font-bold" title="Mağlubiyet">M</th>
          <th className="p-2 text-right font-bold">Puan</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <motion.tr
            key={r.id}
            layout={!reduce}
            className={`border-t border-ash-500 ${highlight.includes(r.id) ? 'bg-bone-100/10' : ''}`}
          >
            <td className="p-2 tabular-nums text-bone-dim">{i + 1}</td>
            <td className="p-2">
              <span className="flex items-center gap-2">
                <Avatar index={r.avatar} size={tv ? 40 : 26} />
                <span className="truncate">{r.name}</span>
                {leader?.id === r.id && <Crown size={tv ? 30 : 20} />}
              </span>
            </td>
            <td className="p-2 text-right tabular-nums">{r.played}</td>
            <td className="p-2 text-right tabular-nums">{r.w}</td>
            <td className="p-2 text-right tabular-nums">{r.d}</td>
            <td className="p-2 text-right tabular-nums">{r.l}</td>
            <td className="p-2 text-right font-extrabold tabular-nums">{r.pts}</td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}

// Özet: gecenin şampiyonu (lider yoksa beraberlik notu)
export function Champion({ view }: { view: View }) {
  const reduce = useReducedMotion();
  const rows = leagueRows(view);
  const leader = leagueLeader(rows, view);
  const art = keyItem(useManifest(), 'champion');
  if (!rows.some((r) => r.played > 0)) return null;
  return (
    <motion.section
      aria-label="Gecenin şampiyonu"
      className="flex w-full flex-col items-center gap-2 rounded-[18px] bg-[#2a1f30] p-4 text-center shadow-[inset_0_0_0_2px_#8E6CD8]"
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.2 }}
    >
      {leader ? (
        <>
          {art ? (
            <div className="relative">
              <img src={art.w400} alt="" width={180} height={180} className="h-[180px] w-[180px] rounded-full object-cover shadow-[0_0_0_3px_#E8C26A,0_0_40px_#E8B04A55]" />
              <span className="absolute -bottom-2 -right-2 rounded-full shadow-[0_0_0_3px_#2a1f30]"><Avatar index={leader.avatar} size={64} /></span>
            </div>
          ) : (
            <>
              <Crown size={56} />
              <Avatar index={leader.avatar} size={84} />
            </>
          )}
          <p className="font-gothic text-[34px] leading-none text-[#E8C26A]">Gecenin Şampiyonu</p>
          <p className="text-[22px] font-extrabold">{leader.name}</p>
          <p className="text-[15px] text-bone-dim">
            {leader.pts} puan · {leader.w} galibiyet, {leader.d} beraberlik, {leader.l} mağlubiyet
          </p>
        </>
      ) : (
        <>
          <p className="font-gothic text-[30px] leading-none">Lig berabere bitti</p>
          <p className="text-[15px] text-bone-dim">Taç kimseye kalmadı. Rövanş şart.</p>
        </>
      )}
    </motion.section>
  );
}
