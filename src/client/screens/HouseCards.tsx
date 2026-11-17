// Lobi: Ev Kartları. Masaya özel iç espriler; kimin yazdığı hiç açılmaz, metinler oyunda sürpriz olur.
import { useState } from 'react';
import type { View } from '../../engine/viewFor';
import { CardText } from '../components/GameCard/CardText';
import { InkButton } from '../components/InkButton';
import { Segmented } from '../components/Segmented';
import { useRoom } from '../store/room';

type Kind = 'question' | 'dare' | 'mostLikely' | 'neverHave';
const KINDS: { value: Kind; label: string; prefix: string; example: string }[] = [
  { value: 'question', label: 'Soru', prefix: 'Seçilen kişi,', example: 'geçen yaz Bodrum’da gerçekte ne oldu?' },
  { value: 'dare', label: 'Cesaret', prefix: 'Seçilen kişi,', example: 'Ahmet’in düğündeki dansını taklit et.' },
  { value: 'mostLikely', label: 'Kim Daha?', prefix: 'Kim', example: 'yine grubun tatil planını son dakika iptal eder?' },
  { value: 'neverHave', label: 'Hiç Yapmadım', prefix: 'Hiç', example: 'bu masadan birinin doğum gününü unutmadım.' },
];
const NAMES: Record<string, string> = { question: 'Soru', dare: 'Cesaret', mostLikely: 'Kim Daha?', neverHave: 'Hiç Yapmadım' };

export function HouseCards({ view }: { view: View }) {
  const send = useRoom((s) => s.send);
  const [kind, setKind] = useState<Kind>('question');
  const [text, setText] = useState('');
  const k = KINDS.find((x) => x.value === kind)!;
  const mine = view.houseCards.mine;
  const full = mine.length >= 3;
  return (
    <section className="ink-panel flex flex-col gap-3 p-4" aria-labelledby="house-h">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="house-h" className="font-gothic text-[28px]">Ev Kartları</h2>
        <span className="text-[14px] text-bone-dim">masada {view.houseCards.total} kart</span>
      </div>
      <p className="text-[15px] text-bone-dim">
        Bu masaya özel iç espriler yaz. Oyuna karışırlar, sık çıkarlar; kimin yazdığı asla açılmaz. Kişi başı 3 kart.
      </p>
      {mine.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Senin ev kartların">
          {mine.map((c) => (
            <li key={c.id} className="paper flex items-center gap-2 rounded-[10px] px-3 py-2">
              <span className="flex-1 text-[15px]">
                <b className="text-[13px] uppercase tracking-wider text-[#5a4636]">{NAMES[c.type]} · </b>
                <CardText text={c.text} />
              </span>
              <button type="button" onClick={() => send({ t: 'houseRemove', id: c.id })} className="min-h-[40px] rounded-full px-3 text-[14px] text-[#7A1E24] underline" aria-label="Kartı sil">
                Sil
              </button>
            </li>
          ))}
        </ul>
      )}
      {!full && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            send({ t: 'houseAdd', kind, text });
            setText('');
          }}
        >
          <Segmented
            label="Kart türü"
            value={kind}
            onChange={(v) => setKind(v as Kind)}
            options={KINDS.map((x) => ({ value: x.value, label: x.label }))}
          />
          <label htmlFor="house-text" className="text-[15px]">
            <span className="text-bone-dim">{k.prefix}</span> …
          </label>
          <textarea
            id="house-text"
            rows={2}
            maxLength={100}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={k.example}
            className="rounded-[12px] bg-ink-950 p-3 text-[17px] shadow-[inset_0_0_0_2px_var(--ash-500)] outline-none focus:shadow-[inset_0_0_0_2px_var(--accent)]"
          />
          <InkButton variant="secondary" type="submit" disabled={[...text.trim()].length < 8} seed={53}>
            Kartı masaya koy
          </InkButton>
        </form>
      )}
    </section>
  );
}
