// ElevenLabs ile MASA'nın ses efektlerini ve ortam müziğini üretir → public/sfx/*.mp3 + public/sfx/manifest.json
// Anahtar ortamın ağ şifresidir (proxy ekler); koda ya da dosyaya yazılmaz. Kullanım: npx tsx scripts/gen-sounds.ts [ad…]
// Tasarım: kâğıt-mürekkep-mum ışığı meyhanesi; tahta masa, cam kadeh, uzak karga, tiyatro perdesi. Hepsi kısa, kuru ve
// telefon hoparlöründe de anlaşılır olacak şekilde orta frekansta yoğun.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const API = 'https://api.elevenlabs.io/v1';
const OUT = 'public/sfx';

interface Sfx { prompt: string; sec: number; influence?: number; loop?: boolean }

// Ses adları istemcideki SfxName ile aynıdır (src/client/audio/synth.ts)
export const SOUNDS: Record<string, Sfx> = {
  paper: { prompt: 'Three old parchment playing cards being dealt quickly onto a wooden tavern table, dry papery swish and soft slap, close up, no music', sec: 1.0 },
  flip: { prompt: 'A single thick playing card flipped over with a crisp snap on a wooden table, slight room reverb, no music', sec: 0.6 },
  seal: { prompt: 'Hot wax seal stamp pressed firmly onto parchment, soft squelch then a dull wooden thud, close up, no music', sec: 0.9 },
  clink: { prompt: 'Two small tulip-shaped raki glasses clinking together in a cozy tavern, bright glass ting with short ring out, no voices', sec: 1.0 },
  spoon: { prompt: 'A small metal teaspoon stirring and tinkling against a thin Turkish tea glass, three quick clinks, no voices', sec: 1.0 },
  crow: { prompt: 'A single raven caw echoing at night over old wooden houses, eerie but slightly comic, distant', sec: 1.4 },
  organ: { prompt: 'Short dramatic gothic pipe organ chord stab in a minor key, theatrical and slightly comedic, quick decay', sec: 2.0 },
  heartbeat: { prompt: 'One slow deep heartbeat thump, tense, cinematic low end, dry', sec: 0.8 },
  fuse: { prompt: 'Cartoon bomb fuse lit and sizzling, crackling sparks, steady hiss', sec: 3.0, loop: true },
  boom: { prompt: 'Comedic cartoon explosion with a puff of smoke followed by a flutter of bat wings, spooky and funny, not too loud', sec: 1.8 },
  curtain: { prompt: 'Heavy velvet theatre curtain sweeping open with an old wooden pulley creak, small music box twinkle at the end', sec: 2.4 },
  tap: { prompt: 'A single short knock of a knuckle on a wooden table, dry, close', sec: 0.5 },
  right: { prompt: 'Short magical music box twinkle, three ascending celesta notes, gothic but happy, a correct answer chime', sec: 1.2 },
  wrong: { prompt: 'Short comic ghostly descending "wooo" whistle, like a cartoon ghost laughing at a wrong guess, playful', sec: 1.0 },
  bell: { prompt: 'A small brass tavern bell rung once, warm and bright, short ring', sec: 1.2 },
  // Müzik API'si ücretsiz planda kapalı: ses efekti modeliyle 30 sn'lik döngü
  waltz: {
    prompt: 'Instrumental whimsical gothic waltz loop, music box melody with accordion and pizzicato strings, soft upright bass, 3/4 time, D minor, dark carnival but cozy and playful, background music, no vocals',
    sec: 30,
    influence: 0.7,
    loop: true,
  },
  // 2. perde (Kızışma): gerilim, tik tak saat
  waltz2: {
    prompt: 'Instrumental tense gothic waltz loop, accordion and pizzicato strings over a ticking clock, music box countermelody, slightly faster, D minor, playful suspense, background music, no vocals',
    sec: 30,
    influence: 0.7,
    loop: true,
  },
  // 3. perde (Kaos): çılgın karanlık karnaval
  waltz3: {
    prompt: 'Instrumental chaotic dark carnival waltz loop, fast accordion, oompah tuba, wild pizzicato and glitchy music box, frantic but fun, D minor, party background music, no vocals',
    sec: 30,
    influence: 0.7,
    loop: true,
  },
};

const MUSIC_PROMPT =
  'Whimsical gothic waltz for a midnight tavern party game: music box melody, accordion, pizzicato strings, celesta and soft upright bass, ' +
  'dark carnival mood but playful and cozy, 3/4 time, moderate tempo, D minor, instrumental, no vocals, seamless loop, background level';

async function sfx(name: string, d: Sfx): Promise<Buffer> {
  const res = await fetch(`${API}/sound-generation?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': 'proxy-injected' },
    body: JSON.stringify({ text: d.prompt, duration_seconds: d.sec, prompt_influence: d.influence ?? 0.55, loop: !!d.loop }),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function music(): Promise<Buffer> {
  const res = await fetch(`${API}/music?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': 'proxy-injected' },
    body: JSON.stringify({ prompt: MUSIC_PROMPT, music_length_ms: 60_000, force_instrumental: true }),
  });
  if (!res.ok) throw new Error(`music: ${res.status} ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}

mkdirSync(OUT, { recursive: true });
const manifestPath = `${OUT}/manifest.json`;
const manifest: { version: number; files: Record<string, string> } = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : { version: 0, files: {} };
const only = process.argv.slice(2);
const want = only.length ? only : [...Object.keys(SOUNDS), 'music'];
for (const name of want) {
  try {
    const buf = name === 'music' ? await music() : await sfx(name, SOUNDS[name]!);
    writeFileSync(`${OUT}/${name}.mp3`, buf);
    manifest.files[name] = `/sfx/${name}.mp3`;
    console.log(`✓ ${name} (${Math.round(buf.byteLength / 1024)} KB)`);
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
  }
}
manifest.version = Date.now();
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
