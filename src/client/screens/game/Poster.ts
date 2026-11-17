// Gecenin Afişi: özet ekranından tek bir PNG (1080×1350). Fotoğraf yok; yalnızca takma adlar, ödüller ve çizimler.
import type { View } from '../../../engine/viewFor';
import { modeById } from '../../../engine/modes';

export interface PosterAward {
  title: string;
  epitaph: string;
  name: string;
}

const W = 1080;
const H = 1350;
const BONE = '#ede6d6';
const DIM = '#b3aa98';
const PARCH = '#efe6d2';
const INK = '#1d1612';
const GOTH = '"Grenze Gotisch", serif';
const BODY = '"Alegreya Sans", system-ui, sans-serif';

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Parşömen çerçeve içinde mürekkep çizim
function drawArt(ctx: CanvasRenderingContext2D, strokes: number[][], x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#3a2a1e';
  ctx.fillRect(x - 10, y - 10, size + 20, size + 20);
  ctx.strokeStyle = '#c9a96b';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 6, y - 6, size + 12, size + 12);
  ctx.fillStyle = PARCH;
  ctx.fillRect(x, y, size, size);
  const k = size / 1000;
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size * 0.009);
  for (const s of strokes) {
    if (s.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(x + s[0]! * k, y + s[1]! * k);
    for (let i = 2; i < s.length; i += 2) ctx.lineTo(x + s[i]! * k, y + s[i + 1]! * k);
    ctx.stroke();
  }
  ctx.restore();
}

