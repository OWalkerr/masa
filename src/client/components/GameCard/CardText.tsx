// Kart metnindeki jetonları oyuncu adlarıyla değiştirir. React kaçışı sayesinde isimler güvenle gösterilir.
import { Fragment } from 'react';
import type { TokenKey } from '../../../engine/types';

const FALLBACK: Record<TokenKey, string> = {
  okuyucu: 'Okuyucu', secilen: 'Seçilen', ikinci: 'İkinci', sag: 'Sağındaki', sol: 'Solundaki', rastgele: 'Rastgele biri',
};

export function CardText({ text, tokens, names }: { text: string; tokens?: Partial<Record<TokenKey, string>>; names?: Record<string, string> }) {
  const parts = text.split(/(\{[a-z]+\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\{([a-z]+)\}$/);
        if (!m) return <Fragment key={i}>{part}</Fragment>;
        const key = m[1] as TokenKey;
        const id = tokens?.[key];
        const name = (id && names?.[id]) || FALLBACK[key] || part;
        return (
          <span key={i} className="whitespace-nowrap underline decoration-[var(--accent)] decoration-[0.12em] underline-offset-[0.14em]">
            {name}
          </span>
        );
      })}
    </>
  );
}
