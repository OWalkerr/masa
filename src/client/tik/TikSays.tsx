// TIK konuşma balonu: küçük TIK + tek satır kara mizah.
import { motion } from 'motion/react';
import { Tik } from '../components/Tik';
import { useReducedMotion } from '../fx/motionPref';

export function TikSays({ text, drinking = true, size = 56, className = '' }: { text: string; drinking?: boolean; size?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={text}
      className={`flex max-w-sm items-end gap-2 ${className}`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      aria-label={`TIK diyor ki: ${text}`}
      role="note"
    >
      <Tik size={size} variant={drinking ? 'raki' : 'tea'} mood="smirk" className="shrink-0" />
      <p className="relative mb-3 rounded-[14px] rounded-bl-[4px] bg-parchment-200 px-3 py-2 text-[16px] italic leading-snug text-ink-text shadow-[0_6px_14px_#0008]">
        {text}
      </p>
    </motion.div>
  );
}
