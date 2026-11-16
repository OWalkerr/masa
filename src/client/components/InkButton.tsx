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
      ? 'bg-parchment-200 text-ink-text rounded-[14px] shadow-[0_6px_0_#00000066]'
      : variant === 'secondary'
        ? 'bg-ink-800 text-bone-100 rounded-[14px]'
        : 'bg-transparent text-bone-100 underline underline-offset-4 decoration-ash-500 min-h-[48px]';
  return (
    <button className={`${base} ${look} ${className}`} {...rest}>
      {variant !== 'ghost' && (
        <InkFrame seed={seed} stroke={variant === 'primary' ? 'var(--ink-text)' : 'var(--bone-100)'} width={variant === 'primary' ? 2 : 1.5} />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}
