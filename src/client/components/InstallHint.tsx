// "Ana ekrana ekle": Android/Chrome'da yükleme istemi, iPhone Safari'de kısa tarif.
// Zaten yüklüyse (standalone) ya da kullanıcı kapattıysa görünmez.
import { useEffect, useState } from 'react';

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const KEY = 'masa:installHint';

function dismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === 'off';
  } catch {
    return false;
  }
}

export function InstallHint() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [hidden, setHidden] = useState(dismissed);
  const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone);
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);

  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    window.addEventListener('beforeinstallprompt', on);
    return () => window.removeEventListener('beforeinstallprompt', on);
  }, []);

  if (standalone || hidden || (!evt && !ios)) return null;
  const close = () => {
    setHidden(true);
    try {
      localStorage.setItem(KEY, 'off');
    } catch {
      /* gizli sekme */
    }
  };
  return (
    <div className="mt-4 flex w-full max-w-xs items-center gap-2 rounded-[14px] bg-ink-800/90 p-3 text-[15px] shadow-[inset_0_0_0_1px_var(--ash-500)]">
      {evt ? (
        <button
          type="button"
          className="min-h-[48px] flex-1 text-left"
          onClick={async () => {
            await evt.prompt();
            await evt.userChoice.catch(() => null);
            setEvt(null);
          }}
        >
          <b>Ana ekrana ekle</b>
          <span className="block text-bone-dim">Uygulama gibi tam ekran açılır.</span>
        </button>
      ) : (
        <p className="flex-1">
          <b>Ana ekrana ekle:</b> Safari’de <span aria-label="Paylaş">Paylaş ⬆︎</span> → “Ana Ekrana Ekle”.
        </p>
      )}
      <button type="button" onClick={close} className="h-[48px] w-[48px] shrink-0 rounded-full text-bone-dim" aria-label="Bu ipucunu kapat">
        ✕
      </button>
    </div>
  );
}
