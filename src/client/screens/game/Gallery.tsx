// Sergi: herkes aynı konuyu çizer → isimsiz galeri → en kötü eser oylanır → sanatçılar açıklanır.
import { motion } from 'motion/react';
import type { TurnResult } from '../../../engine/types';
import type { View } from '../../../engine/viewFor';
import { Avatar } from '../../components/Avatar';
import { InkButton } from '../../components/InkButton';
import { useReducedMotion } from '../../fx/motionPref';
import { useRoom } from '../../store/room';
import { DrawPad, SketchFinal, TimeBar } from './Sketch';

const NO = (i: number) => `${i + 1}. Eser`;

function Prompt({ text, big = false }: { text: string; big?: boolean }) {
  return (
    <div className={`paper relative w-full max-w-[560px] rounded-[12px] px-4 py-2 text-center ${big ? 'py-4' : ''}`}>
      <span className={`block text-[#5a4636] ${big ? 'text-[22px]' : 'text-[14px]'}`}>Serginin konusu</span>
      <span className={`block font-extrabold leading-tight ${big ? 'text-[44px]' : 'text-[24px]'}`}>“{text}”</span>
    </div>
  );
}

export function GalleryPanel({ view }: { view: View }) {
  const gl = view.game!.gallery!;
  const send = useRoom((s) => s.send);
  const reduce = useReducedMotion();
  if (gl.stage === 'draw') {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <Prompt text={gl.prompt} />
        <TimeBar sk={gl} />
        {gl.iDone ? (
          <p className="ink-panel w-full max-w-[560px] p-4 text-center text-[18px]">
            Eserin teslim edildi. Diğer sanatçılar bekleniyor ({gl.doneCount}/{gl.artists}).
          </p>
        ) : (
          <>
            <DrawPad sk={{ strokes: gl.myStrokes, blind: false, singleLine: false }} />
            <InkButton className="w-full max-w-[560px]" seed={91} onClick={() => send({ t: 'galDone' })}>
              Eserimi teslim et
            </InkButton>
          </>
        )}
      </div>
    );
  }
  const voted = gl.myVote !== null;
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Prompt text={gl.prompt} />
      <p className="text-center text-[17px]">{voted ? `Oyun gizli. ${gl.votedCount} oy toplandı.` : 'En kötü eser hangisi? Sanatçısı içecek.'}</p>
      <ul className="grid w-full max-w-[560px] grid-cols-2 gap-3" aria-label="Galeri">
        {gl.items.map((strokes, i) => {
          const mine = gl.myIndex === i;
          const chosen = gl.myVote === i;
          return (
            <motion.li
              key={i}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, rotate: (i % 2 ? 2 : -2) }}
              animate={{ opacity: 1, y: 0, rotate: (i % 3) - 1 }}
              transition={{ delay: reduce ? 0 : i * 0.12 }}
            >
              <button
                type="button"
                disabled={mine || voted}
                aria-pressed={chosen}
                onClick={() => send({ t: 'galVote', index: i })}
                className={`ink-tile flex w-full flex-col items-center gap-1 p-2 disabled:cursor-default ${mine ? 'opacity-70' : ''}`}
                aria-label={`${NO(i)}${mine ? ', senin eserin' : ''}`}
              >
                <SketchFinal strokes={strokes} word="" size={140} caption={<span className="text-[18px] font-extrabold text-bone-100">{NO(i)}</span>} />
                <span className="text-[13px] text-bone-dim">{mine ? 'Senin eserin' : chosen ? 'Oyun bu' : 'Bu kötü'}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

// Sonuç: sanatçılar açılır, en kötü eser "Rezalet Ödülü" alır
export function GalleryResult({ view, r }: { view: View; r: NonNullable<TurnResult['gallery']> }) {
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';
  const avatar = (id: string) => view.players.find((p) => p.id === id)?.avatar ?? 0;
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p className="text-center text-[16px] text-bone-dim">Sergi: “{r.prompt}”</p>
      <ul className="grid w-full max-w-[560px] grid-cols-2 gap-3">
        {r.items.map((it, i) => {
          const worst = r.worst.includes(it.author);
          return (
            <li key={it.author} className={`relative flex flex-col items-center rounded-[14px] p-2 ${worst ? 'bg-[#3a1418] shadow-[0_0_0_2px_#D7263D,0_0_24px_#D7263D66]' : 'ink-panel'}`}>
              {worst && (
                <span className="ribbon ribbon-mine absolute -top-3 z-[1] py-0.5 text-[13px] font-extrabold">Rezalet Ödülü</span>
              )}
              <SketchFinal
                strokes={it.strokes}
                word=""
                size={130}
                caption={
                  <span className="flex items-center justify-center gap-1 text-[15px] text-bone-100">
                    <Avatar index={avatar(it.author)} size={22} />
                    {name(it.author)} · {it.votes} oy
                  </span>
                }
              />
              <span className="sr-only">{NO(i)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Ana Ekran: büyük galeri (oylama sırasında isimsiz)
export function GalleryTv({ view }: { view: View }) {
  const gl = view.game!.gallery!;
  if (gl.stage === 'draw') {
    return (
      <div className="flex flex-col gap-4">
        <Prompt text={gl.prompt} big />
        <TimeBar sk={gl} />
        <p className="text-[30px]">{gl.doneCount}/{gl.artists} sanatçı eserini teslim etti</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="font-gothic text-[44px]">Galeri açıldı</p>
      <p className="text-[26px] text-bone-dim">En kötü eser hangisi? {gl.votedCount} oy</p>
    </div>
  );
}

export function GalleryWall({ view }: { view: View }) {
  const gl = view.game!.gallery!;
  if (gl.stage === 'draw') return null;
  return (
    <ul className="flex max-w-[46vw] flex-wrap justify-center gap-x-8 gap-y-4">
      {gl.items.map((strokes, i) => (
        <li key={i}>
          <SketchFinal
            strokes={strokes}
            word=""
            size={Math.round(Math.min(window.innerHeight * (gl.items.length > 6 ? 0.2 : 0.26), window.innerWidth * (gl.items.length > 4 ? 0.1 : 0.13)))}
            caption={<span className="text-[28px] font-extrabold text-bone-100">{NO(i)}</span>}
          />
        </li>
      ))}
    </ul>
  );
}
