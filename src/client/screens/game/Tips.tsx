// İlk kez ipuçları: bir mekanik ilk kez karşına çıktığında kısa bir not. Her cihazda her ipucu bir kez; hepsi kapatılabilir.
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { View } from '../../../engine/viewFor';
import { Tik } from '../../components/Tik';
import { loadPref, savePref } from '../../net/identity';

interface Tip {
  key: string;
  when: (v: View) => boolean;
  title: string;
  text: (v: View) => string;
}

const drink = (v: View) => (v.settings.drinking && !v.you?.sober ? 'içer' : 'ceza alır');

const TIPS: Tip[] = [
  {
    key: 'host',
    when: (v) => !!v.you?.isHost && v.phase === 'resolve',
    title: 'Masayı sen kurdun',
    text: () => 'Acele yok: herkes gülüp konuşsun, hazır olunca altta “Sonraki kart”a bas. Biri uyuklarsa 20 sn sonra beklemeden geçebilirsin.',
  },
  {
    key: 'reader',
    when: (v) => v.phase === 'choose' && v.game?.readerId === v.you?.id && v.game?.step === 'choose',
    title: 'Okuyucu sensin',
    text: () => 'Üç kartından birini seç ve yüksek sesle oku. Elindeki en ateşli kartı seçersen +1 cesaret; her 3 cesarette cebine bir güç kartı girer.',
  },
  {
    key: 'target',
    when: (v) => v.phase === 'action' && !!v.you && !!v.game?.targets.includes(v.you.id) && v.you.canPass && !v.game.mg,
    title: 'Kart sana geldi',
    text: () => 'Yapmak istemezsen perde başına bir “Pas” hakkın var. Oyunda bir kez de anonim “Veto” ile kartı herkes için iptal edebilirsin; kimin yaptığını kimse bilmez.',
  },
  {
    key: 'rule',
    when: (v) => !!v.game?.effects.some((e) => e.kind === 'rule' || e.kind === 'decree' || e.kind === 'event'),
    title: 'Masada kural var',
    text: (v) => `Üstteki tabelaya dokunup kuralı oku. Bozanı görünce sağ alttaki “Yakala!”ya bas; masa oylar. Bozduysa o ${drink(v)}, yanlış suçladıysan sen.`,
  },
  {
    key: 'curse',
    when: (v) => !!v.game?.effects.some((e) => e.kind === 'curse'),
    title: 'Biri lanetlendi',
    text: () => 'Lanetli kişi avatarında mor dumanla görünür. Laneti bozduğunu görürsen “Yakala!”',
  },
  {
    key: 'missionMine',
    when: (v) => !!v.game?.effects.some((e) => e.kind === 'mission' && e.mine),
    title: 'Ajan sensin',
    text: (v) => `Üstteki mor tabelaya dokun, görevini gör. Kimseye belli etmeden yap ve “Görevi yaptım!” de; masa onaylarsa herkes ${drink(v).replace('alır', 'alır')}.`,
  },
  {
    key: 'mission',
    when: (v) => !!v.game?.effects.some((e) => e.kind === 'mission' && !e.mine),
    title: 'Aranızda bir ajan var',
    text: () => 'Birinin telefonunda gizli bir görev var. Tuhaf davranan birini görürsen “Yakala!” ile ajanı söyle; oylama yok, gerçek hemen açılır.',
  },
  {
    key: 'power',
    when: (v) => !!v.you?.powers.length,
    title: 'Cebine güç kartı girdi',
    text: () => 'Üstteki keseye dokun: Kalkan cezayı iptal eder, Ayna başkasına yansıtır, Takas elini yeniler, Sabotaj sonraki okuyucunun mirasını seçer.',
  },
  {
    key: 'pot',
    when: (v) => (v.game?.pot ?? 0) > 0,
    title: 'Kazan doluyor',
    text: () => 'Kimsenin içmediği her turda kazana bir yudum düşer (en fazla 4). Sonraki cezalı kişi kazanı da içer. Üst çubukta yeşil kazan.',
  },
];

function seenSet(): Set<string> {
  return new Set(loadPref<string[]>('tipsSeen') ?? []);
}

export function Tips({ view }: { view: View }) {
  const [seen, setSeen] = useState(seenSet);
  const [off, setOff] = useState(() => loadPref<boolean>('tipsOff') ?? false);
  const tip = off || !view.you ? undefined : TIPS.find((t) => !seen.has(t.key) && t.when(view));
  // 15 sn sonra kendiliğinden kapanır (görüldü sayılır)
  useEffect(() => {
    if (!tip) return;
    const t = window.setTimeout(() => dismiss(tip.key), 15_000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tip?.key]);
  if (!tip) return null;
  const dismiss = (key: string) => {
    const next = new Set(seen);
    next.add(key);
    savePref('tipsSeen', [...next]);
    setSeen(next);
  };
  return (
    <AnimatePresence>
      {tip && (
        <motion.aside
          key={tip.key}
          className="paper fixed inset-x-3 top-[118px] z-40 mx-auto flex max-w-sm land:left-1/2 land:top-[70px] items-start gap-3 rounded-[14px] p-3 shadow-[0_14px_40px_#000c]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          role="note"
          aria-label={`İpucu: ${tip.title}`}
        >
          <Tik size={44} variant={view.settings.drinking ? 'raki' : 'tea'} mood="smirk" className="shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-extrabold uppercase tracking-wider text-[#7a5a2a]">İpucu · {tip.title}</p>
            <p className="text-[15px] leading-snug">{tip.text(view)}</p>
            <div className="mt-2 flex items-center gap-3">
              <button type="button" onClick={() => dismiss(tip.key)} className="min-h-[40px] rounded-full bg-ink-950 px-4 text-[15px] font-bold text-bone-100">
                Anladım
              </button>
              <button
                type="button"
                onClick={() => {
                  savePref('tipsOff', true);
                  setOff(true);
                }}
                className="min-h-[40px] text-[14px] text-[#5a4636] underline"
              >
                İpucu gösterme
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
