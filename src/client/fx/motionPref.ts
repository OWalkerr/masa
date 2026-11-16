// "Hareketi azalt": sistem tercihi ya da oyun içi ayar
import { useEffect, useState } from 'react';
import { loadPref, savePref } from '../net/identity';

const listeners = new Set<() => void>();

export function getReduceMotion(): boolean {
  const pref = loadPref<boolean>('reduceMotion');
  if (pref !== null) return pref;
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function setReduceMotion(v: boolean) {
  savePref('reduceMotion', v);
  document.documentElement.dataset.reduceMotion = String(v);
  listeners.forEach((l) => l());
}

export function useReducedMotion(): boolean {
  const [v, setV] = useState(getReduceMotion);
  useEffect(() => {
    const l = () => setV(getReduceMotion());
    listeners.add(l);
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', l);
    return () => {
      listeners.delete(l);
      mq.removeEventListener('change', l);
    };
  }, []);
  return v;
}
