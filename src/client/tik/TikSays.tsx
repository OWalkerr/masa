// TIK konuşma balonu: küçük TIK + tek satır kara mizah.
import { useEffect } from 'react';
import { speak } from '../audio/voice';
import { motion } from 'motion/react';
import { Tik, type TikPose } from '../components/Tik';
import { useReducedMotion } from '../fx/motionPref';

export function TikSays({ text, drinking = true, size = 56, className = '', pose }: { text: string; drinking?: boolean; size?: number; className?: string; pose?: TikPose }) {
  const reduce = useReducedMotion();
  useEffect(() => speak(text), [text]);
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
      <Tik size={size} variant={drinking ? 'raki' : 'tea'} mood="smirk" pose={pose} className="shrink-0" />
      <p className="relative mb-3 rounded-[14px] rounded-bl-[4px] bg-parchment-200 px-3 py-2 text-[16px] italic leading-snug text-ink-text shadow-[0_6px_14px_#0008]">
        {text}
      </p>
    </motion.div>
  );
}
