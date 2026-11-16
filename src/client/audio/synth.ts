// Ses efektleri ve ortam müziği tarayıcıda sentezlenir (lisans riski yok).
// OfflineAudioContext ile tampona çizilir, WAV'a çevrilip Howler ile çalınır.

export type SfxName =
  | 'paper' | 'flip' | 'seal' | 'clink' | 'spoon' | 'crow' | 'organ' | 'heartbeat'
  | 'fuse' | 'boom' | 'curtain' | 'tap';

const SR = 22050;

type Draw = (ctx: OfflineAudioContext) => void;

function noise(ctx: BaseAudioContext, dur: number): AudioBufferSourceNode {
  const b = ctx.createBuffer(1, Math.ceil(dur * ctx.sampleRate), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource();
  s.buffer = b;
  return s;
}

function env(ctx: BaseAudioContext, t0: number, a: number, d: number, peak = 1): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  return g;
}

function tone(ctx: BaseAudioContext, out: AudioNode, type: OscillatorType, f: number, t0: number, a: number, d: number, peak: number, f2?: number) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + a + d);
  const g = env(ctx, t0, a, d, peak);
  o.connect(g).connect(out);
  o.start(t0);
  o.stop(t0 + a + d + 0.05);
}

function filteredNoise(ctx: BaseAudioContext, out: AudioNode, t0: number, dur: number, type: BiquadFilterType, f: number, peak: number, f2?: number) {
  const n = noise(ctx, dur + 0.05);
  const flt = ctx.createBiquadFilter();
  flt.type = type;
  flt.frequency.setValueAtTime(f, t0);
  if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  const g = env(ctx, t0, Math.min(0.02, dur / 4), dur, peak);
  n.connect(flt).connect(g).connect(out);
  n.start(t0);
}

export const SFX: Record<SfxName, { dur: number; draw: Draw }> = {
  paper: { dur: 0.35, draw: (c) => filteredNoise(c, c.destination, 0, 0.3, 'bandpass', 3000, 0.5, 1200) },
  flip: { dur: 0.3, draw: (c) => { filteredNoise(c, c.destination, 0, 0.12, 'highpass', 2500, 0.5); filteredNoise(c, c.destination, 0.1, 0.12, 'bandpass', 1800, 0.4); } },
  seal: { dur: 0.4, draw: (c) => { tone(c, c.destination, 'sine', 140, 0, 0.005, 0.25, 0.9, 60); filteredNoise(c, c.destination, 0, 0.08, 'lowpass', 900, 0.5); } },
  clink: { dur: 1.2, draw: (c) => { for (const [t, f] of [[0, 2093], [0.12, 2637]] as const) { tone(c, c.destination, 'sine', f, t, 0.002, 0.9, 0.35); tone(c, c.destination, 'sine', f * 2.76, t, 0.002, 0.4, 0.12); } } },
  spoon: { dur: 0.9, draw: (c) => { for (const t of [0, 0.15, 0.3]) { tone(c, c.destination, 'triangle', 3520, t, 0.001, 0.25, 0.25); tone(c, c.destination, 'sine', 5280, t, 0.001, 0.15, 0.1); } } },
  crow: {
    dur: 0.8,
    draw: (c) => {
      for (const t of [0, 0.32]) {
        const o = c.createOscillator();
        const m = c.createOscillator();
        const mg = c.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(900, t);
        o.frequency.exponentialRampToValueAtTime(500, t + 0.25);
        m.frequency.value = 70;
        mg.gain.value = 300;
        m.connect(mg).connect(o.frequency);
        const f = c.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 1400;
        const g = env(c, t, 0.02, 0.25, 0.35);
        o.connect(f).connect(g).connect(c.destination);
        o.start(t); m.start(t); o.stop(t + 0.3); m.stop(t + 0.3);
      }
    },
  },
  organ: {
    dur: 2.6,
    draw: (c) => {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 1800;
      f.connect(c.destination);
      for (const hz of [130.8, 155.6, 196, 261.6, 392]) {
        tone(c, f, 'sawtooth', hz, 0, 0.25, 2.2, 0.08);
        tone(c, f, 'square', hz * 2, 0, 0.3, 2.0, 0.03);
      }
    },
  },
  heartbeat: { dur: 0.6, draw: (c) => { tone(c, c.destination, 'sine', 70, 0, 0.01, 0.15, 0.9, 45); tone(c, c.destination, 'sine', 65, 0.2, 0.01, 0.18, 0.7, 40); } },
  fuse: { dur: 1, draw: (c) => { for (let t = 0; t < 0.95; t += 0.045 + Math.random() * 0.04) filteredNoise(c, c.destination, t, 0.02, 'highpass', 4000, 0.3 * Math.random() + 0.1); } },
  boom: { dur: 1.6, draw: (c) => { filteredNoise(c, c.destination, 0, 1.3, 'lowpass', 1200, 0.9, 120); tone(c, c.destination, 'sine', 90, 0, 0.005, 1.0, 0.9, 30); } },
  curtain: { dur: 1.2, draw: (c) => filteredNoise(c, c.destination, 0, 1.1, 'bandpass', 400, 0.5, 1600) },
  tap: { dur: 0.12, draw: (c) => tone(c, c.destination, 'triangle', 880, 0, 0.002, 0.08, 0.3) },
};

