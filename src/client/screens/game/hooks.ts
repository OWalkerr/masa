import { useEffect, useState } from 'react';
import type { View } from '../../../engine/viewFor';
import { useRoom } from '../../store/room';

// Sunucu saatine göre kalan süre (ms). İstemci saati kural belirlemez; yalnızca gösterim.
export function useRemaining(endsAt: number | null | undefined): number {
  const serverNow = useRoom((s) => s.serverNow);
  const [now, setNow] = useState(() => serverNow());
  useEffect(() => {
    if (!endsAt) return;
    const id = window.setInterval(() => setNow(serverNow()), 250);
    return () => window.clearInterval(id);
  }, [endsAt, serverNow]);
  return endsAt ? Math.max(0, endsAt - now) : 0;
}

export function useCardWidth(frac = 0.82, max = 340, maxHFrac = 0.62): number {
  const calc = () => Math.round(Math.min(window.innerWidth * frac, max, (window.innerHeight * maxHFrac) / 1.4));
  const [w, setW] = useState(calc);
  useEffect(() => {
    const on = () => setW(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  });
  return w;
}

export function useNames(view: View): Record<string, string> {
  return Object.fromEntries(view.players.map((p) => [p.id, p.name]));
}

// Ekranı açık tut (Screen Wake Lock); sekmeye dönünce yeniden iste
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const req = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        /* izin yok ya da pil tasarrufu */
      }
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') void req();
    };
    void req();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}

// Haptik: yalnızca Android'de çalışır; iOS'ta görsel sarsıntıya düşülür
export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* desteklenmiyor */
  }
}
