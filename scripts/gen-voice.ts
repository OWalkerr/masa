// TIK'in sesi: src/client/tik/lines.ts'teki repliklerin hepsini ElevenLabs ile seslendirir, ffmpeg ile "mahzen" rengine sokar.
// Çıktı: public/voice/<anahtar>.mp3 + public/voice/manifest.json (anahtar = metnin özeti, istemci aynı özeti hesaplar).
// Kullanım: npm run gen:voice  (anahtar ortamın ağ şifresi; proxy ekler)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { TIK_LINES, voiceKey } from '../src/client/tik/lines';

const VOICE = 'N2lVS1w4EtoT3dr4eOWO'; // hazır ses: boğuk, yoğun erkek sesi (ücretsiz planda kullanılabilir)
const OUT = 'public/voice';
mkdirSync(OUT, { recursive: true });
const manifestPath = `${OUT}/manifest.json`;
const manifest: Record<string, string> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')).files ?? {} : {};

const lines = [...new Set(Object.values(TIK_LINES).flat())];
let chars = 0;
for (const text of lines) {
  const key = voiceKey(text);
  if (manifest[key] && existsSync(`public${manifest[key]}`)) continue;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': 'proxy-injected' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      // düşük kararlılık + yüksek stil: tiyatral, oynak bir uşak
      voice_settings: { stability: 0.32, similarity_boost: 0.8, style: 0.65, use_speaker_boost: true },
    }),
  });
  if (!res.ok) {
    console.error(`✗ ${text.slice(0, 40)}… ${res.status} ${(await res.text()).slice(0, 200)}`);
    continue;
  }
  const raw = `/tmp/_v_${key}.mp3`;
  writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  // Mahzen rengi: perde %6 aşağı (tempo korunur), kısa taş oda yankısı, seviye eşitleme, baş/son boşluk kırpma
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af',
    'asetrate=44100*0.94,aresample=44100,atempo=1.064,aecho=0.8:0.6:45|90:0.22|0.12,silenceremove=start_periods=1:start_threshold=-45dB,loudnorm=I=-18:TP=-1.5:LRA=7',
    '-ac', '1', '-b:a', '64k', `${OUT}/${key}.mp3`]);
  manifest[key] = `/voice/${key}.mp3`;
  chars += text.length;
  console.log(`✓ ${text}`);
}
writeFileSync(manifestPath, JSON.stringify({ version: Date.now(), files: manifest }, null, 2) + '\n');
console.log(`${Object.keys(manifest).length} replik, bu çalıştırmada ${chars} karakter`);