export async function renderPoster(view: View, awards: PosterAward[]): Promise<Blob> {
  try {
    await Promise.all([document.fonts.load(`700 80px ${GOTH}`), document.fonts.load(`800 40px ${BODY}`), document.fonts.load(`italic 700 30px ${BODY}`)]);
  } catch {
    /* yazı tipi yüklenemezse yedek yazı tipiyle çizilir */
  }
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const name = (id: string) => view.players.find((p) => p.id === id)?.name ?? '?';

  // Zemin: gece mürekkebi, ortada mum ışığı, kenarda çizgili bant
  const bg = ctx.createRadialGradient(W / 2, H * 0.35, 80, W / 2, H * 0.4, H * 0.8);
  bg.addColorStop(0, '#2a2330');
  bg.addColorStop(1, '#0d0b10');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  for (let i = -H; i < W + H; i += 28) {
    ctx.fillStyle = BONE;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 14, 0);
    ctx.lineTo(i + 14 - 26, 26);
    ctx.lineTo(i - 26, 26);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(i, H - 26);
    ctx.lineTo(i + 14, H - 26);
    ctx.lineTo(i + 14 - 26, H);
    ctx.lineTo(i - 26, H);
    ctx.fill();
  }
  ctx.restore();

  // Başlık
  ctx.textAlign = 'center';
  ctx.fillStyle = BONE;
  ctx.font = `700 120px ${GOTH}`;
  ctx.fillText('Masa', W / 2, 160);
  ctx.font = `700 52px ${GOTH}`;
  ctx.fillStyle = '#E8B04A';
  ctx.fillText('Gecenin Afişi', W / 2, 225);
  ctx.font = `700 28px ${BODY}`;
  ctx.fillStyle = DIM;
  const date = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const players = view.players.filter((p) => !p.left).length;
  ctx.fillText(`${date} · ${modeById(view.settings.deck).name} · ${players} kişi · ${view.game?.log.length ?? 0} kart`, W / 2, 270);

  // Ödüller: mezar taşları
  const stones = awards.slice(0, 4);
  const sw = 230, sh = 250, gap = 20;
  const sx = (W - (stones.length * sw + (stones.length - 1) * gap)) / 2;
  stones.forEach((a, i) => {
    const x = sx + i * (sw + gap), y = 310;
    ctx.fillStyle = '#c9c2b4';
    ctx.beginPath();
    ctx.moveTo(x, y + sh);
    ctx.lineTo(x, y + 70);
    ctx.quadraticCurveTo(x, y, x + sw / 2, y);
    ctx.quadraticCurveTo(x + sw, y, x + sw, y + 70);
    ctx.lineTo(x + sw, y + sh);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6b6458';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#2a2420';
    ctx.font = `700 24px ${BODY}`;
    ctx.fillText('Burada yatıyor:', x + sw / 2, y + 70);
    ctx.font = `800 34px ${BODY}`;
    ctx.fillText(a.name.slice(0, 13), x + sw / 2, y + 112);
    ctx.font = `700 30px ${GOTH}`;
    wrap(ctx, a.title, sw - 24).forEach((l, j) => ctx.fillText(l, x + sw / 2, y + 152 + j * 30));
    ctx.font = `italic 700 18px ${BODY}`;
    wrap(ctx, a.epitaph, sw - 30).slice(0, 2).forEach((l, j) => ctx.fillText(l, x + sw / 2, y + 205 + j * 21));
  });

  // Eserler: gecenin Rezalet Ödülü + Karakalem çizimleri
  const h = view.game?.highlights;
  let y = 610;
  const arts: { strokes: number[][]; caption: string; ribbon?: string }[] = [];
  if (h?.worst) arts.push({ strokes: h.worst.strokes, caption: `${name(h.worst.by)} · “${h.worst.prompt}”`, ribbon: 'Rezalet Ödülü' });
  for (const a of (h?.arts ?? []).slice(-(h?.worst ? 1 : 2))) arts.push({ strokes: a.strokes, caption: `${name(a.by)} çizdi: “${a.word}”` });
  if (arts.length) {
    const size = 300;
    const ax = (W - (arts.length * size + (arts.length - 1) * 60)) / 2;
    arts.forEach((a, i) => {
      const x = ax + i * (size + 60);
      drawArt(ctx, a.strokes, x, y, size);
      if (a.ribbon) {
        ctx.fillStyle = '#D7263D';
        ctx.fillRect(x + 40, y - 28, size - 80, 40);
        ctx.fillStyle = BONE;
        ctx.font = `800 24px ${BODY}`;
        ctx.fillText(a.ribbon, x + size / 2, y);
      }
      ctx.fillStyle = BONE;
      ctx.font = `700 24px ${BODY}`;
      wrap(ctx, a.caption, size + 40).slice(0, 2).forEach((l, j) => ctx.fillText(l, x + size / 2, y + size + 44 + j * 28));
    });
    y += 300 + 110;
  }

  // Komik yanlış tahminler: konuşma balonları
  const wrong = (h?.wrong ?? []).slice(-4);
  if (wrong.length) {
    ctx.font = `700 34px ${GOTH}`;
    ctx.fillStyle = '#E8B04A';
    ctx.fillText('Gecenin yanlış tahminleri', W / 2, y);
    y += 24;
    ctx.font = `700 26px ${BODY}`;
    wrong.forEach((w, i) => {
      const text = `${name(w.by)}: “${w.text}?” (doğrusu: ${w.word})`;
      const tw = Math.min(W - 160, ctx.measureText(text).width + 50);
      const bx = (W - tw) / 2, by = y + 14 + i * 58;
      ctx.fillStyle = PARCH;
      ctx.beginPath();
      ctx.roundRect(bx, by, tw, 44, 14);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillText(text.length > 60 ? text.slice(0, 58) + '…' : text, W / 2, by + 31);
    });
    y += 14 + wrong.length * 58 + 20;
  }

  // Gecenin karnesi: boşluğu dolduracak kadar oyuncu (en cesurdan)
  const room = H - 190 - y;
  const rowsFit = Math.max(0, Math.floor((room - 60) / 50));
  if (rowsFit >= 2) {
    const list = view.players
      .filter((p) => !p.left && view.stats[p.id])
      .sort((a, b) => view.stats[b.id]!.courage - view.stats[a.id]!.courage)
      .slice(0, rowsFit);
    ctx.font = `700 40px ${GOTH}`;
    ctx.fillStyle = '#E8B04A';
    ctx.fillText('Gecenin karnesi', W / 2, y + 30);
    list.forEach((p, i) => {
      const st = view.stats[p.id]!;
      const ry = y + 70 + i * 50;
      ctx.fillStyle = i % 2 ? '#ffffff08' : '#ffffff12';
      ctx.fillRect(170, ry - 32, W - 340, 44);
      ctx.textAlign = 'left';
      ctx.fillStyle = BONE;
      ctx.font = `800 30px ${BODY}`;
      ctx.fillText(`${i + 1}. ${p.name}`, 195, ry);
      ctx.textAlign = 'right';
      ctx.font = `700 26px ${BODY}`;
      ctx.fillStyle = DIM;
      ctx.fillText(`cesaret ${st.courage} · ${view.settings.drinking ? 'içti' : 'ceza'} ${st.paidUnits}`, W - 195, ry);
      ctx.textAlign = 'center';
    });
    y += 70 + list.length * 50 + 10;
  }

  // Toplam
  const total = Object.values(view.stats).reduce((a, s) => a + s.paidUnits, 0);
  ctx.font = `800 30px ${BODY}`;
  ctx.fillStyle = BONE;
  ctx.fillText(view.settings.drinking ? `Masa bu gece toplam ${total} yudum içti.` : `Masa bu gece toplam ${total} ceza aldı.`, W / 2, Math.min(H - 100, Math.max(y + 46, H - 140)));
  ctx.font = `italic 700 24px ${BODY}`;
  ctx.fillStyle = DIM;
  ctx.fillText(`${location.host} · sorumlu iç, araba kullanacaksan içme`, W / 2, H - 56);

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Afiş çizilemedi'))), 'image/png'));
}
