// TIK'in sesi: ElevenLabs ile seslendirilmiş replikler (public/voice). Yalnızca bir cihaz konuşur:
// Ana Ekran varsa TV, yoksa masayı kuranın telefonu. Konuşurken müzik kısılır.
import { Howl } from 'howler';
import { useEffect } from 'react';
import { loadPref, savePref } from '../net/identity';
import { voiceKey } from '../tik/lines';
import { duckMusic, isMuted } from './sound';

let files: Record<string, string> | null = null;
let loading: Promise<void> | null = null;
let role: 'tv' | 'host' | null = null;
let last = { text: '', at: 0 };
let current: Howl | null = null;

export function voiceOn(): boolean {
  return loadPref<boolean>('tikVoice') ?? true;
}
export function setVoiceOn(v: boolean) {
  savePref('tikVoice', v);
  if (!v) current?.stop();
}

function load(): Promise<void> {
  loading ??= fetch('/voice/manifest.json')
    .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : { files: {} }))
    .then((j: { files?: Record<string, string> }) => {
      files = j.files ?? {};
    })
    .catch(() => {
      files = {};
    });
  return loading;
}

export function speak(text: string) {
  if (!role || isMuted() || !voiceOn()) return;
  const now = Date.now();
  if (last.text === text && now - last.at < 8000) return; // aynı replik yeniden çizilince tekrar konuşmasın
  last = { text, at: now };
  void load().then(() => {
    const src = files?.[voiceKey(text)];
    if (!src) return;
    current?.stop();
    const h = new Howl({ src: [src], format: ['mp3'], volume: 0.95 });
    current = h;
    h.once('play', () => duckMusic(Math.max(1500, (h.duration() || 3) * 1000 + 400), 0.1));
    h.play();
  });
}

// Bu cihaz konuşsun mu: TV her zaman; host telefonu yalnızca masada TV yoksa
export function useVoiceRole(r: 'tv' | 'host' | null) {
  useEffect(() => {
    role = r;
    return () => {
      if (role === r) role = null;
    };
  }, [r]);
}
