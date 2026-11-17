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
    if (name === 'music' || name.startsWith('waltz')) continue; // müzikler ayrı ve yalnızca gerektiğinde yüklenir
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

// Perde müzikleri: 1 = vals (müzik kutusu), 2 = gerilim (tik tak), 3 = kaos karnavalı. Olmayan perde öncekine düşer.
const tracks = new Map<number, Howl>();
let musicAct = 1;
let musicVol = 0.45;
let synthMusic: Howl | null = null;

function trackFor(act: number): Howl | null {
  if (tracks.has(act)) return tracks.get(act)!;
  const src = act === 3 ? files.waltz3 ?? files.waltz2 ?? files.waltz : act === 2 ? files.waltz2 ?? files.waltz : files.music ?? files.waltz;
  if (!src) return null;
  const h = new Howl({ src: [src], format: ['mp3'], loop: true, volume: 0 });
  tracks.set(act, h);
  return h;
}

async function buildMusic() {
  if (music) return;
  music = trackFor(musicAct);
  if (music) return;
  if (typeof OfflineAudioContext === 'undefined') return;
  if (!synthMusic) {
    const buf = await renderBuffer(MUSIC.dur, MUSIC.draw, 22050);
    synthMusic = new Howl({ src: [toWavUrl(buf)], format: ['wav'], loop: true, volume: 0.35 });
  }
  music = synthMusic;
}

function startMusic() {
  if (!music || music.playing()) return;
  music.volume(0);
  music.play();
  music.fade(0, musicVol, 1200);
}

// Perde değişince yumuşak geçiş (1,5 sn)
export function setMusicAct(act: number) {
  if (act === musicAct) return;
  musicAct = act;
  if (!music || !musicWanted || !unlocked) {
    music = null;
    return;
  }
  const next = trackFor(act);
  if (!next || next === music) return;
  const prev = music;
  prev.fade(prev.volume(), 0, 1500);
  window.setTimeout(() => prev.stop(), 1600);
  music = next;
  next.volume(0);
  next.play();
  next.fade(0, musicVol, 1500);
}

// Önemli anlarda (kart açılışı, TIK konuşurken) müzik kısılır, sonra geri gelir
export function duckMusic(ms = 2200, level = 0.12) {
  if (!music || !music.playing()) return;
  music.fade(music.volume(), level, 250);
  window.clearTimeout(duckTimer);
  duckTimer = window.setTimeout(() => music?.playing() && music.fade(music.volume(), musicVol, 700), ms);
}
let duckTimer = 0;

// İlk kullanıcı dokunuşunda çağrılır (tarayıcılar sesi ancak bir hareketten sonra açar)
export function installUnlock() {
  const go = () => {
    if (unlocked) return;
    unlocked = true;
    Howler.mute(isMuted());
    building = build().then(() => {
      if (musicWanted) startMusic();
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
export function useMusic(on: boolean, act = 1) {
  useEffect(() => {
    musicWanted = on;
    if (!on) {
      music?.pause();
      return;
    }
    if (!unlocked) return;
    void (building ?? Promise.resolve()).then(async () => {
      await buildMusic();
      if (musicWanted) startMusic();
    });
    return () => {
      musicWanted = false;
      music?.pause();
    };
  }, [on]);
  useEffect(() => {
    setMusicAct(act);
  }, [act]);
}
