// Kart metnindeki jetonları oyuncu adlarıyla değiştirir. React kaçışı sayesinde isimler güvenle gösterilir.
import { Fragment } from 'react';
import type { TokenKey } from '../../../engine/types';

const FALLBACK: Record<TokenKey, string> = {
  okuyucu: 'Okuyucu', secilen: 'Seçilen', ikinci: 'İkinci', sag: 'Sağındaki', sol: 'Solundaki', rastgele: 'Rastgele biri',
};

// Alkolsüz oyuncu için kart dilini çevirir: "iç" → "ceza al", "içer" → "ceza alır"
export function soberize(text: string): string {
  return text
    .replace(/(^|\s)içsin(?=[\s.!,;)]|$)/g, '$1ceza alsın')
    .replace(/(^|\s)içer(?=[\s.!,;)]|$)/g, '$1ceza alır')
    .replace(/(^|\s)iç(?=[.!,;)]|$)/g, '$1ceza al');
}

export function CardText({ text, tokens, names, sober }: { text: string; tokens?: Partial<Record<TokenKey, string>>; names?: Record<string, string>; sober?: boolean }) {
  const parts = (sober ? soberize(text) : text).split(/(\{[a-z]+\})/g);
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
