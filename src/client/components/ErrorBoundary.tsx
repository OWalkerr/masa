// Beklenmeyen bir çizim hatası beyaz ekran bırakmasın: kısa açıklama + yeniden yükle.
// Oyun durumu sunucuda; yenilenen telefon koltuğuna geri döner.
import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('MASA çizim hatası:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
        <p className="font-gothic text-[40px]">Bir şey devrildi</p>
        <p className="max-w-xs text-[18px] text-bone-dim">
          Masada bir kadeh devrildi, ekran karardı. Oyun kaldığı yerden devam ediyor; yenileyince koltuğuna dönersin.
        </p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="min-h-[56px] rounded-[14px] bg-[var(--accent)] px-6 text-[19px] font-extrabold text-ink-950"
        >
          Yeniden yükle
        </button>
      </main>
    );
  }
}
