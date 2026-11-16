// Kısa bildirimler; ekran okuyucular için aria-live
import { useRoom } from '../store/room';

export function Toasts() {
  const toasts = useRoom((s) => s.toasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`ink-panel max-w-sm px-4 py-3 text-center text-[16px] ${t.tone === 'error' ? 'text-bone-100 ring-2 ring-[var(--accent)]' : 'text-bone-100'}`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
