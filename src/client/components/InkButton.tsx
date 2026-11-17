// Birincil (parşömen) ve ikincil (mürekkep) butonlar. Dokunma alanı en az 56 px.
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { InkFrame } from './ink/InkFrame';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
  seed?: number;
}

export function InkButton({ variant = 'primary', children, className = '', seed = 3, ...rest }: Props) {
  const base =
    'relative inline-flex min-h-[56px] items-center justify-center gap-2 px-6 text-[18px] font-extrabold transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45';
  const look =
    variant === 'primary'
      ? 'btn-parchment text-ink-text rounded-[14px]'
      : variant === 'secondary'
        ? 'btn-velvet text-bone-100 rounded-[14px]'
        : 'bg-transparent text-bone-100 underline underline-offset-4 decoration-ash-500 min-h-[48px]';
  return (
    <button className={`${base} ${look} ${className}`} {...rest}>
      {variant !== 'ghost' && (
        <InkFrame seed={seed} stroke={variant === 'primary' ? 'var(--ink-text)' : '#c9a96b'} width={variant === 'primary' ? 2 : 1.5} />
      )}
      {variant !== 'ghost' && <Corners gold={variant === 'secondary'} />}
      <span className="relative flex items-center gap-2">
        {variant === 'primary' && <Fleuron />}
        {children}
        {variant === 'primary' && <Fleuron flip />}
      </span>
    </button>
  );
}

// Köşelerde döküm demir/altın kıvrımlar
function Corners({ gold }: { gold: boolean }) {
  const c = gold ? '#c9a96b' : '#3a2a1e';
  const one = (cls: string) => (
    <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" className={`pointer-events-none absolute ${cls}`}>
      <path d="M1,13 L1,5 Q1,1 5,1 L13,1 M4,13 L4,7 Q4,4 7,4 L13,4" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
  return (
    <>
      {one('left-[3px] top-[3px]')}
      {one('right-[3px] top-[3px] -scale-x-100')}
      {one('bottom-[3px] left-[3px] -scale-y-100')}
      {one('bottom-[3px] right-[3px] -scale-100')}
    </>
  );
}

// Yazının iki yanında küçük mürekkep süsü
function Fleuron({ flip = false }: { flip?: boolean }) {
  return (
    <svg aria-hidden width="16" height="10" viewBox="0 0 16 10" className={flip ? '-scale-x-100' : ''}>
      <path d="M15,5 C11,5 9,1 6,2 C3,3 4,7 7,6 C9,5 8,3 6,4" fill="none" stroke="#3a2a1e" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
