// Ses: Howler.js. İlk dokunuşta ses kilidi açılır ve sesler sentezlenir.
// Ortam müziği yalnızca Ana Ekran'da ya da host telefonunda çalar.
import { Howl, Howler } from 'howler';
import { useEffect, useState } from 'react';
import { loadPref, savePref } from '../net/identity';
import { MUSIC, renderBuffer, SFX, toWavUrl, type SfxName } from './synth';

// Tasarlanmış sesler (ElevenLabs, scripts/gen-sounds.ts) /sfx/ altında durur; olmayan ses tarayıcıda sentezlenir.
export type SoundName = SfxName | 'right' | 'wrong' | 'bell';
const howls = new Map<SoundName, Howl>();
let files: Record<string, string> = {};
let music: Howl | null = null;
let musicWanted = false;
let unlocked = false;
let building: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function isMuted(): boolean {
  return loadPref<boolean>('muted') ?? false;
}

export function setMuted(v: boolean) {
  savePref('muted', v);
  Howler.mute(v);
  listeners.forEach((l) => l());
}

export function useMuted(): [boolean, (v: boolean) => void] {
  const [m, setM] = useState(isMuted);
  useEffect(() => {
    const l = () => setM(isMuted());
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return [m, setMuted];
}

async function loadFiles() {
  try {
    const r = await fetch('/sfx/manifest.json');
    if (r.ok && r.headers.get('content-type')?.includes('json')) files = ((await r.json()) as { files?: Record<string, string> }).files ?? {};
  } catch {
    files = {};
  }
}

async function build() {
  await loadFiles();
  for (const [name, src] of Object.entries(files)) {
    if (name === 'music' || name === 'waltz') continue;
    howls.set(name as SoundName, new Howl({ src: [src], format: ['mp3'], volume: 0.75, preload: true }));
  }
  if (typeof OfflineAudioContext !== 'undefined') {
    for (const [name, def] of Object.entries(SFX) as [SfxName, (typeof SFX)[SfxName]][]) {
      if (howls.has(name)) continue;
      const buf = await renderBuffer(def.dur, def.draw);
      howls.set(name, new Howl({ src: [toWavUrl(buf)], format: ['wav'], volume: 0.7 }));
    }
  }
  if (musicWanted) await buildMusic();
}

async function buildMusic() {
  if (music) return;
  const track = files.music ?? files.waltz;
  if (track) {
    music = new Howl({ src: [track], format: ['mp3'], loop: true, volume: 0.45 });
    return;
  }
  if (typeof OfflineAudioContext === 'undefined') return;
  const buf = await renderBuffer(MUSIC.dur, MUSIC.draw, 22050);
  music = new Howl({ src: [toWavUrl(buf)], format: ['wav'], loop: true, volume: 0.35 });
}

// İlk kullanıcı dokunuşunda çağrılır (tarayıcılar sesi ancak bir hareketten sonra açar)
export function installUnlock() {
  const go = () => {
    if (unlocked) return;
    unlocked = true;
    Howler.mute(isMuted());
    building = build().then(() => {
      if (musicWanted) music?.play();
    });
    window.removeEventListener('pointerdown', go);
    window.removeEventListener('keydown', go);
  };
  window.addEventListener('pointerdown', go);
  window.addEventListener('keydown', go);
}

// Tasarlanmış dosyası olmayan yeni sesler en yakın sentez sesine düşer
const FALLBACK: Partial<Record<SoundName, SfxName>> = { right: 'clink', wrong: 'tap', bell: 'clink' };

export function play(name: SoundName) {
  if (!unlocked || isMuted()) return;
  (howls.get(name) ?? howls.get(FALLBACK[name] as SoundName))?.play();
}

// Müzik: TV ve host telefonu
export function useMusic(on: boolean) {
  useEffect(() => {
    musicWanted = on;
    if (!on) {
      music?.pause();
      return;
    }
    if (!unlocked) return;
    void (building ?? Promise.resolve()).then(async () => {
      await buildMusic();
      if (musicWanted && !music?.playing()) music?.play();
    });
    return () => {
      musicWanted = false;
      music?.pause();
    };
  }, [on]);
}