export async function renderBuffer(dur: number, draw: Draw, sampleRate = SR): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(1, Math.ceil(dur * sampleRate), sampleRate);
  draw(ctx);
  return ctx.startRendering();
}

// Müzik kutusu + akordeon valsi (3/4, re minör), yaklaşık 20 sn'lik döngü
export const MUSIC = {
  dur: 20.6,
  draw: (c: OfflineAudioContext) => {
    const bpm = 132;
    const beat = 60 / bpm;
    const master = c.createGain();
    master.gain.value = 0.5;
    master.connect(c.destination);
    const n = (semi: number) => 293.66 * Math.pow(2, semi / 12); // re4'ten yarım ses
    // melodi (yarım sesler), her ölçü 3 vuruş
    const melody = [7, 5, 3, 2, 3, 5, 7, 10, 8, 7, 5, 3, 2, 0, 2, 3, 5, 3, 2, -2, 0, 2, 3, 2, 7, 5, 3, 2, 0, -2, 0, 2, 3, 2, 0, -5];
    melody.forEach((s, i) => {
      const t = i * beat;
      // müzik kutusu: sinüs + kısa sönümlü armonikler
      tone(c, master, 'sine', n(s + 12), t, 0.003, 1.1, 0.16);
      tone(c, master, 'sine', n(s + 12) * 3, t, 0.002, 0.25, 0.03);
    });
    // akordeon: um-pa-pa (bas + iki akor), hafif akortsuz testere, alçak geçiren
    const acc = c.createBiquadFilter();
    acc.type = 'lowpass';
    acc.frequency.value = 900;
    acc.connect(master);
    const chords = [[-12, 3, 7], [-14, 2, 5], [-17, -2, 3], [-12, 3, 7], [-9, 0, 3], [-14, 2, 5], [-17, -2, 2], [-12, 0, 3], [-12, 3, 7], [-14, 2, 5], [-16, -2, 2], [-12, 0, 3]];
    chords.forEach((ch, bar) => {
      const t0 = bar * 3 * beat;
      tone(c, acc, 'sawtooth', n(ch[0]!), t0, 0.03, beat * 0.8, 0.12);
      for (const k of [1, 2]) for (const s of ch.slice(1)) {
        tone(c, acc, 'sawtooth', n(s), t0 + k * beat, 0.02, beat * 0.5, 0.04);
        tone(c, acc, 'sawtooth', n(s) * 1.004, t0 + k * beat, 0.02, beat * 0.5, 0.03);
      }
    });
  },
};

// AudioBuffer → WAV (16 bit PCM) data URI
export function toWavUrl(buf: AudioBuffer): string {
  const data = buf.getChannelData(0);
  const len = data.length;
  const out = new DataView(new ArrayBuffer(44 + len * 2));
  const w = (o: number, s: string) => [...s].forEach((ch, i) => out.setUint8(o + i, ch.charCodeAt(0)));
  w(0, 'RIFF');
  out.setUint32(4, 36 + len * 2, true);
  w(8, 'WAVEfmt ');
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, 1, true);
  out.setUint32(24, buf.sampleRate, true);
  out.setUint32(28, buf.sampleRate * 2, true);
  out.setUint16(32, 2, true);
  out.setUint16(34, 16, true);
  w(36, 'data');
  out.setUint32(40, len * 2, true);
  for (let i = 0; i < len; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i]!)) * 0x7fff, true);
  return URL.createObjectURL(new Blob([out.buffer], { type: 'audio/wav' }));
}
